# eDrop Warehouse Management System (WMS) – Product Requirements Document

## 1. Purpose

To deliver a unified, scalable, and sustainable WMS for eDrop, supporting vendor-agnostic inbound/outbound flows, crate/parcel tracking, customer/flat management, marketplace integration, delivery fleet management, CO₂ tracking, and gamification. The system will optimize warehouse and delivery operations, provide transparency to all stakeholders, and drive sustainability goals.

---

## 2. Scope

### In-Scope
- Inbound receiving, validation, and racking (SKU and household/flat-based)
- Storage, bin assignment, and inventory management
- Outbound picking, UoD crate orchestration, conveyor logic
- AI-based final quality validation and crate snapshot for customers
- Customer and flat (apartment) data management
- Vendor, SKU, and order management
- Marketplace (e-commerce) integration: vendor product listing, commission, order flow
- CO₂ calculation and gamification: sustainability tracking, user engagement
- Delivery fleet management: agent, vehicle, route, and performance tracking
- Hardware integration (barcode/QR, thermal printers, AI camera)
- Real-time dashboards, notifications, and reporting
- Audit trails, compliance, and system health monitoring

### Out-of-Scope
- Consumer-facing order placement (handled by main platform, except for marketplace integration)

---

## 3. Tech Stack

| Layer         | Technology             | Notes                                  |
|---------------|------------------------|----------------------------------------|
| Web Frontend  | React.js               | Dashboard, marketplace, ops            |
| Mobile App    | Flutter                | Ops, scanning, delivery, gamification  |
| Backend API   | Node.js/Express        | RESTful APIs, business logic           |
| Optimization  | Python (optional)      | SmartPut, SmartSlot, AI validation     |
| Database      | PostgreSQL             | Relational, supports all entities      |
| Cache/Queue   | Redis                  | Real-time events, queues               |
| DevOps        | Docker, GitHub Actions | CI/CD, containerization                |
| Monitoring    | Prometheus, Grafana    | Metrics, dashboards                    |
| Error Tracking| Sentry (self-hosted)   | Error monitoring                       |
| Hardware      | Barcode/QR plugins     | Flutter: `flutter_barcode_scanner`, `qr_code_scanner`<br>Node: `node-thermal-printer` |
| AI Camera     | OpenCV, TensorFlow     | For crate content validation           |
| Security      | OAuth2/JWT, RBAC       | Open source libraries                  |

---

## 4. Functional Requirements

### 4.1. Customer & Flat (Apartment) Management

- Store customer profiles, contact info, delivery preferences
- Map orders to flats/units and RWA/association
- Household-based order bundling and tracking

### 4.2. Marketplace (E-commerce) Integration

- Vendor product listing and management
- Product catalog, search, and filtering
- Commission calculation and settlement
- Order placement, payment, and status tracking
- Vendor dashboard for sales, commission, and inventory

### 4.3. Inbound Receiving & Validation

- Vendor drop, manifest validation, and discrepancy flagging
- SmartPut bin assignment (SKU/flat-based)
- Real-time vendor notification

### 4.4. Storage & Inventory

- Real-time inventory tracking (SKU, crate, parcel, location)
- Crate lifecycle and maintenance
- Bin management with QR code scanning

### 4.5. Outbound Picking & Conveyor Orchestration

- SmartSlot pick lists by route/slot
- UoD crate conveyor orchestration (dynamic lane bypass)
- Mobile scanning for pick confirmation

### 4.6. Final Quality & AI Camera Validation

- Overhead camera and AI for crate content validation
- Crate snapshot sent to customer before delivery

### 4.7. Dispatch & Handoff

- Label printing (barcode/QR) for each crate
- Agent scan-out and real-time delivery system update

### 4.8. Returns & Exceptions

- Returns processing, inventory update, vendor/customer notification
- Exception logging and automated alerts

### 4.9. Delivery Fleet Management

- Agent and vehicle assignment and tracking
- Route optimization and SmartSlot integration
- Fleet performance analytics (on-time, missed, delayed deliveries)
- Maintenance and compliance logs

### 4.10. CO₂ Calculation & Gamification

- CO₂ savings calculation per delivery, crate, and route
- ESG dashboard for RWAs, vendors, and customers
- Gamification: badges, leaderboards, rewards for green actions (e.g., crate returns, consolidated deliveries)
- Customer and vendor engagement via app notifications

### 4.11. Reporting & Analytics

- Operational dashboards (inbound/outbound, inventory, crate utilization)
- Marketplace analytics (sales, commission, vendor performance)
- Fleet analytics (delivery times, agent performance)
- CO₂ and sustainability reports
- Audit logs and compliance reports

---

## 5. Non-Functional Requirements

- Scalability: Multi-warehouse, multi-RWA, multi-vendor
- Reliability: 99.9% uptime, robust error handling
- Security: Data encryption, access controls, audit trails
- Performance: Sub-second scan-to-update latency
- Usability: Mobile-first UI, minimal training required

---

## 6. User Roles

- Warehouse Operator
- Warehouse Supervisor
- Vendor
- Customer
- Delivery Agent
- Fleet Manager
- Admin

---

## 7. User Stories

### Marketplace
- As a customer, I can browse and order products from multiple vendors.
- As a vendor, I can manage my product listings and view commission reports.

### CO₂ & Gamification
- As a customer, I can view my CO₂ savings and earn badges for sustainable actions.
- As an RWA, I can see the community’s green impact.

### Fleet Management
- As a fleet manager, I can assign agents and vehicles to routes and monitor delivery status.

---

## 8. Success Metrics

- Marketplace GMV and commission revenue
- CO₂ savings per delivery and per RWA
- Fleet on-time delivery rate
- Crate loss/damage rate
- Customer and vendor satisfaction (NPS, feedback)

---

## 9. Risks & Mitigation

- Marketplace fraud: KYC, order validation, payment escrow
- CO₂ miscalculation: Transparent formulas, regular audits
- Fleet downtime: Backup vehicles, real-time alerts
- Data privacy: GDPR compliance, secure storage

---

## 10. Implementation Plan

1. Design and wireframe all modules (WMS, marketplace, fleet, CO₂/gamification)
2. Develop backend, web, and mobile apps in parallel
3. Integrate hardware and AI camera
4. Pilot with one microhub, one RWA, and select vendors
5. Iterate, scale, and roll out to additional locations

---

## 11. Documentation & Training

- User manuals for all roles
- API and integration docs
- Training for ops, vendors, fleet, and customers

---