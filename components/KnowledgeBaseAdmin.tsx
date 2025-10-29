import React, { useCallback, useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { KnowledgeDocument } from '../types';
import {
    fetchKnowledgeDocuments,
    createManualKnowledgeEntry,
    deleteKnowledgeDocument,
    uploadKnowledgeFile,
} from '../services/knowledgeService';
import { PlusIcon } from './icons';
import { TrashIcon, RefreshCwIcon, LoaderIcon } from './adminIcons';


type AsyncState<T> = {
    data: T;
    loading: boolean;
    error: string | null;
};

const defaultFormState = {
    title: '',
    description: '',
    content: '',
};

type UploadStatus = 'pending' | 'processing' | 'success' | 'error';

interface UploadItem {
    id: string;
    file: File;
    fileName: string;
    status: UploadStatus;
    progress?: string | null;
    error?: string | null;
    createdAt: number;
}

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
}

const generateId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf');
let pdfjsLibPromise: Promise<PdfJsModule> | null = null;

const loadPdfJs = async (): Promise<PdfJsModule> => {
    if (!pdfjsLibPromise) {
        pdfjsLibPromise = Promise.all([
            import('pdfjs-dist/legacy/build/pdf'),
            import('pdfjs-dist/legacy/build/pdf.worker?url'),
        ]).then(([lib, worker]) => {
            (lib as any).GlobalWorkerOptions.workerSrc = (worker as any).default;
            return lib as PdfJsModule;
        });
    }
    return pdfjsLibPromise;
};

const extractTextFromCsv = async (text: string): Promise<string> => {
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    return (result.data as string[][])
        .map((row) => row.filter(Boolean).join(' | '))
        .join('\n');
};

const extractTextFromWorkbook = async (buffer: ArrayBuffer): Promise<string> => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sections: string[] = [];
    workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<string[]>;
        const content = rows
            .map((row) => (Array.isArray(row) ? row.filter(Boolean).join(' | ') : String(row)))
            .join('\n');
        sections.push(`# ${sheetName}\n${content}`);
    });
    return sections.join('\n\n');
};

const extractTextFromDocx = async (buffer: ArrayBuffer): Promise<string> => {
    try {
        const mammoth = await import('mammoth/mammoth.browser') as any;
        const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
        const cleaned = value
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
        if (cleaned) {
            return cleaned;
        }
        console.warn('DOCX parser returned empty content, falling back to XML extraction.');
    } catch (mammothError) {
        console.warn('Primary DOCX parser failed, attempting XML fallback.', mammothError);
    }

    try {
        const zip = await JSZip.loadAsync(buffer);
        const documentXml = await zip.file('word/document.xml')?.async('string');
        if (!documentXml) {
            throw new Error('Khong tim thay noi dung chinh trong file DOCX.');
        }
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Khong the phan tich noi dung DOCX.');
        }
        const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS('*', 'p')) as Element[];
        const lines = paragraphs
            .map((p) => {
                const runs = Array.from(p.getElementsByTagNameNS('*', 't')) as Element[];
                const text = runs.map((node) => node.textContent ?? '').join('');
                return text.replace(/\s+/g, ' ').trim();
            })
            .filter(Boolean);
        const fallback = lines.join('\n').trim();
        if (!fallback) {
            throw new Error('Khong doc duoc noi dung tu file DOCX.');
        }
        return fallback;
    } catch (fallbackError) {
        console.error('DOCX fallback parser failed.', fallbackError);
        throw new Error('Khong doc duoc noi dung tu file DOCX. Vui long kiem tra dinh dang tai lieu.');
    }
};

const extractTextFromPdf = async (buffer: ArrayBuffer): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const strings = content.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .filter(Boolean);
        pageTexts.push(strings.join(' '));
    }
    return pageTexts.join('\n');
};

const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) {
        return await file.text();
    }

    if (extension === 'txt' || extension === 'md' || extension === 'json') {
        return await file.text();
    }

    if (extension === 'csv') {
        const raw = await file.text();
        return extractTextFromCsv(raw);
    }

    const buffer = await file.arrayBuffer();

    if (extension === 'xls' || extension === 'xlsx') {
        return extractTextFromWorkbook(buffer);
    }

    if (extension === 'docx') {
        return extractTextFromDocx(buffer);
    }

    if (extension === 'pdf') {
        return extractTextFromPdf(buffer);
    }

    return new TextDecoder().decode(buffer);
};

