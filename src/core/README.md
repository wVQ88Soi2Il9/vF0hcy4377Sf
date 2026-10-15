# core

契約與純演算法。core 不含業務邏輯，也不持有全域執行期狀態。

本文以數學語言描述這些契約，括號或 `等寬字` 標示對應的程式名稱。core 的說明統一放在這裡，`*.ts` 內不寫註解。

## 0. 記號

| 記號 | 意義 | 程式 |
|---|---|---|
| $\mathcal{N}$ | 命名空間（pack id） | `string` |
| $\mathcal{I} = \mathcal{N} \times \mathrm{Id}$ | 命名空間識別碼，寫作 `ns:id` | `namespaced_id` |
| $U = \mathbb{N}$ | 唯一識別碼 | `uid` |
| $\mathbb{Z}^d$ | $d$ 維向量 | `vector` |
| $S$ | 空間狀態 | `space` |
| $W$ | 世界（執行期狀態，定義在 `src/world.ts`） | `pure_world` |
| $A = \mathrm{Arg}^{*}$ | 有限長的參數列 | `...args` |
| $X \rightharpoonup Y$ | 部分函數（輸入不在定義域時 throw） | |

## 1. 空間與其中的物件

### 1.1 空間 `space`

$$s = (d,\ \mathrm{size},\ \mathrm{devices}),\qquad \mathrm{size} \in \mathbb{Z}^d,\quad \mathrm{devices} : U \rightharpoonup \mathrm{Device}$$

`devices` 是有限的部分映射，所以同一個 uid 在一個空間內至多出現一次。

### 1.2 裝置 `device`

裝置 $D$ 帶有：

- 錨點 $\mathrm{position}(D) \in \mathbb{Z}^d$（全域座標）；
- 形狀 $\mathrm{shape}(D) \subset \mathbb{Z}^d$（`get_shape`，**局部座標**，相對於錨點）；
- 連接埠 $\mathrm{ports}(D)$（`get_port`，局部）。每個 port 為 $(\mathrm{port\_uid},\ \mathrm{offset},\ \mathrm{direction})$，其中 `port_uid` 只在該裝置內唯一，$\mathrm{direction} \in \{\text{input}, \text{output}, \text{bidirectional}\}$。

裝置類別 $\mathrm{Class}$ 以 `device_constructor` 表示：$(\mathrm{uid}, \mathrm{definition\_id}, \mathrm{position}) \mapsto D$。

### 1.3 物品與配方

- 物品堆疊 `item_stack`：$(\mathrm{item\_id}, q) \in \mathcal{I} \times \mathbb{N}$。
- 配方 `recipe` 只描述**輸出**：
  $$\mathrm{evaluate} : U \to (\mathrm{port\_uid} \times \mathrm{item\_stack})^{*} \ \sqcup\ \mathrm{Error}$$
  輸入屬於 context，也就是裝置目前收到了什麼，不由配方宣告或計算。即使裝置必須持有輸入庫存，也是如此。

## 2. 操作 `rev_op`

一個操作是空間狀態上的一對部分函數：
$$o = (e_o,\ i_o),\qquad e_o,\ i_o : S \rightharpoonup S,\qquad i_o \circ e_o = \mathrm{id}_{\mathrm{dom}(e_o)}$$

- $e_o$ 是 `execute(sp)`，$i_o$ 是 `inverse(sp)`。
- **式中沒有參數。** 操作是**封閉的**：所有參數都已綁定，所以歷史能直接重播它。
- 一個操作是一次實際的動作，只存在於一個歷史節點中。

以 $\mathrm{Op}$ 表示所有操作的集合。

## 3. 操作模板 `op_template`

$\mathrm{Op}$ 無法列舉。光是 `create_device` 一種，每個 uid × 裝置類別 × 位置的組合就各是一個操作：
$$|\mathrm{Op}| \ \ge\ |U \times \mathrm{Class} \times \mathbb{Z}^d| = \infty$$

因此 registry 不存操作，而是存**模板**，由參數**誘導**出操作：
$$\tau : W \times A \rightharpoonup \mathrm{Op},\qquad o = \tau(w, a)$$

這就是 currying。模板是一個尚未收到參數的動作 $E : S \times A \rightharpoonup S$。給定 $a$ 之後，參數被綁定，得到封閉的 $e_a : S \rightharpoonup S$，正好是歷史所需的型別：
$$e_{\tau(w,a)}(s) = E(s, a)$$

參數存在 $o$ 裡，所以 `undo` 與 `redo` 不需要參數。

每次呼叫都產生一個新的操作；即使 $a_1 = a_2$，也有 $\tau(w, a_1) \ne \tau(w, a_2)$。同一個操作不可重複使用。例如 `create_device` 要求 $\mathrm{uid} \notin \mathrm{dom}(s.\mathrm{devices})$，所以同一個 $e_o$ 第二次執行時沒有定義。

