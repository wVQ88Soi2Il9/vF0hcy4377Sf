# layered_2d Pack

A generic pack designed for 2.5D layered factory simulation scenes ($\mathbb{Z} \times \mathbb{Z} \times \{0, 1, \dots, n\}$).

## Space Definition & Condition

### Vector Format Condition
All position and offset vectors in this pack **MUST** strictly follow the 3-element form:
- **`[x, y, z]`** (length = 3)

No implicit zero-padding is permitted.

### Coordinates Semantics
- **`x, y` (Horizontal Grid)**:
  - Device grid centers are located at even coordinates `(2i, 2j)`.
  - Edge ports are located on grid boundaries where exactly one horizontal axis has an odd coordinate.
- **`z` (Elevation Layer)**:
  - Discrete layer index $z \in \{0, 1, \dots, n\}$ where $n$ is a small integer (e.g. 0 = Ground, 1 = Elevated Level 1, 2 = Elevated Level 2).

## Core Capabilities

1. **Planar $D_4$ Dihedral Group Symmetries**:
   - 8-element symmetry group $D_4$ on the $xy$ horizontal plane (4 orthogonal rotations `0..3` $\times$ mirror flip `flipped: boolean`).
   - Group presentation: $\langle r, s \mid r^4 = 1, s^2 = 1, srs = r^{-1} \rangle$.
   - Preserves layer $z$ during horizontal transformations.

2. **Layered 2.5D Rendering**:
   - Layer stacking and depth perspective visualization.
   - Active focus layer switching and cross-layer alpha blending.

3. **Multi-layer Collision & Routing**:
   - Layered spatial hashing and fast overlap detection.
   - Intra-layer horizontal graph connections and cross-layer vertical transition ports.
