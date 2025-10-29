-- Seed data for Stellar AI CRM
truncate table tasks, deals, projects, products, contacts, employees, organizations restart identity cascade;

insert into organizations (id, name, industry, website, phone, address, description, created_at)
values
  ('32e24cbc-3659-445a-adb9-76dfc892783e', 'InnovateTech', 'SaaS', 'innovate.com', '123-456-7890', '123 Tech Lane', 'Leading provider of cloud-based solutions.', '2023-01-15T00:00:00Z'),
  ('bf0d622c-81a3-4498-9a79-3c373935aa17', 'Data Solutions LLC', 'Data Analytics', 'data-solutions.com', '234-567-8901', '456 Data Drive', 'Specializing in big data and business intelligence.', '2023-02-20T00:00:00Z'),
  ('4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', 'Synergy Corp', 'Consulting', 'synergy.com', '345-678-9012', '789 Synergy Ave', 'Business process optimization and strategy consulting.', '2023-03-10T00:00:00Z');

insert into employees (id, full_name, job_title, phone, created_at)
values
  ('be1d7770-078c-4a2e-afce-add9929ce31b', 'Jane Doe', 'Sales Manager', null, '2023-01-01T00:00:00Z'),
  ('b12330a3-cbbd-47a7-9ec9-8fafeb97d135', 'John Smith', 'AI Solutions Architect', null, '2023-01-01T00:00:00Z'),
  ('38b0c011-c762-4715-bce8-b69384574272', 'Peter Jones', 'Project Manager', null, '2023-01-01T00:00:00Z');

insert into contacts (id, full_name, email, phone, title, status, organization_id, created_at)
values
  ('c30b8ef2-4215-400c-9211-3c5119eee80e', 'Alice Johnson', 'alice@innovate.com', '123-456-7891', 'CTO', 'client', '32e24cbc-3659-445a-adb9-76dfc892783e', '2023-05-10T00:00:00Z'),
  ('31854eb9-a574-4c86-8b15-06dd24a7023a', 'Bob Williams', 'bob@data-solutions.com', '234-567-8902', 'Head of Analytics', 'lead', 'bf0d622c-81a3-4498-9a79-3c373935aa17', '2023-08-22T00:00:00Z'),
  ('2403e898-a4bf-4705-bf76-40d738c3468b', 'Charlie Brown', 'charlie@synergy.com', '345-678-9013', 'Operations Director', 'client', '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', '2023-06-15T00:00:00Z'),
  ('fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c', 'Diana Prince', 'diana@innovate.com', '123-456-7892', 'Lead Developer', 'student', '32e24cbc-3659-445a-adb9-76dfc892783e', '2023-09-01T00:00:00Z');

insert into products (id, name, description, price, type, created_at)
values
  ('853e9e7d-cd40-4074-8761-fe2aa6561890', 'AI-Powered Chatbot Solution', 'Our AI-Powered Chatbot solution offers 24/7 customer support, lead generation, and automated responses.', 499, 'solution', '2023-01-01T00:00:00Z'),
  ('5f62b4ae-486f-4eaf-9724-f6c79fb61d7b', 'Introduction to AI for Business Leaders', 'A one-day intensive workshop designed for non-technical executives and managers.', 5000, 'training', '2023-01-01T00:00:00Z'),
  ('92660895-af86-4daf-afc8-84b0f96f3809', 'Automated Inventory Management System', 'This AI system uses predictive analytics to forecast demand, automate reordering, and optimize stock levels.', 799, 'solution', '2023-01-01T00:00:00Z'),
  ('1db9f247-9bd4-4e9b-959d-acbb2b65117d', 'Hands-On AI Implementation Course', 'A 5-week technical course for development teams.', 2500, 'training', '2023-01-01T00:00:00Z');