| | 角色 | 存放位置 | 程式 |
|---|---|---|---|
| $\tau$ | 模板 | registry，所有世界共用 | `op_template.create(world, ...args)` |
| $o$ | 動作 | 某個世界的某一個歷史節點 | `rev_op` |

## 4. 指令 `cmd`

指令是不進歷史的程序：
$$c : X \times A \rightharpoonup R,\qquad c(x, a) = \texttt{execute}(x, \ldots a)$$

$X$ 是呼叫端的 context。指令**不限於 world**：$X$ 可以是世界 $W$，未來也可能是 UI 狀態或其他執行期物件。指令可以把改變 $x$ 當作副作用，例如變更 UI。這種改變在 $S$ 之外，沒有逆操作，也不被記錄。

指令與模板都能被 CLI 以名稱呼叫，差別如下：

| | 作用對象 | 可逆 | 結果 |
|---|---|---|---|
| 模板 $\tau$ | 只有 $S$，經過歷史 | 是 | 一個操作，submit 進歷史（§6） |
| 指令 $c$ | 任意 context $X$ | 否 | 一個值 $r \in R$ |

## 5. Registry 與 catalog

### 5.1 Pack 宣告 `pack_manifest`

pack $p$ 交給 compose 的宣告包含：

- `provides`：模組 $M_p = (\mathrm{items}_p,\ \mathrm{recipes}_p,\ \mathrm{devices}_p,\ \mathrm{op\_templates}_p,\ \mathrm{commands}_p)$，每一項都是從名稱到定義的有限映射；
- `on`：$\mathcal{I} \to \mathrm{Callback}$，以 `'namespace:id'` 為鍵，handler 透過參數取得 world；
- `create_state`：每個世界建立時，產生這個 pack 的私有狀態；
- `patch`：在組裝期間修改尚未凍結的 catalog。

**同名約束**：同一個 pack 內，指令與模板共用一個名稱空間：
$$\mathrm{dom}(\mathrm{commands}_p) \cap \mathrm{dom}(\mathrm{op\_templates}_p) = \varnothing$$
違反時 `compose` throw。

### 5.2 組裝 `compose`

給定依序排列的 manifests $p_1, \ldots, p_n$：
$$\mathrm{catalog} = \mathrm{patch}_{p_n} \circ \cdots \circ \mathrm{patch}_{p_1}\big(\textstyle\bigsqcup_k M_{p_k},\ \mathrm{handlers}\big)$$

同一事件的 handlers 依 manifest 順序執行。組裝完成後，catalog 視為不可變，所有世界共用。`pack_module`（registry 條目）就是 $M_p$ 加上 `pack_id`。

### 5.3 `other_info`

`other_info` 依命名空間分層：$\mathrm{other\_info} : \mathcal{N} \rightharpoonup \mathrm{Record}$。每個模組只讀寫自己的鍵，例如指令與模板的說明文字放在 `other_info.cli.description`。

## 6. 歷史：自由群中的字

### 6.1 群

操作本身不構成群。每個 $e_o$ 都是部分函數，所以兩個操作不一定能組合，$\mathrm{Op}$ 內也沒有單位元。群在上一層。

令 $F = F(\mathrm{Op})$ 為由操作生成的**自由群**。它的元素是 reduced word：
$$g = o_1^{\varepsilon_1} o_2^{\varepsilon_2} \cdots o_n^{\varepsilon_n},\qquad \varepsilon_j \in \{+1, -1\},\quad \text{相鄰兩字母不形如 } o\,o^{-1}$$

$F$ 從右邊作用在空間狀態上，字由左往右讀：
$$s \cdot o = e_o(s),\qquad s \cdot o^{-1} = i_o(s),\qquad s \cdot (gh) = (s \cdot g) \cdot h$$

$i_o \circ e_o = \mathrm{id}$ 這條規則說的正是 $s \cdot (o\,o^{-1}) = s$，也就是群關係 $o\,o^{-1} = 1$。這個作用是**部分的**：$s \cdot g$ 可能沒有定義，在程式中就是 throw。

### 6.2 樹是一組字

歷史為
$$T = (V,\ \mathrm{parent},\ \mathrm{ops},\ c),\qquad \mathrm{ops} : V \to \mathrm{Op}^{*},\quad c \in V$$

其中 $0 \in V$ 是根，沒有任何操作；$c$ 是目前節點（`current_history_uid`）。節點 uid 從 $1$ 起依序配發（`next_history_uid`）。

節點 $v$ 的根路徑為 $0 = v_0, v_1, \ldots, v_m = v$，它對應一個字：
$$w_v = \mathrm{ops}(v_1)\,\mathrm{ops}(v_2) \cdots \mathrm{ops}(v_m) \in F,\qquad w_0 = 1$$

