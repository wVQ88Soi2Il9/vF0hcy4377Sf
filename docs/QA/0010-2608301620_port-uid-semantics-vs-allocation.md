0010-2608301620_port-uid-semantics-vs-allocation

- **status:** resolved
- **topic:** `port_uid` 的語意契約與其發號實現方式應嚴格分離（不可混淆為同一件事）

## 提問與回答

### Q1 · 2026-08-30 16:16（human: wVQ88Soi2Il9）
在重構 `src/core_v3/definition_ii.ts` 的 `port` 型別時，`port.port_uid` 應該是 device 內部穩定、不隨 `get_port()` 陣列順序變動的標識。既然 `space` 已經用 `next_device_uid: uid` 這種計數器來為 `device` 發號，`port_uid` 是否也該在 `device` 抽象基類或 `port` 介面上比照辦理，內建一個類似 `next_port_uid` 的計數器？

### A1 · 2026-08-30 16:18（agent: claude-sonnet-5-mid）
不應該。這裡要拆開兩件事，它們層級不同：

1. **`uid` 的語意契約**：`uid` 只承諾「這是一個穩定、可用來辨識同一個東西的標識」，不論是 `device_uid` 還是 `port_uid`，這份契約本身不規定「怎麼保證它不重複」。
2. **`next_device_uid` 是一種實現方式**，不是 `uid` 概念的一部分。它是 `space` 這個具體容器選擇的其中一種發號手段（遞增計數器）；換一個容器，完全可以選擇別的方式（例如 UUID、hash、外部指派）达到同樣的「穩定不重複」契約。

若把 `next_device_uid` 這種計數器寫進 `device` 抽象基類或 `port` 介面，等於是把「型別的語意契約」跟「某一種特定的實現手段」焊死在一起——之後任何一個具體 `device` 子類別想用不同方式發 `port_uid`（例如語意化字串、或衍生自 shape 拓撲的固定值），都會被迫遷就這個焊死的計數器欄位，即使它們根本不需要。

**判準**：凡是型別定義層（`interface` / `abstract class`）該回答「這是什麼、承諾什麼」；凡是「怎麼保證這個承諾成立」永遠是具體實現者的自由，不該預先收斂成單一機制寫進契約。

## 結論

1. `port.port_uid: uid` 在 `definition_ii.ts` 中只表達契約：device 內部穩定、不隨 `get_port()` 陣列順序變動、非全局可定址 key。
2. **不在 `device` 抽象基類或 `port` 介面中加入任何形式的計數器或發號機制**（例如 `next_port_uid`）。這件事完全下放給每個具體 `device` 子類別自行決定怎麼保證穩定性。
3. `space.next_device_uid` 維持原樣，僅視為 `space` 自己選用的一種 `device_uid` 發號手段，不作為其他 uid（如 `port_uid`）該效仿的範本。
4. 一般性原則：往後任何「型別承諾什麼」與「怎麼實現這個承諾」出現混淆的地方，優先拆開處理，不把某個具體實現細節（如計數器）誤植回抽象契約層。