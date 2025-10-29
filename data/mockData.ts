import { Organization, Contact, Employee, Deal, Product, Project, Task, ContactStatus, DealStage, ProductType, ProjectStatus } from '../types';

export const mockOrganizations: Organization[] = [
  { id: '32e24cbc-3659-445a-adb9-76dfc892783e', name: 'InnovateTech', industry: 'SaaS', website: 'innovate.com', phone: '123-456-7890', createdAt: '2023-01-15', address: '123 Tech Lane', description: 'Leading provider of cloud-based solutions.' },
  { id: 'bf0d622c-81a3-4498-9a79-3c373935aa17', name: 'Data Solutions LLC', industry: 'Data Analytics', website: 'data-solutions.com', phone: '234-567-8901', createdAt: '2023-02-20', address: '456 Data Drive', description: 'Specializing in big data and business intelligence.' },
  { id: '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', name: 'Synergy Corp', industry: 'Consulting', website: 'synergy.com', phone: '345-678-9012', createdAt: '2023-03-10', address: '789 Synergy Ave', description: 'Business process optimization and strategy consulting.' },
];

export const mockEmployees: Employee[] = [
  { id: 'be1d7770-078c-4a2e-afce-add9929ce31b', fullName: 'Jane Doe', jobTitle: 'Sales Manager' },
  { id: 'b12330a3-cbbd-47a7-9ec9-8fafeb97d135', fullName: 'John Smith', jobTitle: 'AI Solutions Architect' },
  { id: '38b0c011-c762-4715-bce8-b69384574272', fullName: 'Peter Jones', jobTitle: 'Project Manager' },
];

export const mockContacts: Contact[] = [
  { id: 'c30b8ef2-4215-400c-9211-3c5119eee80e', fullName: 'Alice Johnson', email: 'alice@innovate.com', phone: '123-456-7891', title: 'CTO', status: ContactStatus.Client, organizationId: '32e24cbc-3659-445a-adb9-76dfc892783e', createdAt: '2023-05-10' },
  { id: '31854eb9-a574-4c86-8b15-06dd24a7023a', fullName: 'Bob Williams', email: 'bob@data-solutions.com', phone: '234-567-8902', title: 'Head of Analytics', status: ContactStatus.Lead, organizationId: 'bf0d622c-81a3-4498-9a79-3c373935aa17', createdAt: '2023-08-22' },
  { id: '2403e898-a4bf-4705-bf76-40d738c3468b', fullName: 'Charlie Brown', email: 'charlie@synergy.com', phone: '345-678-9013', title: 'Operations Director', status: ContactStatus.Client, organizationId: '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', createdAt: '2023-06-15' },
  { id: 'fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c', fullName: 'Diana Prince', email: 'diana@innovate.com', phone: '123-456-7892', title: 'Lead Developer', status: ContactStatus.Student, organizationId: '32e24cbc-3659-445a-adb9-76dfc892783e', createdAt: '2023-09-01' },
];

export const mockProducts: Product[] = [
  { id: '853e9e7d-cd40-4074-8761-fe2aa6561890', name: 'AI-Powered Chatbot Solution', description: 'Our AI-Powered Chatbot solution offers 24/7 customer support, lead generation, and automated responses.', price: 499, type: ProductType.Solution, createdAt: '2023-01-01' },
  { id: '5f62b4ae-486f-4eaf-9724-f6c79fb61d7b', name: 'Introduction to AI for Business Leaders', description: 'A one-day intensive workshop designed for non-technical executives and managers.', price: 5000, type: ProductType.Training, createdAt: '2023-01-01' },
  { id: '92660895-af86-4daf-afc8-84b0f96f3809', name: 'Automated Inventory Management System', description: 'This AI system uses predictive analytics to forecast demand, automate reordering, and optimize stock levels.', price: 799, type: ProductType.Solution, createdAt: '2023-01-01' },
  { id: '1db9f247-9bd4-4e9b-959d-acbb2b65117d', name: 'Hands-On AI Implementation Course', description: 'A 5-week technical course for development teams.', price: 2500, type: ProductType.Training, createdAt: '2023-01-01' },
];

