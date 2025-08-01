---
mode: agent
---

## 🧠 Task Objective
Create a new folder named `frontend` and set up a production-ready, responsive, and visually appealing React-based frontend for the **eDrop WMS (Warehouse Management System)** application.

This frontend must integrate seamlessly with the existing **FastAPI backend**, and comply with functional and non-functional specs defined in:
- `docs/MVP.md`
- `docs/PRD.md`
- `README.md`

## 📦 Requirements

- **React (preferably with TypeScript)**
- Use a modern UI library (Tailwind CSS, Material UI, or similar)
- Routing (`react-router-dom`)
- API calls via `axios` and/or `react-query`
- State management (`Zustand`, `Redux Toolkit`, or `Context API` depending on complexity)
- Form validation (`react-hook-form`, `yup`)
- Folder structure must follow clean, modular design (e.g., feature-based or atomic design)
- Environment config handling for dev/prod via `.env` files
- ESLint + Prettier + Husky for consistent code formatting and commit hooks
- Build-ready with `Vite` or `CRA` (prefer Vite for speed and flexibility)

## ✅ Success Criteria

- `frontend/` folder is initialized with a full React app scaffold
- All required dependencies installed and configured
- Sample pages implemented (Login, Dashboard, Warehouse Ops, Bin Assignment)
- Code is clean, scalable, and modular
- FastAPI backend successfully connected via API service layer
- Environment-specific config loading verified
- Production-ready build configuration tested (`npm run build`)

## 🔍 Reference

Please refer to:
- `docs/MVP.md` for minimum feature scope
- `docs/PRD.md` for expected UI/UX standards
- `README.md` for environment and architecture overview

Ensure all suggestions align with modern frontend development best practices and are scalable for a real-world logistics platform.