每個操作只出現在一個節點中（§3），所以 $w_v$ 只含互不相同的正字母，必定是 reduced，而且 $v \mapsto w_v$ 是單射。因此整棵樹是一組有限、前綴封閉的字，也就是 $F$ 的 Cayley graph 的一棵子樹（一個節點的所有操作畫成一條邊）。

**不變式**
$$s = s_0 \cdot w_c$$

### 6.3 每次移動都是一個群元素

游標從 $u$ 移到 $v$，作用為
$$s \ \leftarrow\ s \cdot \big(w_u^{-1} w_v\big)$$

路徑由 free reduction 算出。寫 $w_u = p\,x$、$w_v = p\,y$，其中 $p$ 是最長公共前綴，則 $p = w_\ell$，$\ell = \mathrm{lca}(u, v)$，而且
$$w_u^{-1} w_v = x^{-1} p^{-1} p\, y = x^{-1} y$$

- $x^{-1}$：從 $u$ 往上走到 $\ell$，依序執行每個操作的 `inverse`，最後一個先做（向上時間流）。
- $y$：從 $\ell$ 往下走到 $v$，依序執行每個操作的 `execute`（向下時間流）。

`src/world.ts` 隨 `core:committed` 發出的 `change_set`（`applied_op[]`）就是把這個 reduced word 寫成串列，每一項的 `direction` 就是指數：`execute` 為 $+1$，`inverse` 為 $-1$。

| 移動 | 目標 $v$ | 群元素 $w_u^{-1} w_v$ |
|---|---|---|
| `jump_prev_node`（undo） | $\mathrm{parent}(c)$ | $\mathrm{ops}(c)^{-1}$ |
| `jump_next_node`（redo） | $c$ 的子節點 $v$ | $\mathrm{ops}(v)$ |
| `jump_to_root` | $0$ | $w_c^{-1}$ |
| `jump_to_prev_fork` | $\mathrm{prev\_fork}(c)$ | 只有 $x^{-1}$ |
| `jump_to_next_fork` | $\mathrm{next\_fork}(c)$ | 只有 $y$ |
| `jump_to_node` | 任意 $v$ | $x^{-1} y$ |

上下兩個方向互為鏡像。分岔點的定義：

- $\mathrm{prev\_fork}(v)$（`find_prev_fork_node`）：從 $\mathrm{parent}(v)$ 往上，第一個子節點數 $> 1$ 的節點，或遇到的根。若 $v$ 本身是根，則為 $v$。
- $\mathrm{next\_fork}(v)$（`find_next_fork_node`）：從 $v$ 沿唯一的子節點往下，直到子節點數 $\ne 1$ 的節點（分岔點或葉）。若 $v$ 本身就是分岔點或葉，則為 $v$。

`jump_next_node` 指定子節點時，該節點必須是 $c$ 的子節點；未指定時，$c$ 必須恰有一個子節點。

### 6.4 回傳約定

- `jump_*` 回傳布林值：`true` 表示 $c$ 確實改變，`false` 表示沒有移動。
- 自然邊界回傳 `false`，不 throw：在根上 undo、在分岔處未指定子節點就 redo、指定的目標不是子節點。
- 節點不存在時 throw（例如 `find_lca`、`delete_node`、`find_*_fork_node`）。

### 6.5 改變樹

- **記錄**（`record_operation`）：給定新操作 $g = o_1 \cdots o_k$，作用 $s \leftarrow s \cdot g$，在 $c$ 底下加入節點 $v$，令 $w_v = w_c\, g$，再設 $c \leftarrow v$。$g$ 的字母都是新的生成元，所以 $w_v$ 與既有的字都不同。undo 之後再記錄，必定長出**新分支**，不會覆寫舊的。
- **刪除**（`delete_node`）：只能從字集中移除一個葉節點 $v$，且 $v \ne c$、$v \ne 0$，以免破壞因果歷史的連續性。$w_c$ 不變，所以 $s$ 不變。違反限制時回傳 `false`。

## 7. Hooks

`hook_list` 是映射 $\mathcal{N} \to (\mathrm{Id} \to \mathrm{Callback}^{*})$。callback 透過參數取得 world，從不閉包住某一個 world，所以世界 $w_1$ 的事件不會影響世界 $w_2$。

## 未決

- `op_template.create` 中 $W$ 的型別目前為 `any`，因為 core 不能 import `src/world.ts`（docket 20261015182143）。
- 模板建立裝置時，uid 由誰配發（docket 20261015182144）。
- 指令 context $X$ 的型別，以及 CLI 如何取得非 world 的 context，例如 UI（docket 20261015183354）。
- `recipe.evaluate` 的錯誤訊息格式，以及 context / device_uid 的求值機制。
