# eDrop-UrbanHive WMS 📦

[![Status](https://img.shields.io/badge/Status-In%20Progress-yellow)](./docs/MVP.md)

Welcome to the eDrop-UrbanHive Warehouse Management System (WMS) backend. This project is a modern, API-driven platform designed to streamline last-mile logistics for urban residential communities, focusing on efficiency, consolidation, and sustainability.

---

## ✨ Key Features

- **Multi-Tenant Roles:** Manages distinct roles and permissions for Admins, Warehouse Operators, Vendors, Delivery Agents, and Customers.
- **Warehouse & Inventory Management:** Core logic for inbound receiving, storage, and real-time inventory tracking.
- **Vendor & Product Management:** Allows vendors to manage their product listings within the marketplace.
- **Marketplace & Order Flow:** Enables customers to browse products and place orders, which are then routed for fulfillment.
- **Fleet & Delivery Operations:** Basic tools for managing delivery agents, vehicles, and tracking order status.
- **Sustainability Tracking:** Foundational features for calculating and reporting on CO₂ savings from consolidated deliveries.

---

## 🛠️ Tech Stack

- **Backend:** **Python 3.11** with **FastAPI**
- **Database:** **PostgreSQL** with **Alembic** for migrations
- **Authentication:** **JWT** (JSON Web Tokens)
- **Testing:** **Pytest**
- **Containerization:** **Docker** & **Docker Compose**
- **CI/CD:** GitHub Actions (planned)
- **Frontend:** React.js (planned)
- **Mobile:** Flutter (planned)

---

## 🚀 Project Status

The backend is **🟢 Partially Completed** (all core APIs and tests passing, frontend pending). Frontend and deployment work are now the priority.

- 🟢 **Backend:** All core backend APIs (User, Warehouse, Customer, Vendor, Product, Marketplace/Order) and test suite are complete and passing. Database schema is finalized, Docker environment is configured.
- 🟡 **Frontend:** React.js app setup and integration with backend APIs is next. Initial focus: user login, registration, and dashboard flows.
- ⚪ **Deployment:** Docker, environment variables, and CI/CD pipeline setup for production and pilot deployment.

For a detailed breakdown and next steps, see the [**MVP Scope & Plan**](./docs/MVP.md).

---

## 🏁 Getting Started

Follow these instructions to get the backend running locally for development and testing. Frontend setup instructions are included below.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd edrop-wms
    ```

2.  **Create the environment file:**
    Copy the example environment file. The default values are configured for the local Docker setup.
    ```powershell
    copy .env.example .env
    ```

3.  **Build and run the containers:**
    This command will build the FastAPI backend image and start the `backend` and `postgres` services.
    ```powershell
    docker-compose up --build
    ```

4.  **Verify the backend API:**
    The API will be running at `http://localhost:8000`. You can access the interactive API documentation at:
    - **Swagger UI:** `http://localhost:8000/docs`
    - **ReDoc:** `http://localhost:8000/redoc`

### Frontend Setup (React.js)

The frontend is planned and will be located in the `frontend/` directory. To begin development:

1.  **Navigate to the frontend directory:**
    ```powershell
    cd frontend
    ```
2.  **Install dependencies:**
    ```powershell
    npm install
    ```
3.  **Start the development server:**
    ```powershell
    npm start
    ```
4.  **Connect to backend:**
    Ensure the backend is running at `http://localhost:8000` and update any API URLs in the frontend config as needed.

### Running the Test Suite

To run the complete backend test suite against a dedicated test database, use the following command:

```powershell
docker-compose run --rm backend pytest
```

This will generate an HTML test report in the `test-reports/` directory.

---

## 📂 Project Structure

```
.
├── backend/            # FastAPI backend source code
│   ├── app/            # Core application logic (api, models, schemas, etc.)
│   ├── tests/          # Pytest test suite
│   ├── Dockerfile      # Backend Dockerfile
│   └── alembic/        # DB migrations
├── frontend/           # React.js frontend (planned)
├── mobile/             # Flutter mobile app (planned)
├── scripts/            # Utility scripts
├── docs/               # Project documentation (PRD, MVP, etc.)
├── docker/             # Supporting Docker scripts (wait-for-postgres, etc.)
├── test-reports/       # Output directory for test reports
├── docker-compose.yml  # Main Docker Compose configuration
```

> **Note:** If `.env` or `.env.example` are missing, create them in the project root. You can copy the following template:

**.env.example**
```env
# Example environment variables
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=edrop_wms
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
JWT_SECRET=your_jwt_secret
DEBUG=True
```

Then copy `.env.example` to `.env` and update values as needed for your local setup.

---


## 🤝 Contributing

1. Fork the repository and create your branch from `main`.
2. Follow code style and commit guidelines (see `docs/` for details).
3. Run tests before submitting a PR.
4. Document any new endpoints or features in the appropriate markdown files.

---

## 📄 Documentation

For more detailed information on project requirements, scope, and planning, please refer to the [**docs**](./docs/) directory.
