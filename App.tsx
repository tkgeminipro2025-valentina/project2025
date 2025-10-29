import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthGate from './components/AuthGate';
import Dashboard from './components/Dashboard';
import Organizations from './components/Organizations';
import Contacts from './components/Contacts';
import Deals from './components/Deals';
import Tasks from './components/Tasks';
import Projects from './components/Projects';
import Employees from './components/Employees';
import Products from './components/Products';
import KnowledgeBaseAdmin from './components/KnowledgeBaseAdmin';
import UserManagement from './components/UserManagement';
import Modal from './components/Modal';
import AddOrganizationForm from './components/AddOrganizationForm';
import AddContactForm from './components/AddContactForm';
import AddDealForm from './components/AddDealForm';
import AddTaskForm from './components/AddTaskForm';
import AddProjectForm from './components/AddProjectForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import AddProductForm from './components/AddProductForm';
import * as crmService from './services/crmService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { getCurrentUserProfile } from './services/authService';
import {
  listManagedUsers,
  createManagedUser,
  updateManagedUserRole,
  deactivateManagedUser,
  activateManagedUser,
  deleteManagedUser,
  CreateManagedUserPayload,
} from './services/userAdminService';
import { ROLE_PERMISSIONS, DEFAULT_ROLE } from './constants';
import {
  View,
  ModalType,
  Organization,
  Contact,
  Deal,
  Employee,
  Product,
  Project,
  Task,
  DealStage,
  UserProfile,
  UserRole,
} from './types';
import {
  mockOrganizations,
  mockContacts,
  mockDeals,
  mockEmployees,
  mockProducts,
  mockProjects,
  mockTasks,
} from './data/mockData';

const AIAssistant = React.lazy(() => import('./components/AIAssistant'));
const Analytics = React.lazy(() => import('./components/Analytics'));

const MODAL_LABELS: Record<Exclude<ModalType, null>, string> = {
  organizations: 'Organization',
  contacts: 'Contact',
  deals: 'Deal',
  tasks: 'Task',
  projects: 'Project',
  employees: 'Employee',
  products: 'Product',
  'edit-employee': 'Employee',
  'edit-product': 'Product',
};

type DetailRow = { label: string; value: React.ReactNode };
type DetailModalPayload = { title: string; rows: DetailRow[] };

