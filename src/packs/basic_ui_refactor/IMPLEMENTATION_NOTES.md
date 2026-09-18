# basic_ui refactor — phase 1

Implemented files:

- \src/packs/basic_ui/layout.ts  - generic nested horizontal/vertical layouts
  - arbitrary item count
  - fixed or weighted flexible sizing
  - per-item min/max constraints
  - layout-owned resize math
  - splitter visibility control
- \src/packs/basic_ui/splitter.ts  - pointer-drag input only
  - reports drag delta; no direct pane sizing
- \src/packs/basic_ui/panel.ts  - generic panel creation
  - removed panel-local resize handles and positioning concerns
  - exposes \create_panel\; keeps \create_floating_panel\ alias for current callers
- \src/packs/basic_ui/style.css  - generic nested layout styles
  - removed edge resize-handle styles
- \src/packs/shirones_ui/layout.ts  - application layout expressed as nested basic_ui layouts
  - left history / center / right info root layout
  - viewport / CLI nested center layout
  - collapse/expand restores the previous expanded size
- \src/packs/shirones_ui/layout.css  - application-only wrapper styling; generic layout styling moved to basic_ui

Validation:

- \asic_ui/layout.ts\, \panel.ts\, \splitter.ts\ pass TypeScript type checking.
- \shirones_ui/layout.ts\ passes TypeScript type checking against the new basic_ui API with minimal component stubs.

GitHub write status:

The connected GitHub integration can read the repository, but branch creation returned GitHub API 403 \Resource not accessible by integration\, so these changes were not pushed.
