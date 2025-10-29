import React, { useState, useEffect } from 'react';
import { Product, ProductType } from '../types';

interface AddProductFormProps {
  onAdd: (product: Omit<Product, 'id' | 'createdAt' | 'descriptionEmbedding'>) => void;
  onClose: () => void;
  onUpdate?: (product: Product) => void;
  initialProduct?: Product | null;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onAdd, onClose, onUpdate, initialProduct }) => {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [type, setType] = useState<ProductType>(initialProduct?.type ?? ProductType.Solution);

  useEffect(() => {
    setName(initialProduct?.name ?? '');
    setDescription(initialProduct?.description ?? '');
    setPrice(initialProduct ? String(initialProduct.price) : '');
    setType(initialProduct?.type ?? ProductType.Solution);
  }, [initialProduct?.id]);

  const isEditing = Boolean(initialProduct);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const payload = {
      name,
      description,
      price: Number(price),
      type,
    };

    if (isEditing && initialProduct && onUpdate) {
      onUpdate({ ...initialProduct, ...payload });
    } else {
      onAdd(payload);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Product Name</label>
        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-text-secondary">Price ($)</label>
          <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-text-secondary">Product Type</label>
          <select id="type" value={type} onChange={e => setType(e.target.value as ProductType)} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
            {Object.values(ProductType).map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-background border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-secondary">Cancel</button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
        >
          {isEditing ? 'Update Product' : 'Add Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductForm;
