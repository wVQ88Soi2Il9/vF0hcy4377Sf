# Agent Rules for vF0hcy4377Sf

### 1. Code Style & Formatting
- **Brace Style**: Allman style braces (newline before opening braces `{` for functions, interfaces, classes, loops, switches, etc.).
  ```typescript
  function my_function()
  {
      // ...
  }
  ```
- **Naming Convention**: All lowercase `snake_case` (`a_b_c`) for EVERYTHING, including:
  - File names (`my_file.ts`)
  - Type / Interface names (`vec3`, `game_map`, `device`, `recipe`)
  - Function names (`get_world_cells()`, `place_device()`)
  - Variables and property names (`start_point`, `input_ports`, `other_info`)

### 2. Architecture Guidelines
- **Core (`src/core/`)**: Pure TypeScript, zero dependencies, no Vue/DOM imports.
- **Renderer (`src/renderer/`)**: Canvas 2D / WebGL rendering layer.
- **UI (`src/ui/`)**: Vue 3 is ONLY used for overlay UI components.
