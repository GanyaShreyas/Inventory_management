# Product Requirements Document (PRD)

## BEL Customer Support — MILCOM Inventory & Spares Management System

**Version:** 1.0  
**Organization:** Bharat Electronics Limited (BEL)  
**Division:** Customer Support — MILCOM (Military Communications)  
**Date:** June 2026

---

## 1. Executive Summary

This is an **internal enterprise web application** for Bharat Electronics Limited (BEL) — Customer Support MILCOM division. It digitizes the tracking of military-grade electronic equipment complaints, spares/parts inventory, and outbound dispatch (OBD) records. The system replaces manual registers and Excel-based tracking with a centralized, role-based web portal accessed on the local network.

---

## 2. Problem Statement

BEL's Customer Support MILCOM team handles incoming defective military communication equipment from various units across India. The workflow involves:
- Receiving defective items, assigning private pass numbers, tracking rectification status
- Managing a large spares inventory across multiple physical store rooms with bin/rack locations
- Dispatching repaired/replacement items back to customer units via different shipping modes
- Generating reports, stickers, handing-over forms, and customer complaint history cards

Previously tracked through paper registers and spreadsheets — causing duplication, lost records, and no audit trail.

---

## 3. Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | **Django 5.2.3** (Python) |
| Database | **MongoDB** (via PyMongo 4.13.2) — NoSQL document store |
| API Style | **Django function-based views** returning `JsonResponse` (REST-like) |
| Auth | Custom token-based auth (SHA-256 hashed passwords, Bearer tokens in sessions collection) |
| CORS | `django-cors-headers 4.7.0` |
| Excel Gen | `openpyxl 3.1.5` for sticker/form generation |
| Data Processing | `pandas 2.3.3`, `numpy 2.3.3` (for migration scripts) |
| Timezone | `zoneinfo` — all timestamps in `Asia/Kolkata` |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | **React 19.1.0** (Create React App) |
| Routing | `react-router-dom 6.30.1` (client-side SPA routing) |
| HTTP Client | `fetch` API + `axios 1.13.2` |
| Styling | **CSS Modules** (`styles.module.css`) — custom design, no UI library |
| State Mgmt | React hooks (`useState`, `useEffect`, `useMemo`, `useRef`) |

