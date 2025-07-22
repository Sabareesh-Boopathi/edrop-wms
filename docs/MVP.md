# eDrop WMS – MVP Scope & Plan

## Objective

Deliver a functional, end-to-end MVP of the eDrop Warehouse Management System that demonstrates the core flows for vendors, warehouse staff, delivery agents, and customers, including basic marketplace, fleet, and sustainability features.

---

## MVP Modules & Features

### 1. User & Role Management
- User registration/login (Warehouse Operator, Vendor, Delivery Agent, Customer, Admin)
- Role-based access control

### 2. Customer & Flat Management
- Create and manage customer profiles
- Map customers to flats/apartments and RWAs

### 3. Vendor & Product Management
- Vendor onboarding (manual for MVP)
- Vendor product listing (basic CRUD)
- Product catalog visible to customers

### 4. Marketplace (E-commerce) Flow
- Customers can browse products and place orders
- Orders mapped to vendors and customer flats
- Simple commission calculation per order

### 5. Inbound Receiving & Storage
- Warehouse operator can receive vendor shipments
- Scan/enter items by SKU or flat
- Assign items to bins/racks (manual SmartPut for MVP)
- Real-time inventory update

### 6. Outbound Picking & Packing
- Generate pick lists by delivery slot/route
- Operator confirms picks (mobile/web)
- Assign items to UoD crates (manual for MVP)
- Print basic labels (optional for MVP)

### 7. Dispatch & Delivery Handoff
- Assign orders/crates to delivery agents
- Agent marks orders as dispatched/delivered

### 8. Returns & Exceptions
- Operator can log returns and exceptions (damage, missing, etc.)
- Inventory updated accordingly

### 9. Fleet Management (Basic)
- Register delivery agents and vehicles
- Assign agents to routes
- Track delivery status (manual update for MVP)

### 10. CO₂ Calculation & Gamification (Basic)
- Calculate estimated CO₂ saved per consolidated delivery
- Display simple ESG dashboard for admins
- Award basic badges for crate returns or green deliveries

### 11. Reporting & Dashboards
- Basic dashboards for inventory, orders, deliveries, and sustainability metrics

---

## Out of Scope for MVP
- Full automation of SmartPut/SmartSlot logic (manual for MVP; **AI/automation as stretch goal**)
- AI camera validation (manual photo upload if needed; **AI validation as stretch goal**)
- Advanced gamification (leaderboards, complex rewards; **can be added post-MVP**)
- Payment gateway integration (simulate payments)
- Advanced notifications (basic email/app notifications only)

---

## Stretch Goals / Phase 2 (Optional for MVP)

- **AI Camera Validation:** Integrate AI-based crate content validation and auto-discrepancy flagging.
- **SmartPut/SmartSlot Automation:** Implement AI/algorithm-driven bin assignment and route/slot optimization.
- **Advanced Gamification:** Add leaderboards, complex rewards, and community challenges.
- **Automated Exception Handling:** Use AI to predict and flag potential issues in inventory or delivery.
- **Predictive Analytics:** Use AI/ML for demand forecasting and inventory optimization.

---

## MVP Tech Stack

- **Backend:** Node.js/Express, PostgreSQL
- **Web Frontend:** React.js
- **Mobile App:** Flutter (for warehouse ops and delivery agents)
- **Auth:** JWT (simple implementation)
- **DevOps:** Docker (local), GitHub Actions (CI)
- **Other:** Manual barcode/QR entry (scanner integration optional for MVP)

---

## MVP Milestones

1. **Project Setup & Repo Structure** (1 week)
2. **User, Role, and Auth Module** (1 week)
3. **Vendor, Product, and Customer Management** (1 week)
4. **Marketplace & Order Flow** (2 weeks)
5. **Warehouse Inbound/Outbound & Inventory** (2 weeks)
6. **Fleet & Delivery Management** (1 week)
7. **CO₂ & Gamification (Basic)** (1 week)
8. **Dashboards & Reporting** (1 week)
9. **Testing, Bug Fixes, and Documentation** (1 week)
10. **Pilot Deployment** (1 week)
11. **(Optional) AI & Automation Integration** (2 weeks, if time/resources allow)

---

## Success Criteria

- End-to-end flow: Vendor → Warehouse → Customer → Delivery → Return
- At least one RWA, one vendor, and one delivery agent can complete the full cycle
- Basic dashboards and sustainability metrics visible to admin
- Feedback from pilot users collected for next iteration
- **(Optional) AI/automation features piloted and evaluated**

---

## Status Tracking

| Module                        | Status      | Owner      | Notes                        |
|-------------------------------|------------|------------|------------------------------|
| Project Setup                 | Not Started|            |                              |
| User & Role Management        | Not Started|            |                              |
| Customer & Flat Management    | Not Started|            |                              |
| Vendor & Product Management   | Not Started|            |                              |
| Marketplace & Order Flow      | Not Started|            |                              |
| Inbound/Outbound & Inventory  | Not Started|            |                              |
| Fleet & Delivery Management   | Not Started|            |                              |
| CO₂ & Gamification            | Not Started|            |                              |
| Dashboards & Reporting        | Not Started|            |                              |
| Testing & Documentation       | Not Started|            |                              |
| Pilot Deployment              | Not Started|            |                              |
| AI & Automation (Stretch)     | Not Started|            | Optional, post-core MVP      |

_Update this table as you progress._

---

## Next Steps

- Finalize MVP wireframes and data models
- Assign tasks and set up project management board
- Start with user/auth module and basic data models
- **Plan for AI/automation integration as a stretch goal**