export const mockDeals: Deal[] = [
  { id: 'f64ea01d-c6f5-4ee6-a97a-926e3578f289', dealName: 'AI Chatbot for Data Solutions', amount: 15000, stage: DealStage.Quoting, closeDate: '2023-11-30', contactId: '31854eb9-a574-4c86-8b15-06dd24a7023a', organizationId: 'bf0d622c-81a3-4498-9a79-3c373935aa17', assignedToEmployeeId: 'be1d7770-078c-4a2e-afce-add9929ce31b', createdAt: '2023-10-05' },
  { id: '791a19a3-3099-42b3-83e2-8b1a1c60092d', dealName: 'Enterprise AI Training Package', amount: 25000, stage: DealStage.Won, closeDate: '2023-10-15', contactId: 'c30b8ef2-4215-400c-9211-3c5119eee80e', organizationId: '32e24cbc-3659-445a-adb9-76dfc892783e', assignedToEmployeeId: 'b12330a3-cbbd-47a7-9ec9-8fafeb97d135', createdAt: '2023-09-01' },
  { id: '466deedb-1148-41df-8b4f-fe82666a54ff', dealName: 'AI Automation Consulting', amount: 12000, stage: DealStage.New, closeDate: '2023-12-15', contactId: 'fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c', organizationId: '32e24cbc-3659-445a-adb9-76dfc892783e', assignedToEmployeeId: 'be1d7770-078c-4a2e-afce-add9929ce31b', createdAt: '2023-10-20' },
  { id: '377f90f8-45eb-4c12-8175-dd5c30e0a400', dealName: 'Partnership Integration', amount: 50000, stage: DealStage.Lost, closeDate: '2023-11-20', contactId: '2403e898-a4bf-4705-bf76-40d738c3468b', organizationId: '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', assignedToEmployeeId: 'be1d7770-078c-4a2e-afce-add9929ce31b', createdAt: '2023-09-15' },
];

export const mockProjects: Project[] = [
    { id: '2c42bf58-2884-4c06-b303-5aac02f039ad', projectName: 'InnovateTech Chatbot Implementation', status: ProjectStatus.Running, startDate: '2023-10-20', endDate: '2024-01-20', managerEmployeeId: '38b0c011-c762-4715-bce8-b69384574272', organizationId: '32e24cbc-3659-445a-adb9-76dfc892783e', description: 'Deploying the enterprise chatbot solution for InnovateTech.', createdAt: '2023-10-18' },
    { id: '1aff0585-e4b1-4c10-97a3-cfa2234aea50', projectName: 'Synergy Corp AI Workshop Series', status: ProjectStatus.Completed, startDate: '2023-07-01', endDate: '2023-08-30', managerEmployeeId: 'b12330a3-cbbd-47a7-9ec9-8fafeb97d135', organizationId: '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', description: 'A series of AI workshops for Synergy Corp leadership.', createdAt: '2023-06-25' },
    { id: '73d83a08-16e9-4e19-8c8d-be1036ef8b1f', projectName: 'Data Solutions Analytics Platform Scoping', status: ProjectStatus.Planning, startDate: '2023-12-01', endDate: '2024-02-28', managerEmployeeId: '38b0c011-c762-4715-bce8-b69384574272', organizationId: 'bf0d622c-81a3-4498-9a79-3c373935aa17', description: 'Initial planning and scoping for a new analytics platform.', createdAt: '2023-11-15' },
];

export const mockTasks: Task[] = [
// FIX: Added 'createdAt' to each mock task to satisfy the Task interface.
  { id: '3d386301-b51b-467e-a2af-8e4aaaedcfba', createdAt: '2023-11-25', title: 'Follow up with Bob Williams', dueDate: '2023-12-05', priority: 'High', status: 'To Do', relatedTo: { type: 'contact', id: '31854eb9-a574-4c86-8b15-06dd24a7023a' } },
  { id: 'c3bbee11-8705-475e-a6ca-d06c6336c1ee', createdAt: '2023-11-20', title: 'Prepare quote for AI Chatbot', dueDate: '2023-11-28', priority: 'High', status: 'In Progress', relatedTo: { type: 'deal', id: 'f64ea01d-c6f5-4ee6-a97a-926e3578f289' } },
  { id: '2cf056b4-45b8-4bc6-a8a8-02a55876fbf2', createdAt: '2023-10-22', title: 'Schedule kick-off meeting for InnovateTech project', dueDate: '2023-10-25', priority: 'Medium', status: 'Done', relatedTo: { type: 'project', id: '2c42bf58-2884-4c06-b303-5aac02f039ad' } },
  { id: 'a603254f-e9cc-44d9-b80e-4fe066b66bfd', createdAt: '2023-11-28', title: 'Send welcome email to Diana Prince', dueDate: '2023-12-01', priority: 'Low', status: 'To Do', relatedTo: { type: 'contact', id: 'fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c' } },
];