### Infrastructure
| Component | Detail |
|-----------|--------|
| DB Server | MongoDB on `localhost:27017` |
| Backend | Django dev server on `localhost:8000` |
| Frontend | React dev server on `localhost:3000` (production build served as static) |
| Deployment | Local network / intranet deployment |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│               (SPA — Port 3000 / Static Build)               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Role-Based Dashboard Router              │    │
│  │   admin → AdminDashboard    user → DashboardChoice   │    │
│  └──────────┬─────────────────────────┬─────────────────┘    │
│             │                         │                      │
│  ┌──────────▼──────────┐   ┌──────────▼──────────────────┐   │
│  │  ADMIN DASHBOARD    │   │    USER DASHBOARD (Choice)  │   │
│  │                     │   │                              │   │
│  │ ┌─────────────────┐ │   │ ┌──────────┐ ┌───────────┐  │   │
│  │ │ Manage Projects │ │   │ │Complaints│ │  Spares   │  │   │
│  │ │ (CRUD hierarchy)│ │   │ │   Mgmt   │ │   Mgmt    │  │   │
│  │ ├─────────────────┤ │   │ ├──────────┤ ├───────────┤  │   │
│  │ │ Add/Reset Users │ │   │ │ Item In  │ │ Spares In │  │   │
│  │ │ (Create, Reset  │ │   │ │ RFD      │ │ Spares Out│  │   │
│  │ │  Password)      │ │   │ │ Item Out │ │ Returnable│  │   │
│  │ ├─────────────────┤ │   │ │ Search   │ │ Returned  │  │   │
│  │ │ Manage Master   │ │   │ │ Edit/View│ │ Audit Log │  │   │
│  │ │ List — Spares   │ │   │ │ Stickers │ │ Stock Chk │  │   │
│  │ │ (Add/Update     │ │   │ │ Backup   │ │           │  │   │
│  │ │  Parts/Bins)    │ │   │ └──────────┘ └───────────┘  │   │
│  │ ├─────────────────┤ │   │                              │   │
│  │ │ Manage Stores   │ │   │ ┌───────────┐               │   │
│  │ │ (Create/Rename  │ │   │ │    OBD    │               │   │
│  │ │  Locations)     │ │   │ │   Mgmt    │               │   │
│  │ └─────────────────┘ │   │ ├───────────┤               │   │
│  └─────────────────────┘   │ │ OBD Out   │               │   │
│                            │ │ Update OBD│               │   │
│                            │ │ Status    │               │   │
│                            │ └───────────┘               │   │
│                            └─────────────────────────────┘   │
│                                                              │
│          All API calls via fetch + Authorization: Bearer     │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────┼───────────────────────────────────┐
│                   Django Backend                             │
│                  (Port 8000 — /api/*)                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │          Auth Layer (Token + Role Middleware)          │   │
│  │  login · validate-token · logout · session cleanup    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────────────────────┐    │
│  │   ADMIN APIs    │  │         OPERATIONAL APIs        │    │
│  │  (role=admin)   │  │        (any authenticated)      │    │
│  │                 │  │                                  │    │
│  │ • Projects CRUD │  │ ┌─────────┐ ┌────────┐ ┌─────┐ │    │
│  │ • Users CRUD    │  │ │ Items   │ │ Spares │ │ OBD │ │    │
│  │ • Reset Password│  │ │ In/Out  │ │ In/Out │ │CRUD │ │    │
│  │ • Master List   │  │ │ RFD     │ │ Return │ │     │ │    │
│  │   (Spares)      │  │ │ Search  │ │ Audit  │ │     │ │    │
│  │ • Stores CRUD   │  │ │ Export  │ │ Stock  │ │     │ │    │
│  │ • Mongo Backup  │  │ └─────────┘ └────────┘ └─────┘ │    │
│  └─────────────────┘  └─────────────────────────────────┘    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              API Logger (all calls → api_logs)        │   │
│  └───────────────────────────────────────────────────────┘   │
│                           │ PyMongo                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                     MongoDB 27017                            │
│                  Database: inventory_db                       │
│                                                              │
│  ┌─── Core ───────────────┐  ┌─── Auth & System ──────────┐ │
│  │ product_details        │  │ users                      │ │
│  │ admin_projects         │  │ sessions                   │ │
│  │ obd_records            │  │ api_logs                   │ │
│  └────────────────────────┘  │ counters                   │ │
│                              └────────────────────────────┘ │
│  ┌─── Spares Module ─────────────────────────────────────┐  │
│  │ spares_master          spares_stores                  │  │
│  │ spares_in              spares_out                     │  │
│  │ spares_out_returnable  spares_in_returned             │  │
│  │ spares_returnable_requests   spares_audit             │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. User Roles & Authentication

### 5.1 Roles
| Role | Access |
|------|--------|
| **admin** | Full access — manage projects, users, master lists, stores, all CRUD, backups |
| **user** | Operational access — item in/out, spares in/out, OBD, search/reports, change own password |

### 5.2 Authentication Flow
1. User submits `POST /api/login` with `{ username, password }`
2. Backend hashes password with SHA-256 (salt: `bel_simple_salt`) and validates against `users` collection
3. On success: generates 64-char hex token via `secrets.token_hex(32)`, stores in `sessions` collection
4. Token returned to client, stored in both `sessionStorage` and `localStorage`
5. All subsequent requests include `Authorization: Bearer <token>` header
6. Backend validates token by looking up `sessions` → `users` on every request
7. Sessions expire after 24 hours (cleanup on login/validate)
8. Default admin bootstrapped on first run: `admin / admin123`

### 5.3 Auth Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login` | POST | Authenticate user, return token |
| `/api/validate-token` | GET | Verify current token is valid |
| `/api/logout` | POST | Invalidate session |
| `/api/admin/users` | POST | Create new user (admin only) |
| `/api/admin/users/reset-password` | POST | Reset any user's password (admin only) |
| `/api/user/change-password` | POST | User changes own password |

---

## 6. Feature Modules

### 6.1 Module 1: Complaints Management (Item Tracking)

The core module tracking defective equipment through the repair lifecycle.

#### 6.1.1 Data Model — `product_details` Collection
```json
{
  "passNo": "string (unique identifier — private pass number)",
  "dateIn": "YYYY-MM-DD",
  "customer": {
    "name": "string",
    "unitAddress": "string",
    "location": "string",
    "phone": "string"
  },
  "projectName": "string (from admin_projects)",
  "items": [
    {
      "equipmentType": "string",
      "itemName": "string",
      "partNumber": "string",
      "serialNumber": "string",
      "yearOfMfg": "integer (2000-2100, optional)",
      "defectDetails": "string",
      "itemIn": true,
      "itemRfd": false,
      "dateRfd": "YYYY-MM-DD | null",
      "itemOut": false,
      "dateOut": "YYYY-MM-DD | null",
      "dispatchThrough": "'Direct Collection' | 'Through Shipping' | ''",
      "itemRectificationDetails": "string",
      "itemFeedback1Details": "string",
      "itemFeedback2Details": "string"
    }
  ],
  "createdBy": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "updatedBy": "string"
}
```

#### 6.1.2 Item Lifecycle
```
ITEM IN → (itemIn=true)
    ↓
RFD (Ready For Dispatch) → (itemRfd=true, dateRfd set)
    ↓
ITEM OUT → (itemOut=true, dateOut set, dispatchThrough required)
```

**Business Rules:**
- A pass number is unique and cannot be changed after creation
- Each pass can hold up to **20 items**
- Items sorted by part number ascending
- `itemRfd` must be true before `itemOut` can be set
- Once `itemOut` is true, it cannot be unset
- Once `itemRfd` is true for an already-out item, it stays true
- `dispatchThrough` must be "Direct Collection" or "Through Shipping" for newly dispatched items
- `yearOfMfg` must be a whole number between 2000 and 2100 (optional)
- Legacy field normalization on read: `itemRfc` → `itemRfd`, `dateRfc` → `dateRfd`, `remarks_2` → `itemFeedback2Details`

#### 6.1.3 Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/items/in` | POST | Create new pass with items (Item In) |
| `/api/items/<passNo>` | GET | Get record by pass number |
| `/api/items/<passNo>` | PUT | Edit record (dateIn, customer, project, items) |
| `/api/items/<passNo>` | DELETE | Delete entire record |
| `/api/items/rfd/<passNo>` | PUT | Batch update RFD status + rectification details |
| `/api/items/out/<passNo>` | PUT | Batch update ItemOut status + dispatch mode |

#### 6.1.4 Search & Reporting
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Search by passNo, serialNumber, ItemPartNo, ProjectName, PhoneNumber, DateRange |
| `/api/search/download` | GET | Export search results as CSV with selectable columns |
| `/api/search/suggestions` | GET | Autocomplete suggestions for search fields |
| `/api/search/download_sticker` | GET | Generate sticker labels in Excel (from template) |
| `/api/search/download_form` | GET | Generate Customer Complaint History Card Excel |

**Search Parameters:**
- `type`: passNo | serialNumber | ItemPartNo | ProjectName | PhoneNumber | DateRange
- `value`: search value
- `status`: In | RFD | Out (filter items by lifecycle state)
- `from` / `to`: date range (YYYY-MM-DD)
- `dispatchThrough`: All | Direct Collection | Through Shipping
- `partNo`: additional part number filter for ProjectName search
- `columns`: comma-separated column IDs for CSV export
- `serialProjectName`: additional project filter for serial number search

**Sticker Export:** Uses an Excel template (`Print_Pass_Master_Excel.xlsx`) to generate printable sticker labels with pass details.

**Customer Complaint History Card:** Multi-page Excel with formatted header (pass details, customer info), item table (10 items/page), and footer (handover signatures).

#### 6.1.5 Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/user/dashboard` | Cards for Item In, RFD, Item Out, Report, Edit/View, Backup, Stickers |
| Item In | `/item-in` | Form: pass no, date, customer details, project dropdown, dynamic item rows (type→name→partNo cascading dropdowns) |
| RFD | `/rfd` | Lookup by pass no, toggle RFD checkboxes per item, set rectification/feedback details |
| Item Out | `/item-out` | Lookup by pass no, toggle Out checkboxes per item, select dispatch mode |
| Search/Report | `/search` | Search form with type selector, filters, results table, CSV/sticker/form download |
| Edit/View | `/edit` | Lookup by pass no, full edit form, delete capability |
| Print Sticker | `/print-sticker` | Search + offset-based sticker generation |

---

### 6.2 Module 2: Admin — Project & Item Hierarchy Management

Manages the master list of projects and their item hierarchies (equipment type → item name → part number).

#### 6.2.1 Data Model — `admin_projects` Collection
```json
{
  "projectName": "string (unique)",
  "items": [
    {
      "itemType": "string (equipment type)",
      "itemName": "string",
      "partNo": "string",
      "createdBy": "string",
      "createdAt": "datetime"
    }
  ],
  "createdBy": "string",
  "createdAt": "datetime"
}
```

#### 6.2.2 Endpoints (Admin Only)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/projects/add` | POST | Create new project |
| `/api/admin/projects/items/add` | POST | Add item to project (with duplicate check on partNo) |
| `/api/admin/projects/items/edit` | PUT | Edit single item or batch-replace all items |
| `/api/admin/projects/items/delete` | DELETE | Remove item from project |
| `/api/admin/projects/list` | GET | List all project names (sorted) |
| `/api/admin/projects/items` | GET | Get items for a specific project |

#### 6.2.3 Frontend Page
| Page | Route | Description |
|------|-------|-------------|
| Manage Projects | `/admin/manage-projects` | Create projects, add/edit/delete items in a table, inline editing, batch save |

---

### 6.3 Module 3: Spares Inventory Management

Full inventory lifecycle management for spare parts across multiple physical stores.

#### 6.3.1 Data Model — `spares_master` Collection
```json
{
  "part_no": "string (unique)",
  "item_name": "string",
  "project_name": "string",
  "item_loc": "string (store name)",
  "rack_no": "string",
  "no_of_bins": "integer",
  "bin_nos": ["string array — e.g. ['A1', 'A2']"],
  "qty": "integer (current stock)",
  "history": [
    {
      "type": "IN | OUT | OUT_RETURNABLE | IN_RETURNED",
      "qty": "integer",
      "date": "datetime",
      "remarks": "string",
      "recieved_from": "string (for IN)",
      "handed_to": "string (for OUT)",
      "service_request_no": "integer (for RETURNABLE)"
    }
  ],
  "created_by": "string",
  "created_at": "datetime"
}
```

#### 6.3.2 Supporting Collections
- **`spares_in`** — Log of all incoming spare entries
- **`spares_out`** — Log of all outgoing spare entries
- **`spares_out_returnable`** — Log of returnable outgoing spares
- **`spares_in_returned`** — Log of returned spares
- **`spares_returnable_requests`** — Service request tracking for returnable items
- **`spares_audit`** — Complete audit trail (every in/out with qty_after)
- **`spares_stores`** — Named physical stores (e.g., "Main Store", "Overflow Room")
- **`counters`** — Auto-increment counter for service request numbers

#### 6.3.3 Business Rules
- **Bin Uniqueness:** Each bin number must be unique within a store (cross-checked on add/update)
- **Stock Validation:** Cannot issue more spares than available quantity
- **Returnable Flow:** Out-returnable creates a service request; returned quantities tracked against it; status auto-closes when outstanding = 0
- **Audit Trail:** Every in/out operation creates an audit record with before/after quantities

#### 6.3.4 Spares Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/spares/master/add` | POST | Add new part to master list (admin) |
| `/api/spares/master/update` | PUT | Update existing part details (admin) |
| `/api/spares/master/search` | GET | Regex search on part_no for autocomplete |
| `/api/spares/master` | GET | Full master list or single part detail |
| `/api/spares/stores` | GET | List store names for dropdowns |
| `/api/admin/stores/add` | POST | Create a new store (admin) |
| `/api/admin/stores/edit` | PUT | Rename a store — cascades to master list (admin) |
| `/api/admin/stores/list` | GET | List stores (admin) |
| `/api/spares/in` | POST | Record spares incoming (qty_in, received_from) |
| `/api/spares/out` | POST | Record spares outgoing (qty_out, handing_over_to) |
| `/api/spares/out-returnable` | POST | Issue returnable spares with service request |
| `/api/spares/returnable/next-service-request` | GET | Preview next service request number |
| `/api/spares/out-returnable/list` | GET | List all returnable requests with summaries |
| `/api/spares/out-returnable/<srNo>` | GET | Detail for a service request |
| `/api/spares/out-returnable/download-form` | GET | Excel download of returnable form |
| `/api/spares/in-returned` | POST | Record return against a service request |
| `/api/spares/audit` | GET | Audit trail for a part number |
| `/api/spares/audit/filter` | GET | Audit trail filtered by date range |
| `/api/spares/stock` | GET | Full stock report as CSV download |

#### 6.3.5 Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| Spares Dashboard | `/user/spares` | Cards for all spares operations |
| Master List (Admin) | `/admin/spares-master-list` | Add/edit parts with bin/rack/store config |
| Spares In | `/spares/spares-in` | Part search autocomplete, enter qty + received from |
| Spares Out | `/spares/spares-out` | Part search, enter qty + handing over to |
| Spares Out Returnable | `/spares/spares-out-returnable` | Issue with service request, handover/received persons |
| Spares In Returned | `/spares/spares-in-returned` | Return qty against a service request |
| View Item Log | `/spares/view-item` | Complete audit history with date filtering |
| Stock Check | `/spares/stock-check` | Full stock table + CSV download |

---

### 6.4 Module 4: OBD (Outbound Dispatch) Management

Track outbound dispatches with docket/LR number tracking.

#### 6.4.1 Data Model — `obd_records` Collection
```json
{
  "obdNo": "integer (unique)",
  "date": "YYYY-MM-DD",
  "sentToLocation": "string",
  "authorizedBy": "string",
  "projectName": "string",
  "itemDetails": "string (free text)",
  "docketLRNo": "string (optional — filled later)",
  "status": "OPEN | CLOSED",
  "createdBy": "string",
  "createdAt": "datetime",
  "updatedBy": "string",
  "updatedAt": "datetime"
}
```

#### 6.4.2 Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/obd/out` | POST | Create new OBD record |
| `/api/obd/suggestions` | GET | Autocomplete on OBD number |
| `/api/obd/<obdNo>` | GET | Get OBD record |
| `/api/obd/<obdNo>` | PUT | Update OBD record (docket number, status, etc.) |
| `/api/obd/status` | GET | Date-range filtered OBD status list |
| `/api/obd/status/download` | GET | CSV export of OBD records |

#### 6.4.3 Frontend Pages
| Page | Route | Description |
|------|-------|-------------|
| OBD Dashboard | `/user/obd` | Cards for OBD Out, Update OBD, Status |
| OBD Out | `/obd/out` | Form to create new dispatch record |
| Update OBD | `/obd/update` | Search by OBD number, update docket/status |
| OBD Status | `/obd/status` | Date-filtered table of all OBD records + CSV export |

---

### 6.5 Module 5: Admin Dashboard

| Page | Route | Description |
|------|-------|-------------|
| Admin Dashboard | `/admin/admin-dashboard` | Cards: Manage Projects, Add Users, Reset Password, Master List, Manage Stores |
| Add User | `/admin/add-user` | Form to create new user (name, username, password, role) |
| Reset Password | `/admin/reset-password` | Admin resets any user's password |
| Manage Stores | `/admin/manage-stores` | Create/rename physical store locations |

---

### 6.6 Module 6: System Utilities

| Feature | Detail |
|---------|--------|
| **MongoDB Backup** | `GET /api/admin/backup` — exports ALL collections as JSON files in a ZIP archive |
| **API Logging** | Every API call logged to `api_logs` collection with endpoint, method, request/response data, timestamp |
| **Session Cleanup** | Expired sessions (>24h) cleaned up on login and token validation |
| **Default Admin Bootstrap** | On first startup, creates `admin/admin123` user if `users` collection is empty |

---

## 7. Frontend Architecture

### 7.1 Routing Structure
```
/ → redirect to /login (if not authenticated) or /choice
/login → LoginPage
/choice → DashboardChoice (User Dashboard — choose module)
/admin/admin-dashboard → AdminDashboard
/user/dashboard → Dashboard (Complaints Management)
/user/spares → SparesManagement
/user/obd → OBDManagement
/item-in → ItemInPage
/rfd → RFDPage
/item-out → ItemOutPage
/search → SearchPage
/edit → EditPage
/print-sticker → PrintStickerPage
/spares/spares-in → SparesInPage
/spares/spares-out → SparesOutPage
/spares/spares-out-returnable → SparesOutReturnablePage
/spares/spares-in-returned → SparesInReturnedPage
/spares/view-item → ViewItemPage
/spares/stock-check → StockCheckPage
/obd/out → OBDOutPage
/obd/update → UpdateOBDPage
/obd/status → OBDStatusPage
/admin/manage-projects → ManageProjectsPage
/admin/add-user → AdminAddUserPage
/admin/reset-password → AdminResetPasswordPage
/admin/spares-master-list → SparesMasterListPage
/admin/manage-stores → ManageStoresPage
/change-password → UserChangePasswordPage
```

### 7.2 Shared Layout Components
- **Header** — Brand banner ("CUSTOMER SUPPORT-MILCOM"), user profile dropdown, logout
- **Sidebar** — BEL logo, navigation (collapsible)
- **Footer** — Copyright bar

### 7.3 API Configuration
- Base URL: `http://localhost:8000/api` (configurable via `REACT_APP_API_BASE` env var)
- Auth: `authHeaders()` function returns `{ Authorization: 'Bearer <token>' }` from sessionStorage/localStorage
- Token stored in both sessionStorage (security) and localStorage (persistence)

### 7.4 UI/UX Patterns
- **CSS Modules** for scoped styling (no global class conflicts)
- **Card grid** layout for dashboard navigation
- **Form pattern**: label → input, 2-column grid layout, status messages inline
- **Confirmation dialogs** before destructive operations (delete, create user)
- **Autocomplete dropdowns** for part numbers, project names, phone numbers
- **Cascading dropdowns**: Project → Equipment Type → Item Name → Part Number
- **Dynamic rows**: Add/duplicate/delete item rows in forms (max 20 per pass)
- **Responsive tables** with inline editing for admin project items

---

## 8. MongoDB Collections Reference

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `product_details` | Main complaints/items records | `passNo` (unique), `items[]`, `customer` |
| `users` | User accounts | `username` (unique), `password_hash`, `role` |
| `sessions` | Active auth sessions | `token`, `user_id`, `created_at` |
| `api_logs` | API call audit logs | `endpoint`, `method`, `timestamp` |
| `admin_projects` | Project/item hierarchy master | `projectName` (unique), `items[]` |
| `spares_master` | Parts master with qty/bins | `part_no` (unique), `qty`, `bin_nos[]`, `history[]` |
| `spares_in` | Spares incoming log | `part_no`, `qty_in`, `date` |
| `spares_out` | Spares outgoing log | `part_no`, `qty_out`, `date` |
| `spares_out_returnable` | Returnable spares log | `serviceRequestNo`, `part_no`, `qty_out` |
| `spares_in_returned` | Returned spares log | `serviceRequestNo`, `qty_in` |
| `spares_returnable_requests` | Service request tracker | `serviceRequestNo`, `returns[]`, `status` |
| `spares_audit` | Complete audit trail | `part_no`, `in`, `out`, `qty_after`, `date` |
| `spares_stores` | Physical store names | `name` |
| `obd_records` | Outbound dispatch records | `obdNo` (unique), `docketLRNo`, `status` |
| `counters` | Auto-increment sequences | `_id`, `seq` |

---

## 9. File/Folder Structure (To Reproduce)

```
project-root/
├── inventory_management/           # Django Backend
│   ├── manage.py                   # Django entry point
│   ├── requirements.txt            # Python dependencies
│   ├── main_project/               # Django project config
│   │   ├── __init__.py
│   │   ├── settings.py             # DB=none (MongoDB via PyMongo), CORS, apps
│   │   ├── urls.py                 # Root URLs → /admin/, /api/ (includes myAPI.urls)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── myAPI/                      # Main application
│   │   ├── __init__.py
│   │   ├── apps.py                 # App config
│   │   ├── models.py               # Django SpareItem model (unused — MongoDB used instead)
│   │   ├── urls.py                 # All API route definitions
│   │   └── views.py                # ALL business logic (~2800 lines, single file)
│   ├── scripts/
│   │   ├── db_migration_script.py  # Data migration utilities
│   │   ├── mongodb_bulk_import.json
│   │   └── OVERALL.csv             # Legacy data import file
│   └── static/
│       └── templates/
│           └── Print_Pass_Master_Excel.xlsx  # Sticker template
│
├── invent_front_end/               # React Frontend
│   ├── package.json                # React 19, react-router-dom 6, axios
│   ├── public/
│   │   └── index.html              # SPA entry point
│   ├── build/                      # Production build output
│   │   └── static/                 # Compiled JS/CSS bundles
│   └── src/
│       ├── index.js                # ReactDOM entry
│       ├── App.js                  # Main app — routing, auth, all complaint pages (~1800 lines)
│       ├── App.css                 # Global styles
│       ├── apiConfig.js            # API base URL + auth header helpers
│       ├── DashboardChoice.jsx     # User dashboard hub
│       ├── SparesManagement.jsx    # All spares pages (~1200 lines)
│       ├── OBDManagement.jsx       # All OBD pages
│       ├── assets/
│       │   ├── bel_logo_hindi-1.png # BEL logo
│       │   └── person.png          # User avatar icon
│       └── components/
│           ├── header.jsx          # Top banner + profile dropdown
│           ├── sidebar.jsx         # Side navigation with BEL logo
│           ├── footer.jsx          # Copyright footer
│           ├── styles.module.css   # All shared CSS modules
│           ├── ManageProjects.jsx  # Admin project management page
│           ├── ManageStores.jsx    # Admin store management page
│           ├── AddProduct.jsx      # (Legacy/unused)
│           ├── FormElements.jsx    # Reusable form components
│           ├── sticker.jsx         # Sticker print component
│           ├── products.jsx        # (Legacy)
│           ├── productsTable.jsx   # (Legacy)
│           └── UserItemSection.jsx # (Legacy)
```

---

## 10. Setup Instructions (For Reproduction)

### 10.1 Prerequisites
- Python 3.13+
- Node.js 18+
- MongoDB 6.0+ running on `localhost:27017`

### 10.2 Backend Setup
```bash
cd inventory_management
pip install -r requirements.txt
# Or install from bundled wheels:
# pip install ../django_packages/*.whl
python manage.py runserver 0.0.0.0:8000
```

**Key settings.py config:**
- `DATABASES = {}` (empty — MongoDB used directly via PyMongo)
- `CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]`
- `ALLOWED_HOSTS = ['*']`
- `DEBUG = False`

### 10.3 Frontend Setup
```bash
cd invent_front_end
npm install
npm start          # Development
npm run build      # Production build → build/
```

### 10.4 Environment Variables
- `REACT_APP_API_BASE` — Override API base URL (default: `http://localhost:8000/api`)

---

## 11. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Deployment** | Intranet/local network only |
| **Concurrent Users** | Low (5-15 users) |
| **Data Volume** | Thousands of passes/items, hundreds of spares |
| **Backup** | Manual via admin backup endpoint (ZIP of JSON) |
| **Timezone** | All dates/times in Asia/Kolkata (IST) |
| **Browser Support** | Modern Chrome/Edge (latest) |
| **Availability** | Business hours (8am-6pm IST) |
| **Security** | Token-based auth, role-based access control, CORS restricted |

---

## 12. Known Constraints & Design Decisions

1. **Single views.py file** — All backend logic in one ~2800-line file (monolithic by design for simplicity)
2. **No Django ORM** — MongoDB used directly via PyMongo; Django models exist but are unused
3. **No Django REST Framework serializers** — Manual JSON serialization via `JsonResponse`
4. **Password hashing** — SHA-256 with static salt (not bcrypt) — suitable for intranet
5. **No WebSocket/real-time** — All data fetched via polling/manual refresh
6. **No pagination** — Search results return all matches (acceptable for current data volumes)
7. **Legacy field normalization** — Read-time migration for renamed fields (RFC→RFD, remarks_2→itemFeedback2Details)
8. **Excel template dependency** — Sticker generation requires `Print_Pass_Master_Excel.xlsx` template file
9. **Cascading dropdowns** — Project→Type→Name→PartNo hierarchy fetched per interaction (no caching)
