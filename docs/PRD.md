# ✨ eDrop Warehouse Management System (WMS) – Product Requirements Document

**Version:** 2.0
**Date:** July 23, 2025
**Status:** In Development

## 1. 🎯 Purpose & Vision

To create a state-of-the-art, scalable Warehouse Management System (WMS) that serves as the operational backbone for eDrop's hyperlocal delivery network. The vision is to build a system that not only optimizes logistics but also champions sustainability, engages communities, and provides a seamless experience for all stakeholders—from vendors to the end customer's doorstep.

---

## 2. 🛠️ Technology Ecosystem

This outlines the complete technical stack chosen to build and run the eDrop WMS.

| Layer          | Technology             | Purpose & Rationale                                          |
|----------------|------------------------|--------------------------------------------------------------|
| 🐍 **Backend**   | Python / FastAPI       | High-performance, modern, and ideal for future AI integration. |
| 🐘 **Database**   | PostgreSQL             | Robust, reliable, and excellent for complex relational data.   |
| ⚛️ **Web App**    | React.js               | Industry standard for building responsive, interactive UIs.    |
| 🐦 **Mobile App**  | Flutter                | Cross-platform for iOS/Android, enabling rapid development.    |
| ⚡ **Cache**      | Redis                  | For session storage, caching frequent queries, and rate limiting.|
| 🔄 **Queue**       | Redis / Celery         | To manage background jobs like notifications and report generation.|
| 🐳 **DevOps**      | Docker, GitHub Actions | For containerization, CI/CD, and ensuring consistent environments.|
| 📊 **Monitoring** | Prometheus, Grafana    | For real-time system health monitoring and performance dashboards.|
| 🔑 **Security**   | OAuth2 / JWT, RBAC     | Standard token-based authentication and role-based access control.|
| 📷 **AI/ML**     | OpenCV, PyTorch        | For computer vision tasks like crate content validation.       |

---

## 3. 🏛️ System Architecture

The system is designed as a decoupled, service-oriented architecture to ensure scalability and maintainability.

```
+---------------------+      +----------------------+
|   React Web App     |      |  Flutter Mobile App  |
| (Admin/Vendor/Ops)  |      | (Ops/Delivery/User)  |
+---------------------+      +----------------------+
          |                            |
          +--------------+-------------+
                         |
                         v
+----------------------------------------------------+
|           🐍 FastAPI Backend API (Python)           |
| (Business Logic, Auth, AI/ML, Notifications)       |
+----------------------------------------------------+
                         |
           +-------------+----------------+
           |             |                |
           v             v                v
+----------------+ +-------------+ +----------------+
| 🐘 PostgreSQL  | | ⚡ Redis     | |  📷 AI Camera  |
| (Primary DB)   | | (Cache/Queue) | | (Validation)   |
+----------------+ +-------------+ +----------------+
```

---

## 4. 🧬 Core Data Models

This is the blueprint for our database schema, representing the key entities of the system.

#### 🏢 `RWA` (Resident Welfare Association / Community)
*Represents a gated community or apartment complex.*
- `id` (UUID, PK)
- `name` (String)
- `address` (Text)
- `city` (String)

#### 🏠 `Flat`
*Represents a single household or unit within an RWA.*
- `id` (UUID, PK)
- `rwa_id` (FK to `RWA`)
- `tower_block` (String, e.g., "A")
- `flat_number` (String, e.g., "1204")

#### 👤 `User`
*The central authentication entity. All people interacting with the system are Users.*
- `id` (UUID, PK)
- `name` (String)
- `email` (String, Unique)
- `hashed_password` (String)
- `role` (Enum: `admin`, `warehouse_operator`, `vendor`, `delivery_agent`, `customer`)
- `is_active` (Boolean)

#### 🧑‍🤝‍🧑 `Customer`
*The profile for a customer, linked to a User and a Flat.*
- `id` (UUID, PK)
- `user_id` (FK to `User`)
- `flat_id` (FK to `Flat`)
- `phone_number` (String, Unique)

#### 🏭 `Warehouse`
*Represents a physical micro-hub or warehouse location.*
- `id` (UUID, PK)
- `name` (String)
- `address` (Text)
- `city` (String)
- `manager_id` (FK to `User`, nullable)

#### 📦 `Product`
*An item sold by a vendor.*
- `id` (UUID, PK)
- `name` (String)
- `sku` (String, Unique)
- `price` (Decimal)
- `vendor_id` (FK to `User` where role is `vendor`)

#### 🛒 `Order`
*A customer's order, containing multiple products.*
- `id` (UUID, PK)
- `customer_id` (FK to `Customer`)
- `warehouse_id` (FK to `Warehouse`)
- `status` (Enum: `pending`, `processing`, `out_for_delivery`, `delivered`, `cancelled`)
- `total_amount` (Decimal)
- `created_at` (Timestamp)

---

## 5. 📡 API Design Philosophy

Our API will be clean, predictable, and easy to use, following RESTful best practices.

-   **Versioning:** All endpoints will be prefixed with `/api/v1/` to allow for future versions without breaking changes.
-   **Authentication:** Secure endpoints will expect an `Authorization: Bearer <JWT_TOKEN>` header.
-   **Data Format:** All request and response bodies will be in `JSON`.
-   **Status Codes:** We will use standard HTTP status codes to indicate success or failure (e.g., `200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `403 Forbidden`).
-   **Error Responses:** Failed requests will return a consistent JSON error object: `{"detail": "A clear, descriptive error message."}`.

#### Example: Customer Management (`/api/v1/customers`)
- `POST /customers`: Create a new customer profile.
- `GET /customers/{customer_id}`: Get details for a specific customer.
- `PUT /customers/{customer_id}`: Update a customer's details.

---

*(The rest of the PRD sections like Functional Requirements, User Stories, etc., would follow, now built upon this solid architectural foundation.)*