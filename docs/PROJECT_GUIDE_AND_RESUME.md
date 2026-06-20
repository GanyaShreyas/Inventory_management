# Project Explanation & Resume Guide

## BEL Customer Support — MILCOM Inventory Management System

---

## 1. What This Project Is (Plain English)

This is a **full-stack web application** built for **Bharat Electronics Limited (BEL)**, a Government of India defense PSU. The application is used by the **Customer Support division of MILCOM (Military Communications)** to manage the complete lifecycle of defective military communication equipment sent in for repair.

**Before this system:** Teams tracked everything in physical registers and Excel spreadsheets — leading to lost records, duplicate entries, and no visibility into repair status across the team.

**What this system does:**
- **Complaints Management:** When a military unit sends defective equipment, the system assigns a private pass number, logs customer details, and tracks each item through: Item Received → Ready For Dispatch (RFD) → Item Dispatched back.
- **Spares Inventory:** Manages spare parts across multiple physical storerooms — tracking exact bin/rack locations, incoming/outgoing quantities, returnable items with service requests, and maintaining a full audit trail.
- **OBD (Outbound Dispatch):** Records every outbound shipment with docket/LR numbers for logistics tracking.
- **Reports & Exports:** Generates CSV reports, printable sticker labels (Excel), and formatted Customer Complaint History Cards.
- **Admin Panel:** Role-based access control with project/item hierarchy management, user management, store management, and MongoDB backup.

---

## 2. Technical Depth & What Makes It Interesting

### Architecture Decisions
- **Django + MongoDB (not PostgreSQL):** Chose MongoDB over traditional relational DB because the equipment records have variable-length item arrays and nested customer objects — a natural fit for document storage. Django handles routing/middleware while PyMongo handles all data operations directly.
- **Token-based Authentication from scratch:** Implemented custom auth instead of Django's built-in auth or JWT libraries — generating cryptographic tokens, managing sessions with TTL, and role-based middleware.
- **Single-file API Design (~2800 lines):** All API logic in one `views.py` — a deliberate choice for a small team to avoid file-hunting. Trade-off: harder to navigate, but zero import complexity.
- **Cascading dropdown system:** Project → Equipment Type → Item Name → Part Number hierarchy driven by MongoDB queries, providing context-aware form inputs.

### Complex Business Logic
- **Item lifecycle state machine:** Enforces In → RFD → Out ordering with business rules (can't dispatch without RFD, can't undo dispatch)
- **Returnable spares flow:** Auto-incrementing service request numbers, outstanding quantity tracking, auto-close when fully returned
- **Bin uniqueness validation:** Cross-checks bin numbers across all parts in a store to prevent physical location conflicts
- **Legacy data migration:** Runtime normalization of renamed fields (RFC→RFD) without modifying stored documents — backward-compatible reads
- **Excel generation:** Dynamically generates formatted sticker labels and multi-page complaint history cards using openpyxl with merged cells, borders, and layout control

### Frontend Complexity
- **React 19 SPA** with 20+ routes, role-based routing, and session persistence
- **Dynamic forms** with add/duplicate/delete item rows, cascading dropdowns, autocomplete search
- **Multiple export formats** — CSV download, sticker Excel, formatted complaint cards
- **Dual storage auth** — sessionStorage for security + localStorage for persistence across tabs

---

## 3. Impact & Scale

- Deployed on BEL's **internal network** serving the Customer Support MILCOM team
- Replaced manual register-based tracking for a defense PSU's equipment repair workflow
- Handles **thousands of complaint passes** with **multi-item tracking per pass**
- Manages **spare parts inventory** across **multiple physical storerooms** with full audit trail
- Used daily by operations staff and administrators

---

## 4. Resume Pointers

### For the "Projects" Section

**Pointer 1 — Full-Stack Application**
> Designed and developed a full-stack inventory and complaints management system for BEL (Bharat Electronics Limited) — Customer Support MILCOM division using Django, MongoDB, and React, digitizing the tracking of military communication equipment through the repair lifecycle (Item In → RFD → Dispatch).

**Pointer 2 — Backend & Database Focus**
> Built 40+ RESTful API endpoints in Django with MongoDB (PyMongo), implementing custom token-based authentication, role-based access control, complex search with multi-field filtering, and automated report generation (CSV, formatted Excel) for a defense PSU's internal operations.

**Pointer 3 — Spares Inventory System**
> Engineered a spares inventory management module with real-time stock tracking across multiple physical stores, bin/rack location mapping, returnable item flow with service request tracking, and a complete audit trail for every inventory transaction.

