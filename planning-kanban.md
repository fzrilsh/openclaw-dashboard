# OpenClaw Dashboard — Kanban Board Planning

## Overview

Kanban board untuk manage task yang akan dieksekusi oleh OpenClaw agents. Task bisa dibuat manual, di-assign ke agent, dan otomatis dieksekusi.

---

## Columns (Status Workflow)

Default 4 kolom — bisa di-customize:
| Column | Description |
|---|---|
| **Backlog** | Ide/rencana, belum siap dikerjakan |
| **To Do** | Siap dikerjakan, prioritas sudah jelas |
| **In Progress** | Lagi dikerjakan oleh agent |
| **Done** | Selesai |

Bonus: user bisa tambah/hapus/rename column sendiri.

---

## Task Fields

| Field | Type | Notes |
|---|---|---|
| **Title** | Text (required) | Judul task |
| **Description** | Textarea | Detail instruksi, context, link referensi |
| **Priority** | Enum | 🔵 Low / 🟡 Medium / 🟠 High / 🔴 Urgent |
| **Status** | Enum | backlog / todo / in_progress / done |
| **Assignee** | Select | Pick from available agents (from `agents.list` RPC) |
| **Tags** | Multi-select/text | Free-form tags (filterable) |
| **Due Date** | Date | Optional deadline |
| **Recurring** | Object | `{ enabled, interval: "daily" | "weekly" | "monthly" | cron, cronExpression }` |
| **Attachments** | File[] | Optional files/gambar untuk context task |
| **Sub-tasks** | SubTask[] | Checklist items (title, done) |
| **Activity Log** | Activity[] | Auto-log: created, status changed, assigned, etc. |
| **Estimate** | Number | Estimated time in hours/minutes |

---

## Integration dengan OpenClaw

Ini yang bikin beda sama kanban biasa:

### Auto-execution flow
```
Task Created → Assigned to Agent → Moved to "In Progress"
  → API route calls: openclaw tasks create --task "..." --agent "agent-id"
  → Task execution starts
  → Result logged to task activity
  → Auto-move to "Done" on completion
```

### Execution options
1. **OpenClaw native task** — Kirim ke agent via CLI/RPC
2. **Manual** — Task cuma catatan, user execute manual
3. **Scheduled** — Pake recurring, cron job will auto-create task

### Task → OpenClaw command mapping
```
Title + Description → Task prompt for agent
Priority → Mapped to task urgency
Tags → Mapped to task metadata
```

---

## Storage

Simpan di file JSON via Next.js API route:
```
/data/kanban.json
```

Kenapa bukan localStorage atau config:
- **localStorage** — Gak share antar device
- **config.set** — Ada size limit + gak cocok buat data dinamis
- **File JSON** — Paling sederhana, persist, bisa di-version control

---

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: Kanban  [+ New Task]  [Filter] [Search]     │
├──────────┬──────────┬──────────────┬──────────────────┤
│ Backlog  │  To Do   │ In Progress  │      Done        │
│ ┌──────┐ │ ┌──────┐ │  ┌──────┐    │  ┌──────┐       │
│ │Task 1│ │ │Task 3│ │  │Task 5│    │  │Task 7│       │
│ │ 🔴   │ │ │ 🟡  │ │  │ 🟠  │    │  │ 🔵  │       │
│ │ Due  │ │ │ Tag │ │  │ Tag │    │  │     │       │
│ └──────┘ │ └──────┘ │  └──────┘    │  └──────┘       │
│ ┌──────┐ │ ┌──────┐ │  ┌──────┐    │                 │
│ │Task 2│ │ │Task 4│ │  │Task 6│    │                 │
│ └──────┘ │ └──────┘ │  └──────┘    │                 │
├──────────┴──────────┴──────────────┴──────────────────┤
│  Drag & Drop antar column                              │
└──────────────────────────────────────────────────────┘
```

---

## Saran Tambahan dari Gua

### 1. **Activity/History per Task**
Setiap perubahan (status, assignee, dll) tercatat. Kalo task di-execute agent, outputnya masuk sini.

### 2. **Filter & Search**
- Filter by: assignee, priority, tags, due date range
- Search by title/description
- Save custom filters

### 3. **Sprint View**
Kumpulin task dalam sprint (week iteration). Sprint punya: start date, end date, goal.

### 4. **Board Templates**
Misal: "Bug Fixing", "Feature Development", "Code Review" — template dengan columns preset.

### 5. **Export/Import**
Export board ke JSON (buat backup). Import dari JSON.

### 6. **Archive**
Done task gak dihapus, di-archive. Bisa di-restore.

### 7. **Webhook / Notifikasi**
Pas task masuk "In Progress" → kirim notif ke Telegram via channel.

### 8. **WIP Limit**
Batasi jumlah task per column (optional config).

---

## File Structure

```
app/
├── kanban/
│   ├── page.tsx          → Kanban board (drag & drop)
│   └── [taskId]/
│       └── page.tsx      → Task detail page
├── api/
│   └── kanban/
│       ├── route.ts      → GET (list), POST (create)
│       └── [taskId]/
│           └── route.ts  → GET, PATCH, DELETE
├── data/
│   └── kanban.json       → Task storage
components/
├── kanban/
│   ├── Board.tsx         → Board container + columns
│   ├── Column.tsx        → Single column + card list
│   ├── TaskCard.tsx      → Draggable task card
│   ├── TaskForm.tsx      → Create/edit form modal
│   └── TaskDetail.tsx    → Detail view modal
lib/
└── types.ts → Task, Column, Activity types
```

---

## Phases (kalo mau di-implement step by step)

| Phase | Features |
|---|---|
| **1** | Basic CRUD: columns + tasks, storage API, UI board |
| **2** | Drag & drop, filter/search, priority/tags display |
| **3** | Agent assignment + auto-execution (OpenClaw integration) |
| **4** | Recurring tasks, activity log, attachments |
| **5** | Sprint view, WIP limits, export/import, archive |
