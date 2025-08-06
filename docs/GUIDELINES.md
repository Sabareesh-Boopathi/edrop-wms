# eDrop WMS - Comprehensive Development Guidelines

**Version:** 2.0
**Last Updated:** August 6, 2025

This document provides a comprehensive set of guidelines for developers contributing to the eDrop WMS project. Following these standards is crucial for ensuring code consistency, quality, and long-term maintainability across both the backend and frontend.

---

## 1. 📜 General Principles & Philosophy

- **Clarity Over Cleverness:** Write code that is straightforward, readable, and easy for others to understand and debug.
- **Consistency is Key:** Adhere to the established patterns, styles, and architecture in the codebase. If a pattern is repeated, it should be consistent.
- **Keep It Simple (KIS):** Strive for the simplest possible solution that meets the requirements. Avoid over-engineering and unnecessary complexity.
- **Document Thoughtfully:** Document *why* something was done a certain way, not just *what* it does. Focus on complex logic, architectural decisions, and public APIs.

---

## 2. 🐍 Backend Development (Python/FastAPI)

### Code Style & Formatting
- **PEP 8 Compliance:** All Python code must adhere to the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide.
- **Automated Formatting:** Use `black` for code formatting and `isort` for import sorting to ensure a uniform style.
- **Type Hinting:** Use type hints for all function signatures, variables, and data structures. This is critical for static analysis and code clarity.
- **Function Design:** Keep functions small, pure (where possible), and focused on a single, well-defined responsibility.

### API Design & RESTful Practices
- **RESTful Principles:** Design all endpoints to be stateless and follow REST conventions. Use nouns for resources (e.g., `/users`) and HTTP verbs for actions (`GET`, `POST`, `PUT`, `DELETE`).
- **Endpoint Naming:** Use clear, consistent, and plural naming for endpoints (e.g., `/api/v1/users`, `/api/v1/vendors`).
- **Data Validation:** Use Pydantic models (`schemas`) for all request and response validation to ensure strict data contracts.
- **Dependency Injection:** Leverage FastAPI's dependency injection system for database sessions, authentication, and other shared resources.

### Database & Data Modeling
- **Alembic for Migrations:** All database schema changes **must** be managed through Alembic. Create a new, descriptively named migration for each atomic change.
- **Efficient Queries:** Write optimized database queries. Use `selectinload` or `joinedload` to prevent N+1 query problems when fetching related models.
- **Model Design:** All SQLAlchemy models should inherit from a common `Base` model and have clear, well-defined relationships.

### Testing
- **Comprehensive Test Coverage:** Write unit and integration tests for all new features, business logic, and bug fixes.
- **Testing Framework:** Use `pytest` as the standard testing framework.
- **Test Isolation:** Keep tests independent and isolated. Use `pytest` fixtures to set up and tear down test data and state.

---

## 3. ⚛️ Frontend Development (React/TypeScript)

### Code Style & Formatting
- **Prettier & ESLint:** Use **Prettier** for automated code formatting and **ESLint** for identifying and fixing code quality issues.
- **TypeScript First:** All new components, services, and logic must be written in TypeScript to leverage static typing.
- **Naming Conventions:**
    - Components: `PascalCase` (e.g., `VendorTable.tsx`)
    - Hooks: `useCamelCase` (e.g., `useVendorData.ts`)
    - Variables/Functions: `camelCase`

### Component-Based Architecture
- **Reusable Components:** Design and build small, reusable components whenever possible to maintain a consistent UI and reduce code duplication.
- **Single Responsibility:** Each component should have a single, clear purpose. If a component becomes too large or complex, break it down into smaller sub-components.
- **Props & State:** Use props for passing data down the component tree and callbacks for passing events up. State should be managed at the lowest possible level in the component tree where it is needed.

### State Management
- **Local State:** Use React hooks (`useState`, `useReducer`, `useEffect`, `useContext`) for managing local component state.
- **Global State:** For state that needs to be shared across the application (e.g., user authentication, theme), use a dedicated state management library like **Zustand** or **Redux Toolkit**.

### Styling
- **CSS Modules:** Use CSS Modules for component-level styling to encapsulate styles and avoid global scope pollution. Name files as `ComponentName.module.css`.
- **Design System:** Maintain a consistent design language by using shared CSS variables for colors, fonts, spacing, and other design tokens.
- **Responsiveness:** Ensure the UI is fully responsive and provides a good user experience on all common screen sizes, from mobile to desktop.

### API Interaction
- **Dedicated Service Layer:** Abstract all API interactions into a dedicated service layer. This decouples data fetching logic from the UI components.
- **Data Fetching Library:** Use a modern data fetching library like **React Query** or **SWR** to handle data fetching, caching, server-state synchronization, and error handling.

---

## 4.  Git & Version Control Workflow

- **Branching Strategy:** Create a new feature branch from `main` for each new feature, bug fix, or chore. Use a clear and descriptive naming convention.
  - `feature/add-vendor-page`
  - `fix/login-form-validation-bug`
  - `docs/update-readme`
- **Commit Hygiene:** Write clear, concise, and meaningful commit messages. Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
  - `feat: Add vendor management page with CRUD functionality`
  - `fix: Correct password validation logic in login form`
  - `docs: Update README with new backend setup instructions`
- **Pull Requests (PRs):**
  - Before creating a PR, ensure your branch is rebased on the latest `main` branch to avoid merge conflicts.
  - Provide a clear and detailed description of the `changes in the PR, including the "why"` behind the changes.
  - Ensure all automated checks (linting, tests) are passing before requesting a review.
  - At least one other developer must review and approve the PR before it can be merged into `main`.

---

By adhering to these guidelines, we can collectively build a high-quality, robust, and maintainable application. Thank you for your contributions!
