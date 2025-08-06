# eDrop WMS – MVP Scope & Plan

## Objective

Deliver a functional, end-to-end MVP of the eDrop Warehouse Management System that demonstrates the core flows for vendors, warehouse staff, and administrators, focusing on vendor and store management, product handling, and a consistent user interface.

---

## MVP Modules & Features

### 👤 1. User & Role Management
- User registration/login (Admin, Warehouse Operator, Vendor)
- Role-based access control for API endpoints and UI components.

### 🏢 2. Vendor Management
- Onboard new vendors with detailed profiles (business name, contact info, status, etc.).
- Full CRUD (Create, Read, Update, Delete) functionality for vendors.
- A dedicated UI for viewing and managing all vendors.

### 🏪 3. Store Management
- Allow vendors to create and manage multiple stores.
- Each store has its own profile (name, address, operational hours).
- Associate stores with vendors.

### 📦 4. Product Management
- Enable vendors to add and manage products.
- Normalize the relationship between stores and products using a `StoreProduct` association table.
- Products have essential attributes like name, description, price, and SKU.

### 💻 5. Frontend UI
- A responsive and intuitive administrative dashboard built with React.js and TypeScript.
- Consistent styling and component usage across different management pages (Users, Vendors, Warehouses).
- Interactive tables, modals for editing/creating, and KPI cards for at-a-glance metrics.

### 🗃️ 6. Database & Migrations
- A well-defined PostgreSQL database schema.
- Use Alembic for managing and applying database migrations to keep the schema in sync with the models.

---

## ❌ Out of Scope for MVP
- Customer-facing marketplace and order flow.
- Delivery agent and fleet management.
- Advanced inventory management (e.g., real-time tracking, bin assignments).
- CO₂ calculation and sustainability tracking.
- Payment gateway integration.

---

## ✨ Stretch Goals / Phase 2
- **Marketplace Integration:** Build the customer-facing e-commerce flow.
- **Advanced Inventory:** Implement detailed inventory tracking and warehouse automation features.
- **Mobile App:** Develop the Flutter application for delivery agents and operators.
- **Analytics & Reporting:** Create comprehensive dashboards for business intelligence.

---

## 🛠️ MVP Tech Stack

- **Backend:** 🐍 Python/FastAPI, 🐘 PostgreSQL,  alembic
- **Web Frontend:** ⚛️ React.js, TypeScript
- **Auth:** 🔑 JWT
- **DevOps:** 🐳 Docker, Docker Compose

---

## 🗺️ MVP Milestones

1.  **🏗️ Project Setup & Backend Foundation** (Completed)
2.  **🔐 User & Vendor Backend** (Completed)
3.  **🏪 Store & Product Backend** (Completed)
4.  **💻 Frontend UI for User & Vendor Management** (Completed)
5.  **📦 Frontend UI for Store & Product Management** (In Progress)
6.  **🧪 End-to-End Testing & Bug Fixes** (In Progress)
7.  **🚀 Pilot Deployment** (Planned)

---

## 📈 Status Tracking

| Module                        | Status      | Notes                                      |
|-------------------------------|-------------|--------------------------------------------|
| Project Setup                 | ✅ Completed | Docker, FastAPI backend, React frontend.   |
| Core Data Models              | ✅ Completed | User, Vendor, Store, Product models defined. |
| User & Role Management        | ✅ Completed | Backend API and frontend UI are functional. |
| Vendor & Store Management     | ✅ Completed | Backend API and frontend UI are functional. |
| Product Management            | 🟢 In Progress | Backend API complete, frontend UI pending. |
| Testing & Documentation       | 🟡 In Progress | Backend tests passing, documentation updated. |
| Pilot Deployment              | ⚪ Not Started |                                            |

---

## 👉 Next Steps

- **Frontend Development:**
    - Complete the UI for managing products within stores.
    - Refine the existing UI components for better reusability.
    - Add comprehensive error handling and loading states.
- **Backend Development:**
    - Expand the test suite to cover more edge cases.
    - Optimize database queries for performance.
- **Deployment Planning:**
    - Finalize the Docker setup for production.
    - Configure CI/CD pipelines for automated builds and deployments.
    - Plan for a staging environment for pre-production testing.