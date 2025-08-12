Design Tokens & Theming
=======================

Source of truth: tokens.css (imported once globally).

Categories
- Brand / Primary: --color-primary (+ hover/active/soft/ring)
- Semantic: --color-success / warn / error / info / maintenance / blocked / inactive
- Utilization: --util-low-* / --util-med-* / --util-high-* (bg, border, text)
- Neutrals: surface, surface-alt, bg, border, border-strong, text, text-soft, text-subtle
- Spacing / Radius / Shadows: prefixed with --space-, --radius-, --shadow-

Usage Guidelines
1. Prefer CSS variables over hex codes everywhere outside tokens.css.
2. For utilization badges, use the chip utility classes (utilities.css) or the utilizationColors() helper for inline React styles.
3. Focus states: apply .focus-ring or use box-shadow: var(--color-primary-ring).
4. Avoid duplicating button/chip styles; use .btn-primary-token / .btn-outline-token / .chip-*.
5. Gradients: anchor at least one stop to a token (e.g., var(--color-primary)) for brand cohesion.

Adding New Tokens
1. Add to tokens.css with a clear comment.
2. If semantic, ensure accessible contrast (AAA if possible for text on white, else AA minimum).
3. Update this README if it's a new category.

Lint / Enforcement (Planned)
- Add stylelint rule to forbid raw hex except in tokens.css.
- Add a CI grep check: fail build if /src contains /#[0-9a-fA-F]{3,6}/ excluding token files.

React Helpers
- utilizationLevel(pct) -> 'low' | 'med' | 'high'
- utilizationColors(level) -> { bg, border, text } (CSS variable references)

Migration Pattern
Old: background: #2E8B57;
New: background: var(--color-primary);

Questions / Extensions
Consider adding dark mode by scoping an alternate :root.dark block overriding a subset of neutrals & brand ramps.