**Pointer 4 — Frontend Focus**
> Developed a 20+ page React SPA with role-based routing, dynamic multi-item forms with cascading dropdowns (Project → Type → Item → Part No), autocomplete search, and multi-format export (CSV, Excel stickers, formatted complaint cards).

**Pointer 5 — Impact-Oriented**
> Delivered an internal web portal for BEL's defense equipment repair division, replacing manual registers and spreadsheets, enabling real-time visibility into complaint status, spare parts availability, and dispatch tracking for the MILCOM Customer Support team.

**Pointer 6 — Data Migration & Legacy Handling**
> Implemented runtime backward-compatible data normalization for migrated legacy records, dynamic Excel template rendering for printable stickers/forms, and automated MongoDB backup to ZIP for operational continuity.

---

### Pick Based on Role You're Applying For:

| Target Role | Recommended Pointers |
|-------------|---------------------|
| Full-Stack Developer | Pointer 1 + Pointer 4 |
| Backend Developer | Pointer 2 + Pointer 3 |
| Frontend Developer | Pointer 4 + Pointer 5 |
| Software Engineer (general) | Pointer 1 + Pointer 5 |
| Data/Inventory Systems | Pointer 3 + Pointer 6 |

---

## 5. Resume One-Liners

Pick the one that fits your resume format:

### General (Recommended)
> **BEL MILCOM Inventory System** — Full-stack Django + MongoDB + React web application for BEL's defense division, managing equipment complaint lifecycle, spares inventory across multiple stores, and outbound dispatch tracking with role-based access and automated report generation.

### Short Version
> **BEL Inventory Management System** — Built a Django/React web app for Bharat Electronics Limited to track military equipment repairs, manage spares inventory, and generate operational reports.

### Impact-First Version
> **BEL Customer Support Portal** — Digitized equipment repair tracking and spares inventory management for BEL's MILCOM division, replacing manual registers with a full-stack web portal (Django, MongoDB, React) used daily by operations teams.

### Technical Version
> **Enterprise Inventory System** — Developed 40+ REST APIs (Django/MongoDB) and a 20+ page React SPA with token auth, cascading dropdowns, dynamic forms, Excel/CSV report generation, and real-time inventory tracking across multiple storerooms.

---

## 6. Skills You Can Claim From This Project

| Category | Skills |
|----------|--------|
| **Languages** | Python, JavaScript (ES6+) |
| **Backend** | Django, REST API design, PyMongo |
| **Frontend** | React 19, React Router, CSS Modules, Axios |
| **Database** | MongoDB (document modeling, aggregation, indexing) |
| **Auth** | Token-based authentication, role-based access control (RBAC) |
| **Reporting** | CSV generation, Excel file generation (openpyxl) |
| **Tools** | Git, npm, pip |
| **Concepts** | SPA architecture, CORS, state management (React hooks), CRUD operations, audit logging, inventory management, data migration |

---

## 7. Common Interview Questions About This Project

**Q: Why MongoDB instead of PostgreSQL/MySQL?**
> Equipment records contain variable-length arrays of items with nested objects. MongoDB's document model is a natural fit — no JOINs needed, and the schema can evolve without migrations. The team was small and didn't need relational integrity constraints.

**Q: Why not Django REST Framework?**
> The API surface is straightforward CRUD. Using raw `JsonResponse` kept the codebase simpler with zero serializer boilerplate. For a small internal team, the trade-off of less auto-documentation was acceptable.

**Q: How do you handle authentication?**
> Custom token-based auth. On login, the server generates a 64-character cryptographic token, stores it in MongoDB's sessions collection. Every request sends the token as a Bearer header. Sessions auto-expire after 24 hours. Passwords are SHA-256 hashed with a salt.

**Q: What was the most challenging part?**
> The spares returnable flow — tracking service requests with partial returns, auto-closing when fully returned, and maintaining accurate stock counts with a complete audit trail across multiple concurrent operations.

**Q: How do you handle data migration from the old system?**
> Runtime normalization — when reading documents, the backend transparently maps old field names to new ones (e.g., `itemRfc` → `itemRfd`) without modifying stored data. This ensures backward compatibility while the UI uses consistent field names.

**Q: How is the app deployed?**
> Intranet deployment on BEL's local network. Django serves the API on port 8000, and the React production build is served as static files. MongoDB runs locally. No cloud infrastructure needed.
