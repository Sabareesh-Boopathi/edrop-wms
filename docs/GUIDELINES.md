# Frontend Development Guidelines

This document outlines the standards and best practices for developing frontend components and pages in the eDrop WMS project. Following these guidelines will ensure our codebase is consistent, maintainable, and scalable.

## 1. Core Principles

- **Component-Based Architecture**: The UI is built from reusable and encapsulated components.
- **Separation of Concerns**: We separate the component's structure (JSX) from its styling (CSS). Logic is handled within the component, but styling is delegated to a dedicated stylesheet.
- **Consistency**: All components and pages should follow the same structural and styling patterns.

## 2. File Structure

Components and their corresponding stylesheets should be located together.

### For Pages:

Each page should reside in the `src/pages` directory. For complex pages, create a dedicated folder. For simpler pages, the `.tsx` and `.css` files can coexist.

**Example: A simple `WarehouseManagement` page**
```
src/
└── pages/
    └── administration/
        ├── WarehouseManagement.tsx
        └── WarehouseManagement.css
```

### For Reusable Components:

Reusable UI elements (like buttons, modals, cards) should be placed in `src/components`.

**Example: A `Button` component**
```
src/
└── components/
    └── ui/
        ├── Button.tsx
        └── Button.css  (if custom styles are needed)
```

## 3. Component Development (`.tsx` files)

- **Functional Components**: All components should be written as React functional components using hooks.
- **No Inline Styles or Utility Classes**: Do not use the `style` attribute for inline styling or utility classes (e.g., from Tailwind CSS). Instead, use `className` to apply styles defined in the corresponding CSS file.

**DO:**
```jsx
// MyComponent.tsx
import './MyComponent.css';

const MyComponent = () => {
  return (
    <div className="my-component-container">
      <h1 className="title">Hello World</h1>
      <button className="submit-button">Submit</button>
    </div>
  );
};
```

**DON'T:**
```jsx
// MyComponent.tsx (Incorrect)
const MyComponent = () => {
  return (
    <div className="p-4 bg-gray-100">
      <h1 style={{ fontSize: '24px', color: 'blue' }}>Hello World</h1>
      <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded">Submit</button>
    </div>
  );
};
```

## 4. Styling (`.css` files)

- **Dedicated Stylesheet**: Every component or page must have its own `.css` file for its styles.
- **Import**: Import the CSS file at the top of the component's `.tsx` file.
  ```javascript
  import './MyComponent.css';
  ```
- **CSS Class Naming**: Use descriptive, semantic class names. A good convention is `component-name-element` or a similar BEM-like structure. This makes the CSS readable and avoids style conflicts.

**Example: `MyComponent.css`**
```css
.my-component-container {
  padding: 1rem;
  background-color: #f8f9fa;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #343a40;
}

.submit-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #2563eb;
}
```

## 5. Color Palette

To maintain visual consistency, the project uses a defined color palette. The primary color is **Sustainable Green**.

- **Primary**: `#2E8B57` (Used for main actions, buttons, and highlights)
- **Primary Dark**: `#256d45` (Used for hover states or darker shades)
- **Primary Light**: `#eafaf1` (Used for light backgrounds or subtle highlights)
- **Text**: `#343a40` (Primary text color)
- **Text Light**: `#6c757d` (Secondary text color)
- **Background**: `#f8f9fa` (Main background color)
- **White**: `#ffffff`

## 6. Global Styles

Global styles, such as font imports, CSS variables, and body styling, should be defined in a central file like `src/index.css` or `src/App.css`. Avoid adding component-specific styles to global files.

By adhering to these guidelines, we can build a more robust and developer-friendly application.
