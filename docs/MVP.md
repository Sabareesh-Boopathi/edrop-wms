# eDrop WMS – MVP Scope & Plan

## Objective

Deliver a functional, end-to-end MVP of the eDrop Warehouse Management System that demonstrates the core flows for vendors, warehouse staff, delivery agents, and customers, including basic marketplace, fleet, and sustainability features.

---

## MVP Modules & Features

### 👤 1. User & Role Management
- User registration/login (Warehouse Operator, Vendor, Delivery Agent, Customer, Admin)
- Role-based access control

### 🏢 2. Warehouse Management
- Create and manage warehouse profiles (e.g., name, address, contact info)
- Associate warehouse operators with a specific warehouse

### 🏠 3. Customer & Flat Management
- Create and manage customer profiles
- Map customers to flats/apartments and RWAs

### 🏪 4. Vendor & Product Management
- Vendor onboarding (manual for MVP)
- Vendor product listing (basic CRUD)
- Product catalog visible to customers

### 🛒 5. Marketplace (E-commerce) Flow
- Customers can browse products and place orders
- Orders mapped to vendors and customer flats
- Simple commission calculation per order

### 📥 5. Inbound Receiving & Storage
- Warehouse operator can receive vendor shipments
- Scan/enter items by SKU or flat
- Assign items to bins/racks (manual SmartPut for MVP)
- Real-time inventory update (per warehouse)

### 📤 6. Outbound Picking & Packing
- Generate pick lists by delivery slot/route (originating from a warehouse)
- Operator confirms picks (mobile/web)
- Assign items to UoD crates (manual for MVP)
- Print basic labels (optional for MVP)

### 🚚 7. Dispatch & Delivery Handoff
- Assign orders/crates to delivery agents
- Agent marks orders as dispatched/delivered

### ↩️ 8. Returns & Exceptions
- Operator can log returns and exceptions (damage, missing, etc.)
- Inventory updated accordingly

### 🚛 9. Fleet Management (Basic)
- Register delivery agents and vehicles
- Assign agents to routes
- Track delivery status (manual update for MVP)

### ♻️ 10. CO₂ Calculation & Gamification (Basic)
- Calculate estimated CO₂ saved per consolidated delivery
- Display simple ESG dashboard for admins
- Award basic badges for crate returns or green deliveries

### 📊 11. Reporting & Dashboards
- Basic dashboards for inventory, orders, deliveries, and sustainability metrics

---

## ❌ Out of Scope for MVP
- Full automation of SmartPut/SmartSlot logic
- AI camera validation
- Advanced gamification (leaderboards, complex rewards)
- Payment gateway integration
- Advanced notifications

---

## ✨ Stretch Goals / Phase 2 (Optional for MVP)

- **🤖 AI Camera Validation:** Integrate AI-based crate content validation.
- **🧠 SmartPut/SmartSlot Automation:** Implement AI/algorithm-driven bin assignment.
- **🏆 Advanced Gamification:** Add leaderboards and community challenges.
- **🔮 Predictive Analytics:** Use AI/ML for demand forecasting.

---

## 🛠️ MVP Tech Stack

- **Backend:** 🐍 Python/FastAPI, 🐘 PostgreSQL
- **Web Frontend:** ⚛️ React.js
- **Mobile App:** 🐦 Flutter
- **Auth:** 🔑 JWT
- **DevOps:** 🐳 Docker, 🚀 GitHub Actions
- **Other:** 📱 Manual barcode/QR entry

---

## 🗺️ MVP Milestones

1.  **🏗️ Project Setup & Repo Structure** (1 week)
2.  **🔐 User, Role, and Auth Module** (1 week)
3.  **🛍️ Vendor, Product, and Customer Management** (1 week)
4.  **🛒 Marketplace & Order Flow** (2 weeks)
5.  **📦 Warehouse Inbound/Outbound & Inventory** (2 weeks)
6.  **🚚 Fleet & Delivery Management** (1 week)
7.  **🏆 CO₂ & Gamification (Basic)** (1 week)
8.  **📈 Dashboards & Reporting** (1 week)
9.  **🧪 Testing, Bug Fixes, and Documentation** (1 week)
10. **🚀 Pilot Deployment** (1 week)
11. **🤖 (Optional) AI & Automation Integration** (2 weeks)

---

## ✅ Success Criteria

- End-to-end flow: Vendor → Warehouse → Customer → Delivery → Return
- At least one RWA, one vendor, and one delivery agent can complete the full cycle
- Basic dashboards and sustainability metrics visible to admin
- Feedback from pilot users collected for next iteration

---

## 📈 Status Tracking

| Module                        | Status      | Owner      | Notes                                      |
|-------------------------------|-------------|------------|--------------------------------------------|
| Project Setup                 | ✅ Completed |            | Docker, Python structure, Alembic, Test DB |
| Core Data Models              | ✅ Completed |            | All DB tables created via Alembic          |
| User & Role Management        | 🟡 In Progress |            | Backend API complete. Frontend pending.    |
| Warehouse Management          | 🟡 In Progress |            | Backend API complete. Frontend pending.    |
| Customer & Flat Management    | 🟡 In Progress |            | Backend API complete. Frontend pending.    |
| Vendor & Product Management   | 🟡 In Progress |            | Backend API complete. Frontend pending.    |
| Marketplace & Order Flow      | ⚪ Not Started |            |                                            |
| Inbound/Outbound & Inventory  | ⚪ Not Started |            |                                            |
| Fleet & Delivery Management   | ⚪ Not Started |            |                                            |
| CO₂ & Gamification            | ⚪ Not Started |            |                                            |
| Dashboards & Reporting        | ⚪ Not Started |            |                                            |
| Testing & Documentation       | 🟡 In Progress |            | Initial test suite for all models created. |
| Pilot Deployment              | ⚪ Not Started |            |                                            |
| AI & Automation (Stretch)     | ⚪ Not Started |            | Optional, post-core MVP                    |

_Update this table as you progress._

---

## ✅ Completed Initial Steps

- Finalized core data models and database schema via Alembic.
- Set up the project structure with Docker, FastAPI, and a test database.
- Implemented the backend APIs for User, Customer, Vendor, Product, and Warehouse management.
- Created the initial test suite structure for all core models.

---

## 👉 Next Steps

- **Stabilize Backend:** Resolve all failures in the test suite to ensure the existing APIs are robust.
- **Begin Frontend Development:** Start building the frontend application, focusing first on the user login and registration flow to connect with the completed auth API.
- **Implement Order Flow:** Begin backend development for the "Marketplace & Order Flow" module, allowing customers to