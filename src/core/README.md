# core

Contracts and pure algorithms. Core holds no business logic and no global runtime state.

This document states the contracts as mathematics. Code names are given in `monospace`. All documentation for core lives here; `*.ts` files in core carry no comments.

## 0. Notation

| symbol | meaning | code |
|---|---|---|
| $\mathcal{N}$ | namespaces (pack ids) | `string` |
| $\mathcal{I} = \mathcal{N} \times \mathrm{Id}$ | namespaced identifiers, written `ns:id` | `namespaced_id` |
| $U = \{0, \ldots, 9, \mathrm{a}, \ldots, \mathrm{f}\}^{16}$ | unique ids: 16-digit hex strings (64 random bits) | `uid` |
| $\mathbb{Z}^d$ | $d$-dimensional vectors | `vector` |
| $S$ | space states | `space` |
| $W$ | worlds (runtime state; defined in `src/world.ts`) | `pure_world` |
| $A = \mathrm{Arg}^{*}$ | finite argument lists | `...args` |
| $X \rightharpoonup Y$ | partial function (undefined input → throw) | |

## 1. Space and its contents

### 1.1 Space `space`

$$s = (d,\ \mathrm{size},\ \mathrm{devices}),\qquad \mathrm{size} \in \mathbb{Z}^d,\quad \mathrm{devices} : U \rightharpoonup \mathrm{Device}$$

`devices` is a finite partial map, so every uid appears at most once in a space.

Device uids and history-node uids are drawn by `generate_uid` uniformly from $U$, with $|U| = 2^{64}$. A `port_uid` is also a string, but it is chosen by the device class and is only unique within its device. Uniqueness is not assumed from randomness: a collision is caught where the uid is inserted (`create_device` and `record_operation` throw).

### 1.2 Devices `device`

A device $D$ carries:

- an anchor $\mathrm{position}(D) \in \mathbb{Z}^d$, in global coordinates;
- a shape $\mathrm{shape}(D) \subset \mathbb{Z}^d$ (`get_shape`), in **local** coordinates relative to the anchor;
- ports $\mathrm{ports}(D)$ (`get_port`), also local. Each port is $(\mathrm{port\_uid},\ \mathrm{offset},\ \mathrm{direction})$. `port_uid` is unique only within its device, and $\mathrm{direction} \in \{\text{input}, \text{output}, \text{bidirectional}\}$.

A device class $\mathrm{Class}$ is a `device_constructor` $(\mathrm{uid}, \mathrm{definition\_id}, \mathrm{position}) \mapsto D$.

### 1.3 Items and recipes

- An item stack (`item_stack`) is $(\mathrm{item\_id}, q) \in \mathcal{I} \times \mathbb{N}$.
- A recipe (`recipe`) describes **outputs only**:
  $$\mathrm{evaluate} : U \to (\mathrm{port\_uid} \times \mathrm{item\_stack})^{*} \ \sqcup\ \mathrm{Error}$$
  Inputs are part of the context, meaning what the device currently receives. A recipe does not declare or compute them, even when the device has to hold an input stock.

## 2. Operations: `rev_op`

An operation is a pair of partial functions on space states:
$$o = (e_o,\ i_o),\qquad e_o,\ i_o : S \rightharpoonup S,\qquad i_o \circ e_o = \mathrm{id}_{\mathrm{dom}(e_o)}$$

- $e_o$ is `execute(sp)` and $i_o$ is `inverse(sp)`.
- **No argument appears.** An operation is *closed*: every parameter is already bound. This is what lets history replay it.
- An operation is one concrete action. It lives in exactly one history node.

Let $\mathrm{Op}$ be the set of all operations.

## 3. Templates: `op_template`

$\mathrm{Op}$ cannot be listed. For example, `create_device` alone yields one operation for every uid $\times$ device class $\times$ position:
$$|\mathrm{Op}| \ \ge\ |U \times \mathrm{Class} \times \mathbb{Z}^d| = \infty$$

So the registry does not store operations. It stores **templates**, and arguments *induce* an operation:
$$\tau : W \times A \rightharpoonup \mathrm{Op},\qquad o = \tau(w, a)$$

This is currying. A template is an action $E : S \times A \rightharpoonup S$ that has not received its arguments yet. Supplying $a$ binds it and yields a closed $e_a : S \rightharpoonup S$, which has the type history needs:
$$e_{\tau(w,a)}(s) = E(s, a)$$

