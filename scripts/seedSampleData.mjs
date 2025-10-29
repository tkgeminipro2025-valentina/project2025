#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const envFilePath = path.join(projectRoot, '.env.local');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }
  const raw = readFileSync(filePath, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.replace(/^\uFEFF/, '').trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=').trim();
      acc[key.trim()] = value.replace(/^"|"$/g, '');
      return acc;
    }, {});
}

const env = loadEnvFile(envFilePath);

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.VITE_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const IDs = {
  organizations: {
    stellar: 'a3f7d4c1-26cf-4e0a-99fa-b8fb5daf514b',
    horizon: 'e3b0c305-ea4e-4f7e-908a-35d6360b8d1d',
    zen: 'cb821d19-0a9c-4691-99b5-6c9ee6fcb9f0',
  },
  employees: {
    linh: '25bd52f8-2094-4b12-a079-9fb4692372ee',
    hung: 'd4b28fc7-2d1b-4850-b756-bf44c7f4f80a',
    nhung: 'c50afb19-6df3-4418-bb9f-23ad2e2edffe',
  },
  contacts: {
    thanh: '9f91d681-6b65-4935-92c1-946a72bc8e7d',
    quyen: '96a13a25-3669-4622-8401-ebc95583d811',
    vu: '383e0eb6-7016-4028-a6d2-6bd5480bec0b',
    linda: '09a9c0c2-f6bf-435d-a031-40c88a0edb0d',
  },
  deals: {
    aiSuite: '7cc1b3b8-4eff-4899-8308-0710c2156d9d',
    analytics: 'db9da146-fed0-4293-8217-8d724b5a374e',
  },
  projects: {
    deployment: '9d0ef538-0fd7-40b9-9df4-109f5f9661f0',
    training: 'dd3ef25b-9dfd-4644-810d-5b4816930d44',
  },
  tasks: {
    kickoff: '7f8ab809-c34f-485a-9b66-61f54e784b49',
    workshop: '3d56b6b8-7e69-4f7f-ab92-0d7ece69d52c',
    followUp: 'fef45df5-7183-44b5-8a35-0f5b8e2fcd17',
  },
  products: {
    copilot: 'f78b2a64-5507-41c7-8c43-1ced8ed8df20',
    academy: '073f8f83-3014-4d89-9b3d-cf2df4ad0d89',
  },
};

