# ✨ eDrop Warehouse Management System (WMS) – Product Requirements Document

**Version:** 2.1
**Last Updated:** August 6, 2025
**Status:** In Development

## 1. 🎯 Purpose & Vision

To create a state-of-the-art, scalable Warehouse Management System (WMS) that serves as the operational backbone for eDrop's hyperlocal delivery network. The vision is to build a system that not only optimizes logistics but also provides a seamless, efficient, and empowering experience for all administrative and vendor stakeholders.

---

## 2. 🛠️ Technology Ecosystem

This outlines the complete technical stack chosen to build and run the eDrop WMS, balancing performance, scalability, and developer experience.

| Layer          | Technology             | Purpose & Rationale                                          |
|----------------|------------------------|--------------------------------------------------------------|
| 🐍 **Backend**   | Python / FastAPI       | High-performance, modern, and ideal for future AI integration. |
| 🐘 **Database**   | PostgreSQL / Alembic   | Robust, reliable, and version-controlled for schema changes.   |
| ⚛️ **Web App**    | React.js / TypeScript  | For building a type-safe, responsive, and interactive UI.      |
| 🐳 **DevOps**      | Docker, Docker Compose | For containerization and ensuring consistent environments.     |
| 🔑 **Security**   | JWT, Role-Based Access | Standard token-based authentication and access control.        |

---

## 3. 🏛️ System Architecture

The system is designed as a decoupled, service-oriented architecture to ensure scalability, maintainability, and separation of concerns.

```
+---------------------+
|   React Web App     |
| (Admin/Vendor/Ops)  |
+---------------------+
          |
          v
+----------------------------------------------------+
|           🐍 FastAPI Backend API (Python)           |
| (Business Logic, Auth, CRUD Operations)            |
+----------------------------------------------------+
          |
          v
+----------------+
| 🐘 PostgreSQL  |
| (Primary DB)   |
+----------------+
```

---

## 4. 🧬 Core Data Models

This is the blueprint for our database schema, representing the key entities of the system.

#### 👤 `User`
*The central authentication entity for all administrative roles within the WMS.*
- `id` (UUID, PK)
- `name` (String)
- `email` (String, Unique, Indexed)
- `hashed_password` (String)
- `role` (Enum: `ADMIN`, `MANAGER`, `OPERATOR`, `VIEWER`)
- `is_active` (Boolean, Default: `true`)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 🏭 `Vendor`
*Represents a third-party vendor or business entity supplying products.*
- `id` (UUID, PK)
- `business_name` (String, Unique, Indexed)
- `email` (String, Unique)
- `phone_number` (String)
- `vendor_type` (Enum: `SKU`, `FLAT`)
- `vendor_status` (Enum: `ACTIVE`, `INACTIVE`, `KYC_PENDING`)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 🏪 `Store`
*Represents a physical or virtual store owned and operated by a vendor.*
- `id` (UUID, PK)
- `vendor_id` (FK to `Vendor`, Indexed)
- `store_name` (String)
- `address` (String)
- `store_status` (Enum: `ACTIVE`, `INACTIVE`)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 📦 `Product`
*A unique item or SKU that can be sold by vendors.*
- `id` (UUID, PK)
- `name` (String)
- `sku` (String, Unique, Indexed)
- `description` (Text, Nullable)
- `price` (Decimal)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 🔗 `StoreProduct`
*The association table linking products to the stores that sell them, creating a many-to-many relationship.*
- `store_id` (FK to `Store`, PK)
- `product_id` (FK to `Product`, PK)

---

## 5. 📡 API Design Philosophy

Our API is designed to be clean, predictable, and easy to use, following RESTful best practices to ensure a great developer experience.

-   **Versioning:** All endpoints are prefixed with `/api/v1/` to allow for future, non-breaking API versions.
-   **Authentication:** All secure endpoints expect an `Authorization: Bearer <JWT_TOKEN>` header for authentication.
-   **Data Format:** All request and response bodies are in `JSON` format.
-   **Status Codes:** We use standard HTTP status codes to indicate the outcome of a request (e.g., `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `403 Forbidden`).
-   **Error Responses:** Failed requests return a consistent JSON error object providing clear feedback: `{"detail": "A descriptive error message explaining what went wrong."}`.

#### Example Endpoint: Vendor Management (`/api/v1/vendors`)
- `POST /vendors`: Create a new vendor. Requires Admin role.
- `GET /vendors`: Retrieve a paginated list of all vendors.
- `GET /vendors/{vendor_id}`: Get detailed information for a specific vendor.
- `PUT /vendors/{vendor_id}`: Update a vendor's details. Requires Admin role.
- `DELETE /vendors/{vendor_id}`: Deactivate a vendor. Requires Admin role.

---

*(The rest of the PRD sections like Functional Requirements, User Stories, etc., would follow, now built upon this solid architectural foundation.)*