The arguments are stored inside $o$, which is why `undo` and `redo` need no arguments.

Each call produces a fresh operation, $\tau(w, a_1) \ne \tau(w, a_2)$, even for $a_1 = a_2$. Reusing one operation twice is not allowed. For example, `create_device` requires $\mathrm{uid} \notin \mathrm{dom}(s.\mathrm{devices})$, so a second $e_o$ is undefined.

| | role | where it lives | code |
|---|---|---|---|
| $\tau$ | template | registry, shared by all worlds | `op_template.create(world, ...args)` |
| $o$ | action | one history node of one world | `rev_op` |

## 4. Commands: `cmd`

A command is a procedure that does not enter history:
$$c : X \times A \rightharpoonup R,\qquad c(x, a) = \texttt{execute}(x, \ldots a)$$

$X$ is the caller's context. A command is **not limited to a world**: $X$ may be a world $W$, and later it may also be UI state or another runtime object. A command may change $x$ as a side effect, for example a UI change. That change is outside $S$, has no inverse, and is not recorded.

Commands and templates are both things the CLI can call by name. They differ in two ways:

| | acts on | reversible | result |
|---|---|---|---|
| template $\tau$ | $S$ only, through history | yes | an operation, submitted to history (§6) |
| command $c$ | any context $X$ | no | a value $r \in R$ |

## 5. Registry and catalog

### 5.1 Pack declaration `pack_manifest`

A pack $p$ hands compose:

- `provides`: a module $M_p = (\mathrm{items}_p,\ \mathrm{recipes}_p,\ \mathrm{devices}_p,\ \mathrm{op\_templates}_p,\ \mathrm{commands}_p)$, where each component is a finite map from names to definitions;
- `on`: $\mathcal{I} \to \mathrm{Callback}$, keyed by `'namespace:id'`; each handler receives the world as an argument;
- `create_state`: produces this pack's private state when a world is created;
- `patch`: modifies the catalog during compose, before it is frozen.

**Name constraint.** Within one pack, commands and templates share one name space:
$$\mathrm{dom}(\mathrm{commands}_p) \cap \mathrm{dom}(\mathrm{op\_templates}_p) = \varnothing$$
`compose` throws if this fails.

### 5.2 Compose `compose`

Given ordered manifests $p_1, \ldots, p_n$:
$$\mathrm{catalog} = \mathrm{patch}_{p_n} \circ \cdots \circ \mathrm{patch}_{p_1}\big(\textstyle\bigsqcup_k M_{p_k},\ \mathrm{handlers}\big)$$

Handlers for one event run in manifest order. After compose, the catalog is treated as immutable and shared by every world. A `pack_module` (registry entry) is $M_p$ together with its `pack_id`.

### 5.3 `other_info`

`other_info` is namespaced: $\mathrm{other\_info} : \mathcal{N} \rightharpoonup \mathrm{Record}$. A module reads and writes only its own key. For example, the description of a command or template is `other_info.cli.description`.

## 6. History: words in a free group

### 6.1 The group

Operations alone do not form a group. Each $e_o$ is partial, so two operations cannot always be composed, and there is no identity element inside $\mathrm{Op}$. The group lives one level up.

Let $F = F(\mathrm{Op})$ be the **free group** generated by the operations. Its elements are reduced words
$$g = o_1^{\varepsilon_1} o_2^{\varepsilon_2} \cdots o_n^{\varepsilon_n},\qquad \varepsilon_j \in \{+1, -1\},\quad \text{no two adjacent letters of the form } o\,o^{-1}$$

$F$ acts on space states from the right, reading the word left to right:
$$s \cdot o = e_o(s),\qquad s \cdot o^{-1} = i_o(s),\qquad s \cdot (gh) = (s \cdot g) \cdot h$$

The law $i_o \circ e_o = \mathrm{id}$ says exactly that $s \cdot (o\,o^{-1}) = s$, which is the group relation $o\,o^{-1} = 1$. The action is **partial**: $s \cdot g$ may be undefined, and in code that case throws.

### 6.2 The tree is a set of words

A history is
$$T = (V,\ \mathrm{parent},\ \mathrm{ops},\ c),\qquad \mathrm{ops} : V \to \mathrm{Op}^{*},\quad c \in V$$

Here $r \in V$ is the root (`root_history_uid`), which has no operations, and $c$ is the current node (`current_history_uid`). Every node uid, the root's included, comes from `generate_uid`; uids carry no order.