const dataSets = {
  organizations: [
    {
      id: IDs.organizations.stellar,
      name: 'Stellar Learning Hub',
      industry: 'EdTech',
      website: 'https://stellar-learning.io',
      phone: '+84 28 1234 5678',
      address: '29 Nguyen Thi Minh Khai, District 1, HCMC',
      description:
        'Stellar Learning Hub cung cấp nền tảng đào tạo trực tuyến ứng dụng AI cho doanh nghiệp.',
    },
    {
      id: IDs.organizations.horizon,
      name: 'Horizon Logistics',
      industry: 'Logistics',
      website: 'https://horizonlogistics.com',
      phone: '+84 24 7777 8888',
      address: '25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội',
      description:
        'Horizon Logistics chuyên về giải pháp vận hành chuỗi cung ứng thông minh tại Đông Nam Á.',
    },
    {
      id: IDs.organizations.zen,
      name: 'Zenwell Healthcare',
      industry: 'Healthcare',
      website: 'https://zenwellcare.com',
      phone: '+84 28 9999 2222',
      address: '12 Trần Não, Thành phố Thủ Đức',
      description:
        'Zenwell Healthcare phát triển hệ sinh thái phòng khám kết hợp chăm sóc từ xa.',
    },
  ],
  employees: [
    {
      id: IDs.employees.linh,
      full_name: 'Trần Minh Linh',
      job_title: 'Account Executive',
      phone: '+84 936 222 111',
    },
    {
      id: IDs.employees.hung,
      full_name: 'Lê Hoàng Hưng',
      job_title: 'Solutions Consultant',
      phone: '+84 911 883 225',
    },
    {
      id: IDs.employees.nhung,
      full_name: 'Đỗ Thu Nhung',
      job_title: 'Customer Success Lead',
      phone: '+84 947 112 356',
    },
  ],
  contacts: [
    {
      id: IDs.contacts.thanh,
      full_name: 'Nguyễn Bảo Thành',
      email: 'thanh@stellar-learning.io',
      phone: '+84 903 123 789',
      title: 'Giám đốc đào tạo',
      status: 'client',
      organization_id: IDs.organizations.stellar,
    },
    {
      id: IDs.contacts.quyen,
      full_name: 'Trần Thu Quyên',
      email: 'quyen@horizonlogistics.com',
      phone: '+84 902 456 123',
      title: 'Chief Operations Officer',
      status: 'lead',
      organization_id: IDs.organizations.horizon,
    },
    {
      id: IDs.contacts.vu,
      full_name: 'Phạm Đức Vũ',
      email: 'vu@zenwellcare.com',
      phone: '+84 906 555 999',
      title: 'Head of Digital Transformation',
      status: 'client',
      organization_id: IDs.organizations.zen,
    },
    {
      id: IDs.contacts.linda,
      full_name: 'Linda Phạm',
      email: 'linda@stellar-learning.io',
      phone: '+84 908 717 262',
      title: 'Learning Experience Manager',
      status: 'client',
      organization_id: IDs.organizations.stellar,
    },
  ],
  products: [
    {
      id: IDs.products.copilot,
      name: 'Stellar AI Copilot',
      description:
        'Bộ công cụ trợ lý AI hỗ trợ xây dựng nội dung đào tạo, gợi ý quiz và phân tích hành vi học tập.',
      price: 1299.0,
      type: 'solution',
    },
    {
      id: IDs.products.academy,
      name: 'RAG Academy Workshop',
      description:
        'Khóa workshop 3 ngày giúp đội ngũ doanh nghiệp triển khai hệ thống RAG, tích hợp dữ liệu riêng.',
      price: 799.0,
      type: 'training',
    },
  ],
  deals: [
    {
      id: IDs.deals.aiSuite,
      deal_name: 'Triển khai AI Copilot cho Stellar',
      amount: 45000,
      stage: 'quoting',
      close_date: '2025-11-30',
      contact_id: IDs.contacts.thanh,
      organization_id: IDs.organizations.stellar,
      assigned_to_employee_id: IDs.employees.linh,
    },
    {
      id: IDs.deals.analytics,
      deal_name: 'Nâng cấp phân tích Horizon Logistics',
      amount: 32000,
      stage: 'new',
      close_date: '2025-12-15',
      contact_id: IDs.contacts.quyen,
      organization_id: IDs.organizations.horizon,
      assigned_to_employee_id: IDs.employees.hung,
    },
  ],
  projects: [
    {
      id: IDs.projects.deployment,
      project_name: 'Triển khai Copilot - Phase 1',
      status: 'running',
      start_date: '2025-11-05',
      end_date: '2026-01-15',
      manager_employee_id: IDs.employees.nhung,
      organization_id: IDs.organizations.stellar,
      description: 'Thiết lập hạ tầng, đồng bộ dữ liệu đào tạo và kiểm thử user pilot.',
    },
    {
      id: IDs.projects.training,
      project_name: 'Workshop RAG cho Horizon',
      status: 'planning',
      start_date: '2025-12-01',
      end_date: '2025-12-03',
      manager_employee_id: IDs.employees.hung,
      organization_id: IDs.organizations.horizon,
      description: 'Đào tạo đội vận hành sử dụng hệ thống RAG và dashboards giám sát.',
    },
  ],
  tasks: [
    {
      id: IDs.tasks.kickoff,
      title: 'Chuẩn bị tài liệu kickoff',
      due_date: '2025-11-07',
      priority: 'High',
      status: 'In Progress',
      related_to: { type: 'project', id: IDs.projects.deployment },
    },
    {
      id: IDs.tasks.workshop,
      title: 'Lên agenda workshop Horizon',
      due_date: '2025-11-20',
      priority: 'Medium',
      status: 'To Do',
      related_to: { type: 'project', id: IDs.projects.training },
    },
    {
      id: IDs.tasks.followUp,
      title: 'Gọi điện follow-up deal Copilot',
      due_date: '2025-11-18',
      priority: 'High',
      status: 'To Do',
      related_to: { type: 'deal', id: IDs.deals.aiSuite },
    },
  ],
};

const cleanupTargets = [
  { table: 'organizations', column: 'name', values: ['Test Org'] },
  { table: 'employees', column: 'full_name', values: ['CLI User'] },
];

async function cleanup() {
  for (const target of cleanupTargets) {
    const { table, column, values } = target;
    if (!values.length) continue;
    const { error } = await supabase.from(table).delete().in(column, values);
    if (error) {
      console.warn(`⚠️  Cleanup warning on ${table}:`, error.message);
    }
  }
}

async function upsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    throw new Error(`Upsert failed on ${table}: ${error.message}`);
  }
}

async function logCounts() {
  const tables = [
    'organizations',
    'employees',
    'contacts',
    'products',
    'deals',
    'projects',
    'tasks',
  ];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.warn(`⚠️  Count failed for ${table}: ${error.message}`);
    } else {
      console.log(`   • ${table}: ${count ?? 0} records`);
    }
  }
}

async function main() {
  console.log('🚀 Seeding CRM datasets to Supabase project:', supabaseUrl);
  await cleanup();
  await upsert('organizations', dataSets.organizations);
  await upsert('employees', dataSets.employees);
  await upsert('contacts', dataSets.contacts);
  await upsert('products', dataSets.products);
  await upsert('deals', dataSets.deals);
  await upsert('projects', dataSets.projects);
  await upsert('tasks', dataSets.tasks);

  console.log('✅ Seed completed. Current table counts:');
  await logCounts();
}

main().catch((err) => {
  console.error('❌  Seed script failed:', err);
  process.exit(1);
});