const formatRoleLabel = (role: UserRole) =>
  role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [modal, setModal] = useState<ModalType>(null);
  const [detailModal, setDetailModal] = useState<DetailModalPayload | null>(null);
  const [employeeBeingEdited, setEmployeeBeingEdited] = useState<Employee | null>(null);
  const [productBeingEdited, setProductBeingEdited] = useState<Product | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>(isSupabaseConfigured ? DEFAULT_ROLE : 'super_admin');
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionId, setUserActionId] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userNotice, setUserNotice] = useState<string | null>(null);

  const permissions = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[DEFAULT_ROLE];
  const canManageRecords = permissions.canManageRecords || profile?.isAdmin || role === 'super_admin';
  const canViewAnalytics = permissions.canViewAnalytics || profile?.isAdmin || role === 'super_admin';
  const canDragDeals = permissions.canDragDeals || profile?.isAdmin || role === 'super_admin';
  const canManageUsers = role === 'super_admin';
  const canManageKnowledge = profile?.isAdmin || role === 'super_admin';

  const loadUserProfile = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setProfile(null);
      setRole('super_admin');
      return;
    }
    try {
      const nextProfile = await getCurrentUserProfile();
      if (nextProfile) {
        setProfile(nextProfile);
        setRole(nextProfile.role ?? DEFAULT_ROLE);
        setAuthError(null);
      } else {
        setProfile(null);
        setRole(DEFAULT_ROLE);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setAuthError('Khong the tai thong tin nguoi dung. Vui long thu lai.');
      setProfile(null);
      setRole(DEFAULT_ROLE);
    }
  }, []);

  const refreshUserList = useCallback(async () => {
    if (!isSupabaseConfigured || !canManageUsers) {
      return;
    }
    try {
      setUsersLoading(true);
      setUserError(null);
      setUserNotice(null);
      const nextUsers = await listManagedUsers();
      setUsers(nextUsers);
    } catch (err) {
      console.error('Failed to load managed users:', err);
      setUserError(err instanceof Error ? err.message : 'Khong the tai danh sach nguoi dung.');
    } finally {
      setUsersLoading(false);
    }
  }, [canManageUsers]);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setOrganizations(mockOrganizations);
      setContacts(mockContacts);
      setDeals(mockDeals);
      setEmployees(mockEmployees);
      setProducts(mockProducts);
      setProjects(mockProjects);
      setTasks(mockTasks);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [orgs, conts, dls, emps, prods, projs, tsks] = await Promise.all([
        crmService.getOrganizations(),
        crmService.getContacts(),
        crmService.getDeals(),
        crmService.getEmployees(),
        crmService.getProducts(),
        crmService.getProjects(),
        crmService.getTasks(),
      ]);
      setOrganizations(orgs);
      setContacts(conts);
      setDeals(dls);
      setEmployees(emps);
      setProducts(prods);
      setProjects(projs);
      setTasks(tsks);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Khong the ket noi toi Supabase. Dang hien thi du lieu mau.');
      setOrganizations(mockOrganizations);
      setContacts(mockContacts);
      setDeals(mockDeals);
      setEmployees(mockEmployees);
      setProducts(mockProducts);
      setProjects(mockProjects);
      setTasks(mockTasks);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        console.log('App: Initializing auth session...');
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) throw error;
        console.log('App: Auth session initialized successfully:', data);
        setSession(data?.session ?? null);
        if (data?.session) {
          await loadUserProfile();
        }
      } catch (err) {
        console.error('App: Failed to initialise auth session:', err);
        if (isMounted) {
          setAuthError('Khong the khoi tao phien dang nhap. Vui long thu lai.');
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('App: Auth state changed:', _event, newSession);
      setSession(newSession);
      if (newSession) {
        await loadUserProfile();
      } else {
        setProfile(null);
        setRole(DEFAULT_ROLE);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [loadUserProfile, supabase]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      if (authLoading || !session) return;
    }
    fetchData();
  }, [fetchData, authLoading, session]);

  useEffect(() => {
    if (currentView === 'users' && canManageUsers) {
      refreshUserList();
    }
  }, [currentView, canManageUsers, refreshUserList]);

  const handleSignIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase chua duoc cau hinh.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);
    setPendingConfirmationEmail(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err?.message ?? 'Dang nhap that bai. Vui long thu lai.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase chua duoc cau hinh.');
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    setAuthNotice(null);
    setPendingConfirmationEmail(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            default_role: 'staff',
          },
        },
      });
      if (error) throw error;
      if (data?.user) {
        setPendingConfirmationEmail(data.user.email ?? email);
      }
      if (!data.session) {
        setAuthNotice('Dang ky thanh cong. Vui long kiem tra email de xac nhan tai khoan.');
      } else {
        setAuthNotice('Dang ky thanh cong.');
      }
    } catch (err: any) {
      console.error('Sign up failed:', err);
      setAuthError(err?.message ?? 'Dang ky that bai. Vui long thu lai.');
      setPendingConfirmationEmail(null);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setAuthNotice(null);
    if (!isSupabaseConfigured) {
      setProfile(null);
      setRole('super_admin');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Failed to sign out:', err);
      setAuthError('Khong the dang xuat. Thu lai sau.');
    }
  };

  const handleUpdateDealStage = async (dealId: string, newStage: DealStage) => {
    if (!canDragDeals) {
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    setError(null);
    try {
      const updatedDeal = await crmService.updateDealStage(dealId, newStage);
      setDeals((prev) => prev.map((deal) => (deal.id === dealId ? updatedDeal : deal)));
    } catch (err) {
      console.error('Failed to update deal stage:', err);
      setError('Khong the cap nhat trang thai giao dich. Vui long thu lai.');
    }
  };

  const handleMarkTaskDone = async (task: Task) => {
    if (!canManageRecords) {
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    try {
      const updatedTask = { ...task, status: 'Done' as const };
      await crmService.updateTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
      setNotice('Đã cập nhật trạng thái nhiệm vụ.');
    } catch (err) {
      console.error('Failed to mark task done:', err);
      setError('Không thể cập nhật trạng thái nhiệm vụ. Vui lòng thử lại.');
    }
  };
  const handleDeleteProject = async (project: Project) => {
    if (!canManageRecords) {
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    if (!window.confirm(`Ban co chac chan muon xoa du an "${project.projectName}"?`)) {
      return;
    }
    try {
      await crmService.deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setNotice('Da xoa du an.');
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError('Khong the xoa du an. Vui long thu lai.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!canManageRecords) {
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    if (!window.confirm(`Ban co chac chan muon xoa nhiem vu "${task.title}"?`)) {
      return;
    }
    try {
      await crmService.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setNotice('Da xoa nhiem vu.');
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Khong the xoa nhiem vu. Vui long thu lai.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!canManageRecords) {
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    if (!window.confirm(`Ban co chac chan muon xoa san pham "${product.name}"?`)) {
      return;
    }
    try {
      await crmService.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setNotice('Da xoa san pham.');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Khong the xoa san pham. Vui long thu lai.');
    }
  };


  const handleAdd = async (type: ModalType, payload: any) => {
    if (!canManageRecords) {
      setModal(null);
      setError('Tai khoan cua ban chi duoc phep xem du lieu.');
      return;
    }
    setError(null);
    try {
      switch (type) {
        case 'organizations': {
          const created = await crmService.addOrganization(payload);
          setOrganizations((prev) => [created, ...prev]);
          setNotice('Đã thêm Organization mới.');
          break;
        }
        case 'contacts': {
          const created = await crmService.addContact(payload);
          setContacts((prev) => [created, ...prev]);
          setNotice('Đã thêm Contact mới.');
          break;
        }
        case 'deals': {
          const created = await crmService.addDeal(payload);
          setDeals((prev) => [created, ...prev]);
          setNotice('Đã thêm Deal mới.');
          break;
        }
        case 'tasks': {
          const created = await crmService.addTask(payload);
          setTasks((prev) => [created, ...prev]);
          setNotice('Đã thêm Task mới.');
          break;
        }
        case 'projects': {
          const created = await crmService.addProject(payload);
          setProjects((prev) => [created, ...prev]);
          setNotice('Đã thêm Project mới.');
          break;
        }
        case 'employees': {
          const created = await crmService.addEmployee(payload);
          setEmployees((prev) => [created, ...prev]);
          setNotice('Đã thêm Employee mới.');
          break;
        }
        case 'products': {
          const created = await crmService.addProduct(payload);
          setProducts((prev) => [created, ...prev]);
          setNotice('Đã thêm Product mới.');
          break;
        }
        case 'edit-employee': {
          const updated = await crmService.updateEmployee(payload);
          setEmployees((prev) => prev.map((employee) => (employee.id === updated.id ? updated : employee)));
          setNotice('Đã cập nhật thông tin nhân viên.');
          break;
        }
        case 'edit-product': {
          const updated = await crmService.updateProduct(payload);
          setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
          setNotice('Đã cập nhật sản phẩm.');
          break;
        }
        default:
          break;
      }
      setModal(null);
      setEmployeeBeingEdited(null);
      setProductBeingEdited(null);
    } catch (err) {
      console.error(`Failed to add/update ${type}:`, err);
      setError('Không thể thực hiện thao tác. Vui lòng kiểm tra lại cấu hình Supabase.');
    }
  };

  const openOrganizationDetails = (organization: Organization) => {
    setDetailModal({
      title: organization.name,
      rows: [
        { label: 'Industry', value: organization.industry ?? 'N/A' },
        { label: 'Website', value: organization.website ? <a className="text-primary hover:underline" href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`} target="_blank" rel="noreferrer">{organization.website}</a> : 'N/A' },
        { label: 'Phone', value: organization.phone ?? 'N/A' },
        { label: 'Address', value: organization.address ?? 'N/A' },
        { label: 'Description', value: organization.description ?? 'N/A' },
      ],
    });
  };

  const openContactDetails = (contact: Contact) => {
    const orgName = organizations.find((org) => org.id === contact.organizationId)?.name ?? 'N/A';
    setDetailModal({
      title: contact.fullName,
      rows: [
        { label: 'Email', value: <a className="text-primary hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a> },
        { label: 'Phone', value: contact.phone ?? 'N/A' },
        { label: 'Title', value: contact.title ?? 'N/A' },
        { label: 'Status', value: contact.status },
        { label: 'Organization', value: orgName },
      ],
    });
  };

  const openEmployeeDetails = (employee: Employee) => {
    setDetailModal({
      title: employee.fullName,
      rows: [
        { label: 'Job Title', value: employee.jobTitle },
        { label: 'Phone', value: employee.phone ?? 'N/A' },
      ],
    });
  };

  const openTaskDetails = (task: Task) => {
    setDetailModal({
      title: task.title,
      rows: [
        { label: 'Due Date', value: task.dueDate },
        { label: 'Priority', value: task.priority },
        { label: 'Status', value: task.status },
        {
          label: 'Related To',
          value:
            task.relatedTo?.type === 'deal'
              ? `Deal: ${deals.find((d) => d.id === task.relatedTo?.id)?.dealName ?? task.relatedTo?.id}`
              : task.relatedTo?.type === 'contact'
              ? `Contact: ${contacts.find((c) => c.id === task.relatedTo?.id)?.fullName ?? task.relatedTo?.id}`
              : task.relatedTo?.type === 'project'
              ? `Project: ${projects.find((p) => p.id === task.relatedTo?.id)?.projectName ?? task.relatedTo?.id}`
              : 'N/A',
        },
      ],
    });
  };

  const openProjectDetails = (project: Project) => {
    const organizationName = organizations.find((org) => org.id === project.organizationId)?.name ?? 'N/A';
    const managerName = employees.find((emp) => emp.id === project.managerEmployeeId)?.fullName ?? 'N/A';
    setDetailModal({
      title: project.projectName,
      rows: [
        { label: 'Organization', value: organizationName },
        { label: 'Manager', value: managerName },
        { label: 'Start Date', value: project.startDate ?? 'N/A' },
        { label: 'End Date', value: project.endDate ?? 'N/A' },
        { label: 'Status', value: project.status.replace('_', ' ') },
        { label: 'Description', value: project.description ?? 'N/A' },
      ],
    });
  };

  const openProductDetails = (product: Product) => {
    setDetailModal({
      title: product.name,
      rows: [
        { label: 'Type', value: product.type },
        { label: 'Price', value: `$${product.price.toLocaleString()}` },
        { label: 'Description', value: product.description ?? 'N/A' },
      ],
    });
  };

  const handleCreateManagedUser = useCallback(
    async (payload: CreateManagedUserPayload) => {
      if (!isSupabaseConfigured || !canManageUsers) {
        setUserError('Tai khoan cua ban khong co quyen thuc hien thao tac nay.');
        return false;
      }
      setUserActionId('create');
      setUserError(null);
      setUserNotice(null);
      try {
        await createManagedUser(payload);
        setUserNotice('Đã tạo tài khoản mới.');
        await refreshUserList();
        return true;
      } catch (err) {
        console.error('Failed to create user:', err);
        setUserError(err instanceof Error ? err.message : 'Khong the tao nguoi dung.');
        return false;
      } finally {
        setUserActionId(null);
      }
    },
    [canManageUsers, refreshUserList]
  );

  const performUserAction = useCallback(
    async (actionId: string, action: () => Promise<void>, successMessage: string) => {
      if (!isSupabaseConfigured || !canManageUsers) {
        setUserError('Tai khoan cua ban khong co quyen thuc hien thao tac nay.');
        return false;
      }
      setUserActionId(actionId);
      setUserError(null);
      setUserNotice(null);
      try {
        await action();
        setUserNotice(successMessage);
        await refreshUserList();
        return true;
      } catch (err) {
        console.error('Managed user action failed:', err);
        setUserError(err instanceof Error ? err.message : 'Khong the xu ly yeu cau.');
        return false;
      } finally {
        setUserActionId(null);
      }
    },
    [canManageUsers, refreshUserList]
  );

  const handleUpdateManagedUserRole = useCallback(
    (userId: string, nextRole: UserRole, isAdmin: boolean) =>
      performUserAction(
        `role:${userId}`,
        () => updateManagedUserRole(userId, nextRole, isAdmin),
        'Đã cập nhật vai trò người dùng.'
      ),
    [performUserAction]
  );

  const handleActivateUser = useCallback(
    (userId: string) =>
      performUserAction(`activate:${userId}`, () => activateManagedUser(userId), 'Đã mở khóa tài khoản.'),
    [performUserAction]
  );

  const handleDeactivateUser = useCallback(
    (userId: string) =>
      performUserAction(`deactivate:${userId}`, () => deactivateManagedUser(userId), 'Đã khóa tài khoản người dùng.'),
    [performUserAction]
  );

  const handleDeleteUser = useCallback(
    (userId: string) =>
      performUserAction(`delete:${userId}`, () => deleteManagedUser(userId), 'Đã xóa tài khoản người dùng.'),
    [performUserAction]
  );

  const renderView = () => {
    if (isLoading) {
      return <div className="p-8 text-center">Loading data...</div>;
    }
    if (currentView === 'analytics' && !canViewAnalytics) {
      return <div className="p-8 text-center">Bạn không có quyền xem trang này.</div>;
    }
    if (currentView === 'users' && !canManageUsers) {
      return <div className="p-8 text-center">Bạn không có quyền truy cập trang quản lý người dùng.</div>;
    }

    if (currentView === 'knowledge-base' && !canManageKnowledge) {
      return <div className="p-8 text-center">Chi super admin moi duoc truy cap trang Knowledge Base.</div>;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            organizations={organizations}
            contacts={contacts}
            deals={deals}
            projects={projects}
          />
        );
      case 'organizations':
        return <Organizations organizations={organizations} onViewDetails={openOrganizationDetails} />;
      case 'contacts':
        return (
          <Contacts
            contacts={contacts}
            organizations={organizations}
            onViewDetails={openContactDetails}
          />
        );
      case 'deals':
        return (
          <Deals
            deals={deals}
            contacts={contacts}
            updateDealStage={handleUpdateDealStage}
            isReadOnly={!canDragDeals}
          />
        );
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            deals={deals}
            contacts={contacts}
            projects={projects}
            onMarkDone={handleMarkTaskDone}
            onViewDetails={openTaskDetails}
            onDelete={handleDeleteTask}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={projects}
            organizations={organizations}
            employees={employees}
            onViewDetails={openProjectDetails}
            onDelete={handleDeleteProject}
          />
        );
      case 'employees':
        return (
          <Employees
            employees={employees}
            onViewDetails={openEmployeeDetails}
            onEdit={(employee) => {
              setEmployeeBeingEdited(employee);
              setModal('edit-employee');
            }}
          />
        );
      case 'products':
        return (
          <Products
            products={products}
            onViewDetails={openProductDetails}
            onEdit={(product) => {
              setProductBeingEdited(product);
              setModal('edit-product');
            }}
            onDelete={handleDeleteProduct}
          />
        );
      case 'users':
        return (
          <UserManagement
            users={users}
            loading={usersLoading}
            actionId={userActionId}
            error={userError}
            notice={userNotice}
            onRefresh={refreshUserList}
            onCreate={handleCreateManagedUser}
            onUpdateRole={handleUpdateManagedUserRole}
            onActivate={handleActivateUser}
            onDeactivate={handleDeactivateUser}
            onDelete={handleDeleteUser}
            currentUserId={profile?.id ?? session?.user?.id ?? null}
          />
        );
      case 'analytics':
        return (
          <Suspense fallback={<div className="p-8 text-center">Loading analytics...</div>}>
            <Analytics />
          </Suspense>
        );
      case 'knowledge-base':
        return <KnowledgeBaseAdmin />;
      default:
        return (
          <Dashboard
            organizations={organizations}
            contacts={contacts}
            deals={deals}
            projects={projects}
          />
        );
    }
  };

  const renderModalContent = () => {
    switch (modal) {
      case 'organizations':
        return (
          <AddOrganizationForm
            onAdd={(org) => handleAdd('organizations', org)}
            onClose={() => setModal(null)}
          />
        );
      case 'contacts':
        return (
          <AddContactForm
            onAddContact={(contact) => handleAdd('contacts', contact)}
            onClose={() => setModal(null)}
            organizations={organizations}
          />
        );
      case 'deals':
        return (
          <AddDealForm
            onAddDeal={(deal) => handleAdd('deals', deal)}
            onClose={() => setModal(null)}
            contacts={contacts}
            organizations={organizations}
            employees={employees}
          />
        );
      case 'tasks':
        return (
          <AddTaskForm
            onAddTask={(task) => handleAdd('tasks', task)}
            onClose={() => setModal(null)}
            contacts={contacts}
            deals={deals}
            projects={projects}
          />
        );
      case 'projects':
        return (
          <AddProjectForm
            onAdd={(project) => handleAdd('projects', project)}
            onClose={() => setModal(null)}
            organizations={organizations}
            employees={employees}
          />
        );
      case 'employees':
        return (
          <AddEmployeeForm
            onAdd={(employee) => handleAdd('employees', employee)}
            onClose={() => setModal(null)}
          />
        );
      case 'edit-employee':
        return (
          <AddEmployeeForm
            initialEmployee={employeeBeingEdited}
            onUpdate={(employee) => handleAdd('edit-employee', employee)}
            onAdd={() => undefined}
            onClose={() => {
              setModal(null);
              setEmployeeBeingEdited(null);
            }}
          />
        );
      case 'products':
        return (
          <AddProductForm
            onAdd={(product) => handleAdd('products', product)}
            onClose={() => setModal(null)}
          />
        );
      case 'edit-product':
        return (
          <AddProductForm
            initialProduct={productBeingEdited}
            onUpdate={(product) => handleAdd('edit-product', product)}
            onAdd={() => undefined}
            onClose={() => {
              setModal(null);
              setProductBeingEdited(null);
            }}
          />
        );
      default:
        return null;
    }
  };

  const canOpenAddModal =
    canManageRecords && !['dashboard', 'analytics', 'users', 'knowledge-base'].includes(currentView);
  const modalLabel = modal ? MODAL_LABELS[modal] : '';

  const headerName =
    profile?.fullName ??
    profile?.email ??
    session?.user?.email ??
    (isSupabaseConfigured ? undefined : 'Local Admin');

  const headerRoleLabel = formatRoleLabel(role);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-text-primary">
        Dang tai thong tin xac thuc...
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <AuthGate
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        isSubmitting={authSubmitting}
        error={authError}
        notice={authNotice}
        pendingEmail={pendingConfirmationEmail}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex bg-background text-text-primary font-sans">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        canViewAnalytics={canViewAnalytics}
        canManageUsers={canManageUsers}
        canManageKnowledge={canManageKnowledge}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={currentView}
          onAddClick={() => setModal(currentView as ModalType)}
          showAddButton={canOpenAddModal}
          userName={headerName}
          userRole={headerRoleLabel}
          onSignOut={isSupabaseConfigured ? handleSignOut : undefined}
        />

        {notice && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-sm">
            {notice}
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-background-alt">{renderView()}</div>
      </main>

      <Modal
        isOpen={modal !== null}
        onClose={() => {
          setModal(null);
          setEmployeeBeingEdited(null);
        }}
        title={modalLabel ? `Add New ${modalLabel}` : 'Add Record'}
      >
        {renderModalContent()}
      </Modal>

      <Modal
        isOpen={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title={detailModal?.title ?? ''}
      >
        <div className="space-y-3">
          {detailModal?.rows.map((row, index) => (
            <div key={index}>
              <div className="text-xs uppercase text-text-secondary tracking-wide">{row.label}</div>
              <div className="text-sm text-text-primary mt-1">{row.value}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Suspense fallback={null}>
        <AIAssistant />
      </Suspense>
    </div>
  );
};

export default App;