Each node $v$ with root path $r = v_0, v_1, \ldots, v_m = v$ names a word:
$$w_v = \mathrm{ops}(v_1)\,\mathrm{ops}(v_2) \cdots \mathrm{ops}(v_m) \in F,\qquad w_r = 1$$

Every operation occurs in exactly one node (§3), so $w_v$ uses only positive letters that are all distinct. That makes $w_v$ reduced, and the map $v \mapsto w_v$ injective. The tree is therefore a finite, prefix-closed set of words: a subtree of the Cayley graph of $F$, where the operations of one node are drawn as one edge.

**Invariant.**
$$s = s_0 \cdot w_c$$

### 6.3 Every move is a group element

Moving the cursor from $u$ to $v$ acts by
$$s \ \leftarrow\ s \cdot \big(w_u^{-1} w_v\big)$$

Free reduction computes the path. Write $w_u = p\,x$ and $w_v = p\,y$, where $p$ is the longest common prefix. Then $p = w_\ell$ with $\ell = \mathrm{lca}(u, v)$, and
$$w_u^{-1} w_v = x^{-1} p^{-1} p\, y = x^{-1} y$$

- $x^{-1}$: from $u$ up to $\ell$, each operation's `inverse`, last one first (upward time flow).
- $y$: from $\ell$ down to $v$, each operation's `execute`, in order (downward time flow).

The `change_set` emitted with `core:committed` (`applied_op[]` in `src/world.ts`) is this reduced word written as a list. Each entry's `direction` is the exponent: `execute` is $+1$ and `inverse` is $-1$.

| move | target $v$ | element $w_u^{-1} w_v$ |
|---|---|---|
| `jump_prev_node` (undo) | $\mathrm{parent}(c)$ | $\mathrm{ops}(c)^{-1}$ |
| `jump_next_node` (redo) | a child $v$ of $c$ | $\mathrm{ops}(v)$ |
| `jump_to_root` | $r$ | $w_c^{-1}$ |
| `jump_to_prev_fork` | $\mathrm{prev\_fork}(c)$ | $x^{-1}$ only |
| `jump_to_next_fork` | $\mathrm{next\_fork}(c)$ | $y$ only |
| `jump_to_node` | any $v$ | $x^{-1} y$ |

The upward and downward moves mirror each other. Forks are defined as:

- $\mathrm{prev\_fork}(v)$ (`find_prev_fork_node`): starting from $\mathrm{parent}(v)$ and going up, the first node with more than one child, or the root. If $v$ is the root, it is $v$.
- $\mathrm{next\_fork}(v)$ (`find_next_fork_node`): starting from $v$ and following the unique child down, the first node whose child count is not $1$ (a fork or a leaf). If $v$ is already a fork or a leaf, it is $v$.

When `jump_next_node` is given a child, that node must be a child of $c$. When it is not given one, $c$ must have exactly one child.

### 6.4 Return conventions

- `jump_*` returns a boolean: `true` means $c$ actually changed, `false` means it did not move.
- Natural boundaries return `false` instead of throwing: undo at the root, redo at a fork with no child given, and a target that is not a child.
- A node that does not exist throws (for example in `find_lca`, `delete_node`, `find_*_fork_node`).

### 6.5 Changing the tree

- **Record** (`record_operation`): given new operations $g = o_1 \cdots o_k$, act by $s \leftarrow s \cdot g$ and add a node $v$ under $c$ with $w_v = w_c\, g$, then set $c \leftarrow v$. The letters of $g$ are new generators, so $w_v$ differs from every existing word. Undoing and then recording therefore creates a **new branch** and never overwrites an old one.
- **Delete** (`delete_node`): removes only a leaf $v$ with $v \ne c$ and $v \ne r$ from the set of words, so causal history stays continuous. The current word $w_c$ is unchanged, so $s$ is unchanged. Violating these limits returns `false`.

## 7. Hooks

`hook_list` is a map $\mathcal{N} \to (\mathrm{Id} \to \mathrm{Callback}^{*})$. Callbacks receive the world as an argument and never close over one, so events from world $w_1$ do not reach world $w_2$.

## Open

- The type of $W$ in `op_template.create` is `any`, because core cannot import `src/world.ts` (docket 20261015182143).
- The type of the command context $X$, and how the CLI obtains a context that is not a world, such as UI (docket 20261015183354).
- The error-message format of `recipe.evaluate`, and how context / device_uid are evaluated.
