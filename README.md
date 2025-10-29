<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository contains everything you need to run the CRM + RAG demo locally, including Supabase migrations, AI telemetry, and helper scripts.

View the hosted version in Google AI Studio: https://ai.studio/apps/drive/1R8SFiJrdvZ4-UG8Mld7vdBGaubjnvOdC

---

## Run Locally

**Prerequisites:** Node.js (LTS), npm

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the example env file and populate the required keys
   ```bash
   cp .env.example .env.local
   ```
   Variables required:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only used by CLI/backfill scripts, never commit it)
3. Start the Vite dev server
   ```bash
   npm run dev
   ```
4. Mở `http://localhost:5173` để đăng nhập; màn hình xác thực cho phép chuyển qua **Đăng ký** để tạo tài khoản mới (mặc định role `staff`).
   - Sau khi đăng ký, giao diện sẽ hiển thị thông báo đã gửi email xác nhận. Người dùng cần mở email (hoặc bỏ xác nhận trong Supabase → Authentication → Email nếu muốn bỏ bước này khi dev).

---

## Supabase Setup

1. In the Supabase SQL editor run `data/schema.sql` to create all tables, views, and functions.
2. Optionally run `data/seed.sql` to load the demo dataset.
3. Deploy the edge functions and configure the shared secrets (the Supabase URL + service role key power both functions):
   ```bash
   supabase functions deploy generate-embedding
   supabase functions deploy manage-users

   supabase secrets set GEMINI_API_KEY=...
   supabase secrets set EDGE_SUPABASE_URL=...
   supabase secrets set EDGE_SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Promote the root admin account once it exists in Supabase Auth (copy the `user_id` from Authentication → Users):
   ```bash
   npm run set-role -- <user_id> --role super_admin --admin true
   ```
   The default primary admin email is `yvalentinaniehra@gmail.com`.

---

### Supabase CLI (v2.54.9 beta)

- Required for deploying edge functions (`generate-embedding`) and running migrations from the terminal.
- Remove older installs if present: `npm uninstall -g supabase` (or delete previous binaries from your PATH).
- Install the beta build via npm (works cross-platform when Node.js is available):
  ```bash
  npm install -g supabase@2.54.9
  ```
- On Windows without admin rights, run the CLI on demand instead:
  ```powershell
  npx supabase@2.54.9 --version
  ```
- Alternatively download the standalone binary from the [Supabase CLI releases](https://github.com/supabase/cli/releases/tag/v2.54.9), extract it, and add the folder to your `PATH`.
- Verify the installation with `supabase --version` (expect `2.54.9`), then authenticate using `supabase login`.

---

## AI Telemetry, Embedding & Analytics

- Supabase resources created by the migrations:
  - Tables `ai_sessions`, `ai_messages`, `ai_feedback`
  - Views / RPCs: `ai_session_summary`, `ai_usage_by_day()`, `crm_ai_documents`, `crm_ai_context()`, `match_crm_documents()`
- Edge Functions:
  - `generate-embedding` — updates `description_embedding` columns after inserts/updates.
  - `ai-telemetry` — service-role endpoint that owns session/message/feedback writes securely.
- The React AI Assistant now:
  - Opens with suggestions grounded in the live CRM snapshot (`crm_ai_context()`).
  - Generates Gemini embeddings for each prompt, runs semantic search via `match_crm_documents()`, and injects the matched snippets into the prompt.
  - Logs every interaction through `ai-telemetry`, so RLS never blocks user sessions.
  - Supports thumbs up/down feedback, stored via the same function.
- Sidebar **AI Analytics** pulls aggregated metrics from the views/RPCs above.

### Deploying Edge Functions

```bash
supabase functions deploy generate-embedding
supabase functions deploy ai-telemetry
```

Ensure the following secrets exist in the Supabase project (Dashboard ▸ Edge Functions ▸ Secrets):

| Key                               | Value / Notes                              |
|-----------------------------------|--------------------------------------------|
| `GEMINI_API_KEY`                  | Server copy of your Gemini key             |
| `EDGE_SUPABASE_URL`               | Optional override (defaults to `SUPABASE_URL`) |
| `EDGE_SUPABASE_SERVICE_ROLE_KEY`  | Optional override (defaults to `SUPABASE_SERVICE_ROLE_KEY`) |

If you already set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, the overrides are optional.

### Knowledge Base Management

Only the super admin (or users with `is_admin = true`) can access the **Knowledge Base** view in the sidebar. Use it to:

- Upload files (PDF, DOCX, CSV, XLS/XLSX, TXT/MD) trực tiếp trên giao diện. Hệ thống lưu vào bucket `knowledge-files`, chunk ~1200 ký tự (chồng lấn 150 ký tự), sinh embedding Gemini và thêm vào bảng KB.
- Paste cleaned text và tạo snippet thủ công. Mỗi đoạn cũng được chunk & embedding tự động.
- Review danh sách tài liệu (title, source, chunk count, original filename) và xóa bản ghi cũ; file trong Storage cũng được thu hồi.

Vẫn có thể dùng script CLI (cùng pipeline) khi cần tự động hóa hàng loạt:

```bash
npm run kb:ingest -- ./path/to/contract.pdf --title "Enterprise Contract" --description "Signed 2025" 
```

The script will:

1. Extract raw text from the file (supports pdf/docx/txt/md/csv/xlsx by default).
2. Split the text into overlapping chunks and generate Gemini embeddings.
3. Upload metadata + vectors to the knowledge tables (mirrors the UI workflow).

Tips:
- Run `npm install` once to ensure the required Node parsers are available (`pdf-parse`, `mammoth`, `xlsx`, `csv-parse`, `papaparse`).
- Store the original files in your preferred archive (optional). The Supabase tables keep a pointer (`storage_path`) for reference.
- Extend the CLI for new formats by editing `scripts/ingestKnowledgeBase.mjs`.

All knowledge chunks are automatically included in the `crm_ai_documents` view, so the assistant can retrieve them alongside CRM records.
### CLI helpers

| Command                         | Purpose                                                        |
|--------------------------------|----------------------------------------------------------------|
| `npm run backfill:embeddings`  | Generate embeddings for existing `products`/`organizations`.   |
| `npm run backfill:ai-telemetry`| Seed sample AI sessions/messages/feedback (only if table empty).|

Both scripts read credentials from `.env.local` and require `SUPABASE_SERVICE_ROLE_KEY` for admin operations such as `npm run backfill:*` or `npm run set-role -- <user_id> --role manager --admin true|false`.
---

## Backfill & Maintenance Workflow

1. **Embeddings:** run `npm run backfill:embeddings` whenever you add new free-text content that predates the edge function.
2. **Telemetry seed:** run `npm run backfill:ai-telemetry` on a fresh Supabase project if you want immediate analytics data.
3. **Monitoring:** Supabase Dashboard ? Edge Functions ? `generate-embedding` to inspect logs and failures.
4. **AI doc search:** if you add new tables with embeddings, extend `crm_ai_documents` via a migration so RAG covers the new content.

---

## RLS & Access Notes

- RLS is enabled on `ai_sessions`, `ai_messages`, and `ai_feedback`. Read access is limited to tokens that satisfy `is_claims_admin()` (service-role, `is_admin: true`, or users with `super_admin`/`manager` roles).
- Adjust access by updating the `is_claims_admin()` helper or adding RLS policies that reference your own metadata (e.g. team ids).
- For dashboards that require more complex logic, expose analytics via a secured RPC that enforces the desired checks server-side.
- Keep the service-role key **server-side only**; it is required for backfill scripts but must never be exposed to the browser.

---

## Project Scripts

| Script                      | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev`              | Start Vite development server        |
| `npm run build`            | Production build via Vite            |
| `npm run preview`          | Preview the production build         |
| `npm run backfill:embeddings` | Backfill missing embeddings       |
| `npm run backfill:ai-telemetry` | Seed analytics demo data       |