insert into deals (id, deal_name, amount, stage, close_date, contact_id, organization_id, assigned_to_employee_id, created_at)
values
  ('f64ea01d-c6f5-4ee6-a97a-926e3578f289', 'AI Chatbot for Data Solutions', 15000, 'quoting', '2023-11-30', '31854eb9-a574-4c86-8b15-06dd24a7023a', 'bf0d622c-81a3-4498-9a79-3c373935aa17', 'be1d7770-078c-4a2e-afce-add9929ce31b', '2023-10-05T00:00:00Z'),
  ('791a19a3-3099-42b3-83e2-8b1a1c60092d', 'Enterprise AI Training Package', 25000, 'won', '2023-10-15', 'c30b8ef2-4215-400c-9211-3c5119eee80e', '32e24cbc-3659-445a-adb9-76dfc892783e', 'b12330a3-cbbd-47a7-9ec9-8fafeb97d135', '2023-09-01T00:00:00Z'),
  ('466deedb-1148-41df-8b4f-fe82666a54ff', 'AI Automation Consulting', 12000, 'new', '2023-12-15', 'fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c', '32e24cbc-3659-445a-adb9-76dfc892783e', 'be1d7770-078c-4a2e-afce-add9929ce31b', '2023-10-20T00:00:00Z'),
  ('377f90f8-45eb-4c12-8175-dd5c30e0a400', 'Partnership Integration', 50000, 'lost', '2023-11-20', '2403e898-a4bf-4705-bf76-40d738c3468b', '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', 'be1d7770-078c-4a2e-afce-add9929ce31b', '2023-09-15T00:00:00Z');

insert into projects (id, project_name, status, start_date, end_date, manager_employee_id, organization_id, description, created_at)
values
  ('2c42bf58-2884-4c06-b303-5aac02f039ad', 'InnovateTech Chatbot Implementation', 'running', '2023-10-20', '2024-01-20', '38b0c011-c762-4715-bce8-b69384574272', '32e24cbc-3659-445a-adb9-76dfc892783e', 'Deploying the enterprise chatbot solution for InnovateTech.', '2023-10-18T00:00:00Z'),
  ('1aff0585-e4b1-4c10-97a3-cfa2234aea50', 'Synergy Corp AI Workshop Series', 'completed', '2023-07-01', '2023-08-30', 'b12330a3-cbbd-47a7-9ec9-8fafeb97d135', '4d709ab6-5a7f-4c6b-9ecc-660cef5243e8', 'A series of AI workshops for Synergy Corp leadership.', '2023-06-25T00:00:00Z'),
  ('73d83a08-16e9-4e19-8c8d-be1036ef8b1f', 'Data Solutions Analytics Platform Scoping', 'planning', '2023-12-01', '2024-02-28', '38b0c011-c762-4715-bce8-b69384574272', 'bf0d622c-81a3-4498-9a79-3c373935aa17', 'Initial planning and scoping for a new analytics platform.', '2023-11-15T00:00:00Z');

insert into tasks (id, title, due_date, priority, status, related_to, created_at)
values
  ('3d386301-b51b-467e-a2af-8e4aaaedcfba', 'Follow up with Bob Williams', '2023-12-05', 'High', 'To Do', '{"type":"contact","id":"31854eb9-a574-4c86-8b15-06dd24a7023a"}'::jsonb, '2023-11-25T00:00:00Z'),
  ('c3bbee11-8705-475e-a6ca-d06c6336c1ee', 'Prepare quote for AI Chatbot', '2023-11-28', 'High', 'In Progress', '{"type":"deal","id":"f64ea01d-c6f5-4ee6-a97a-926e3578f289"}'::jsonb, '2023-11-20T00:00:00Z'),
  ('2cf056b4-45b8-4bc6-a8a8-02a55876fbf2', 'Schedule kick-off meeting for InnovateTech project', '2023-10-25', 'Medium', 'Done', '{"type":"project","id":"2c42bf58-2884-4c06-b303-5aac02f039ad"}'::jsonb, '2023-10-22T00:00:00Z'),
  ('a603254f-e9cc-44d9-b80e-4fe066b66bfd', 'Send welcome email to Diana Prince', '2023-12-01', 'Low', 'To Do', '{"type":"contact","id":"fa6c49ca-c1f2-40d6-86a6-a8a7df0b2c0c"}'::jsonb, '2023-11-28T00:00:00Z');
\n-- Seed AI telemetry (example blank entries)\ninsert into ai_sessions (id, channel) values\n  ('00000000-0000-0000-0000-000000000001', 'assistant');\n
