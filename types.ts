// types.ts

export type View =
  | 'dashboard'
  | 'organizations'
  | 'contacts'
  | 'deals'
  | 'tasks'
  | 'projects'
  | 'employees'
  | 'products'
  | 'analytics'
  | 'users'
  | 'knowledge-base';

export type ModalType =
  | 'organizations'
  | 'contacts'
  | 'deals'
  | 'tasks'
  | 'projects'
  | 'employees'
  | 'products'
  | 'edit-employee'
  | 'edit-product'
  | null;

export type UserRole = 'super_admin' | 'manager' | 'staff' | 'viewer';

export interface RolePermissions {
  canManageRecords: boolean;
  canViewAnalytics: boolean;
  canDragDeals: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string | null;
  bannedUntil?: string | null;
}

export enum ContactStatus {
  Lead = 'lead',
  Client = 'client',
  Student = 'student',
  Lost = 'lost',
  Other = 'other',
}

export enum DealStage {
  New = 'new',
  Quoting = 'quoting',
  Won = 'won',
  Lost = 'lost',
}

export enum ProductType {
  Solution = 'solution',
  Training = 'training',
}

export enum ProjectStatus {
  Planning = 'planning',
  Running = 'running',
  Completed = 'completed',
  OnHold = 'on_hold',
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  createdAt: string;
  address?: string;
  description?: string;
  descriptionEmbedding?: number[];
}

export interface Employee {
  id: string;
  fullName: string;
  jobTitle: string;
  phone?: string;
}

export interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  title?: string;
  status: ContactStatus;
  organizationId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: ProductType;
  createdAt: string;
  descriptionEmbedding?: number[];
}

export interface Deal {
  id: string;
  dealName: string;
  amount: number;
  stage: DealStage;
  closeDate: string;
  contactId: string;
  organizationId: string;
  assignedToEmployeeId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  projectName: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  managerEmployeeId: string;
  organizationId: string;
  description?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  createdAt: string;
  title: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
  relatedTo?: {
    type: 'contact' | 'deal' | 'project';
    id: string;
    name?: string;
  };
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
}

export interface AiDocumentMatch {
  source: string;
  recordId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  similarity: number;
}

export interface AiContextSnapshot {
  generatedAt: string;
  totals: {
    organizations: number;
    contacts: number;
    deals: number;
    openDeals: number;
    pipelineValue: number;
  };
  topDeals: Array<{
    dealName: string;
    amount: number;
    stage: string;
    organization?: string | null;
    closeDate?: string | null;
  }>;
  upcomingTasks: Array<{
    title: string;
    dueDate: string;
    priority: string;
    status: string;
    relatedTo?: Record<string, unknown> | null;
  }>;
  recentOrganizations: Array<{
    name: string;
    industry?: string | null;
    createdAt: string;
  }>;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  description?: string | null;
  sourceType: string;
  fileName?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  createdBy?: string | null;
  chunkCount?: number;
}

export type AiMessageRoleType = 'user' | 'assistant' | 'system';

export interface AiSessionSummary {
  id: string;
  createdAt: string | null;
  lastInteractionAt: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AiMessageRecord {
  id: string;
  sessionId: string;
  role: AiMessageRoleType;
  content: string;
  tokens?: number | null;
  createdAt: string;
}