---

Enjoy building with Supabase + Gemini! For further automation ideas, see `scripts/` and the Supabase migrations under `supabase/migrations/`.


---

## User Roles & Access Control

- New signups automatically create entries in `user_profiles` via the `handle_new_user` trigger (defaults to `staff`). Upgrade roles from the **Users** view or via the CLI helper.
- Chỉ `super_admin` mới thấy mục **Users** trong sidebar. Từ đây bạn có thể tạo tài khoản mới, gán role, bật/tắt quyền admin, khóa/mở khóa hoặc xóa người dùng. Tất cả thao tác được xử lý qua edge function `manage-users` (yêu cầu `EDGE_SUPABASE_SERVICE_ROLE_KEY` trong secrets).
- Tài khoản root admin `yvalentinaniehra@gmail.com` được bảo vệ khỏi thao tác xóa/hạ cấp trực tiếp trên giao diện; nếu cần thay đổi hãy dùng CLI.
- CLI helper vẫn hữu ích cho tự động hóa:
  ```bash
  npm run set-role -- <user_id> --role super_admin --admin true
  ```
  Roles hỗ trợ: `super_admin`, `manager`, `staff`, `viewer`.
- Analytics policies vẫn yêu cầu `super_admin`, `manager` hoặc JWT có `is_admin: true`. Staff/viewer bị chặn trừ khi được nâng cấp.
- Mở rộng mô hình bằng cách thêm metadata (ví dụ `team_id`) vào `user_profiles` rồi cập nhật RLS theo nhu cầu doanh nghiệp.



#   m y b u s s i n e s s  
 #   p r o j e c t 2 0 2 5  
 #   p r o j e c t 2 0 2 5  
 