const KnowledgeBaseAdmin: React.FC = () => {
    const [docsState, setDocsState] = useState<AsyncState<KnowledgeDocument[]>>({
        data: [],
        loading: true,
        error: null,
    });
    const [formState, setFormState] = useState(defaultFormState);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const uploadItemsRef = useRef<UploadItem[]>([]);
    const processingUploadsRef = useRef(false);

    useEffect(() => {
        uploadItemsRef.current = uploadItems;
    }, [uploadItems]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = generateId();
            setToasts((prev) => [...prev, { id, ...toast }]);
            window.setTimeout(() => removeToast(id), 5000);
        },
        [removeToast],
    );

    const loadDocuments = useCallback(async () => {
        setDocsState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const docs = await fetchKnowledgeDocuments();
            setDocsState({ data: docs, loading: false, error: null });
        } catch (error) {
            console.error(error);
            setDocsState({ data: [], loading: false, error: 'Khong the tai danh sach knowledge base.' });
        }
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const updateUploadItem = useCallback((id: string, patch: Partial<UploadItem>) => {
        setUploadItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
    }, []);

    const processKnowledgeFile = useCallback(
        async (item: UploadItem) => {
            const report = (message: string | null) => updateUploadItem(item.id, { progress: message });

            report('Dang tai len Supabase Storage...');
            const uploadMeta = await uploadKnowledgeFile(item.file);

            report('Dang doc noi dung tu tep...');
            const text = await extractTextFromFile(item.file);
            if (!text || text.trim().length === 0) {
                throw new Error('Khong doc duoc noi dung tu tep da tai len.');
            }

            report('Dang chia nho va sinh embedding...');
            const baseDescription = `Imported from ${uploadMeta.fileName} (${uploadMeta.mimeType ?? 'unknown'})`;
            const titleFromFile = uploadMeta.fileName.replace(/\.[^/.]+$/, '');

            await createManualKnowledgeEntry({
                title: titleFromFile,
                description: baseDescription,
                content: text,
                sourceType: 'file',
                fileName: uploadMeta.fileName,
                mimeType: uploadMeta.mimeType,
                storagePath: uploadMeta.storagePath,
            });

            return uploadMeta.fileName;
        },
        [updateUploadItem],
    );

    const processUploadQueue = useCallback(async () => {
        if (processingUploadsRef.current) {
            return;
        }
        processingUploadsRef.current = true;
        try {
            while (true) {
                const nextItem = uploadItemsRef.current.find((item) => item.status === 'pending');
                if (!nextItem) {
                    break;
                }

                updateUploadItem(nextItem.id, {
                    status: 'processing',
                    progress: 'Dang khoi tao...',
                    error: null,
                });

                try {
                    const fileName = await processKnowledgeFile(nextItem);
                    updateUploadItem(nextItem.id, {
                        status: 'success',
                        progress: 'Hoan tat',
                        error: null,
                    });
                    pushToast({
                        variant: 'success',
                        title: 'Upload thanh cong',
                        description: fileName,
                    });
                    await loadDocuments();
                } catch (error: any) {
                    const message = error?.message ?? 'Khong the xu ly tep duoc tai len.';
                    console.error(error);
                    updateUploadItem(nextItem.id, {
                        status: 'error',
                        progress: null,
                        error: message,
                    });
                    pushToast({
                        variant: 'error',
                        title: 'Upload that bai',
                        description: `${nextItem.fileName}: ${message}`,
                    });
                }
            }
        } finally {
            processingUploadsRef.current = false;
        }
    }, [loadDocuments, processKnowledgeFile, pushToast, updateUploadItem]);

    useEffect(() => {
        if (uploadItems.some((item) => item.status === 'pending')) {
            processUploadQueue();
        }
    }, [uploadItems, processUploadQueue]);

    const enqueueFiles = useCallback((files: File[]) => {
        const nextItems = files.map((file) => ({
            id: generateId(),
            file,
            fileName: file.name,
            status: 'pending' as UploadStatus,
            progress: 'Cho xu ly...',
            error: null,
            createdAt: Date.now(),
        }));
        if (!nextItems.length) {
            return;
        }
        setUploadItems((prev) => [...prev, ...nextItems]);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList?.length) return;
        const files = Array.from(fileList);
        event.target.value = '';
        enqueueFiles(files);
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    const clearCompletedUploads = () => {
        setUploadItems((prev) => prev.filter((item) => item.status === 'pending' || item.status === 'processing'));
    };

    const resetForm = () => {
        setFormState(defaultFormState);
        setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const trimmedTitle = formState.title.trim();
        const trimmedContent = formState.content.trim();
        if (!trimmedTitle || !trimmedContent) {
            setFormError('Vui long nhap tieu de va noi dung.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createManualKnowledgeEntry({
                title: trimmedTitle,
                description: formState.description.trim() || undefined,
                content: trimmedContent,
                sourceType: 'manual',
            });
            pushToast({
                variant: 'success',
                title: 'Da them knowledge base moi',
                description: trimmedTitle,
            });
            setFormError(null);
            resetForm();
            await loadDocuments();
        } catch (error: any) {
            console.error(error);
            const message = error?.message ?? 'Khong the tao knowledge base.';
            setFormError(message);
            pushToast({
                variant: 'error',
                title: 'Khong the tao knowledge base',
                description: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (doc: KnowledgeDocument) => {
        if (!window.confirm(`Ban co chac muon xoa "${doc.title}"?`)) {
            return;
        }
        try {
            await deleteKnowledgeDocument(doc.id, doc.storagePath);
            pushToast({
                variant: 'info',
                title: 'Da xoa knowledge base',
                description: doc.title,
            });
            await loadDocuments();
        } catch (error) {
            console.error(error);
            setFormError('Khong the xoa knowledge base.');
            pushToast({
                variant: 'error',
                title: 'Khong the xoa knowledge base',
                description: doc.title,
            });
        }
    };

    const uploadStatusMeta: Record<UploadStatus, { label: string; className: string }> = {
        pending: { label: 'Cho xu ly', className: 'text-text-secondary' },
        processing: { label: 'Dang xu ly', className: 'text-sky-300' },
        success: { label: 'Hoan tat', className: 'text-emerald-300' },
        error: { label: 'That bai', className: 'text-red-300' },
    };

    const hasCompletedUploads = uploadItems.some((item) => item.status === 'success' || item.status === 'error');
    const isProcessingUploads = uploadItems.some((item) => item.status === 'processing');

    const toastClasses: Record<ToastVariant, string> = {
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
        error: 'border-red-500/40 bg-red-500/10 text-red-100',
        info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
    };

    return (
        <div className="p-8 space-y-8">
            <div className="fixed top-6 right-6 z-50 space-y-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`w-80 rounded-lg border px-4 py-3 shadow-lg transition-opacity ${toastClasses[toast.variant]}`}
                    >
                        <div className="font-semibold text-sm">{toast.title}</div>
                        {toast.description && <div className="text-xs mt-1 leading-relaxed">{toast.description}</div>}
                    </div>
                ))}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.csv,.xls,.xlsx,.json"
                className="hidden"
                onChange={handleFileChange}
            />
            <div className="bg-surface border border-border rounded-lg p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Knowledge Base</h2>
                        <p className="text-sm text-text-secondary max-w-2xl">
                            Tai lieu co the upload truc tiep (PDF, DOCX, CSV, XLSX, TXT) hoac dan noi dung thu cong. He thong tu dong chunk ~1200 ky tu, chong lap 150 ky tu va sinh embedding cho tung doan.
                        </p>
                    </div>
                    <button
                        onClick={loadDocuments}
                        className="inline-flex items-center gap-2 bg-secondary text-sm px-3 py-2 rounded-md hover:bg-secondary/70"
                        disabled={docsState.loading}
                    >
                        {docsState.loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}
                        Lam moi
                    </button>
                </div>

                <div className="mb-6 bg-background-alt/40 border border-border rounded-lg p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="font-semibold">Upload tep tai lieu</h3>
                            <p className="text-xs text-text-secondary max-w-2xl">
                                File se duoc tai len Supabase Storage &ldquo;knowledge-files&rdquo;, sau do duoc tach chunk, embed va them vao AI knowledge base. Ban co the chon nhieu tep va he thong se xu ly lan luot.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasCompletedUploads && (
                                <button
                                    type="button"
                                    onClick={clearCompletedUploads}
                                    className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Xoa muc hoan tat
                                </button>
                            )}
                            <button
                                onClick={handleFileButtonClick}
                                type="button"
                                className="inline-flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-primary-hover"
                            >
                                {isProcessingUploads ? (
                                    <LoaderIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                    <PlusIcon className="h-4 w-4" />
                                )}
                                Them tep
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                        {uploadItems.length === 0 && (
                            <div className="text-xs text-text-secondary border border-dashed border-border/80 rounded-md px-3 py-4 text-center">
                                Chua co tep nao trong hang doi. Hay chon tep de bat dau.
                            </div>
                        )}
                        {uploadItems
                            .slice()
                            .sort((a, b) => a.createdAt - b.createdAt)
                            .map((item) => (
                                <div key={item.id} className="border border-border/70 rounded-md px-3 py-2 bg-background/40">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-text-primary truncate pr-2">{item.fileName}</span>
                                        <span className={`text-xs font-semibold uppercase ${uploadStatusMeta[item.status].className}`}>
                                            {uploadStatusMeta[item.status].label}
                                        </span>
                                    </div>
                                    {item.progress && (
                                        <p className="text-xs text-text-secondary mt-1">{item.progress}</p>
                                    )}
                                    {item.error && (
                                        <p className="text-xs text-red-300 mt-1">{item.error}</p>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>

                {formError && (
                    <div className="mb-3 text-sm px-3 py-2 rounded-md border border-red-500/40 bg-red-500/10 text-red-200">
                        {formError}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-semibold mb-1" htmlFor="title">
                            Tieu de<span className="text-red-400">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formState.title}
                            onChange={handleInputChange}
                            className="w-full bg-background-alt border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Chinh sach bao hanh moi"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1" htmlFor="description">
                            Mo ta ngan
                        </label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            value={formState.description}
                            onChange={handleInputChange}
                            className="w-full bg-background-alt border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Noi dung tom tat de lay bối cảnh"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1" htmlFor="content">
                            Noi dung chi tiet<span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formState.content}
                            onChange={handleInputChange}
                            className="w-full h-48 bg-background-alt border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60"
                            placeholder="Dan nguon noi dung sau khi ban da dung script CLI de chuyen doi tu file tai lieu..."
                            required
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            He thong se tu dong chia nho noi dung va embbeding hoa tung doan.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-hover disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        <PlusIcon className="h-4 w-4" />
                        {isSubmitting ? 'Dang xu ly...' : 'Them vao knowledge base'}
                    </button>
                </form>
            </div>

            <div className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Knowledge base da co</h3>
                        <p className="text-xs text-text-secondary">
                            Chi tai khoan super admin moi xem va quan ly du lieu nay.
                        </p>
                    </div>
                    <span className="text-sm text-text-secondary">
                        Tong so: {docsState.data.length}
                    </span>
                </div>

                <div className="divide-y divide-border">
                    {docsState.loading && (
                        <div className="p-6 text-center text-text-secondary">Dang tai...</div>
                    )}
                    {!docsState.loading && docsState.data.length === 0 && (
                        <div className="p-6 text-center text-text-secondary">Chua co knowledge base nao.</div>
                    )}
                    {docsState.data.map((doc) => (
                        <div key={doc.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-secondary/20 transition-colors">
                            <div>
                                <h4 className="font-semibold text-text-primary">{doc.title}</h4>
                                {doc.description && (
                                    <p className="text-sm text-text-secondary mt-1">{doc.description}</p>
                                )}
                                <div className="text-xs text-text-secondary mt-2 space-x-3">
                                    <span>Source: {doc.sourceType}</span>
                                    {doc.chunkCount !== undefined && <span>Chunks: {doc.chunkCount}</span>}
                                    <span>Created: {new Date(doc.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(doc)}
                                className="text-sm text-red-400 hover:text-red-200 inline-flex items-center gap-2"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Xoa
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseAdmin;

