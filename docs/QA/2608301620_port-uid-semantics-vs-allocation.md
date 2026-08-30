# 2608301620_port-uid-semantics-vs-allocation

- **status:** open
- **topic:** `port_uid` 的語意契約與其發號實現方式應嚴格分離（不可混淆為同一件事）
- **tags:** #core #port #uid

## 提問與回答

### Q1 · 2026-08-30 16:16（agent: claude-sonnet-5-mid）
在重構 `src/core_v3/definition_ii.ts` 的 `port` 型別時，發現一個遺漏：`space` 已經用 `next_device_uid: uid` 這種計數器為 `device` 發號，但 `port.port_uid` 呢？介面裡只有結果（`port_uid: uid`），沒有說這個數字從哪來、誰保證它不重複、不隨 `get_port()` 陣列重排而改變。`device` 抽象基類是否也該比照辦理，內建一個類似 `next_port_uid` 的計數器？

### A1 · 2026-08-30 16:18（human: wVQ88Soi2Il9）
使用 `next_device_uid` 單純是為了避免重複，不要把 `uid` 的本質跟實現方法搞混。

1. **`uid` 的語意契約**：只承諾「這是一個穩定、可用來辨識同一個東西的標識」，不論是 `device_uid` 還是 `port_uid`，這份契約本身不規定「怎麼保證它不重複」。
2. **`next_device_uid` 是一種實現方式**，不是 `uid` 概念的一部分。它是 `space` 這個具體容器選擇的其中一種發號手段（遞增計數器）；換一個容器，完全可以選擇別的方式（例如 UUID、hash、外部指派）達到同樣的「穩定不重複」契約。

**判準**：型別定義層（`interface` / `abstract class`）該回答「這是什麼、承諾什麼」；「怎麼保證這個承諾成立」永遠是具體實現者的自由，不該預先收斂成單一機制寫進契約。

## 結論

1. `port.port_uid: uid` 在 `definition_ii.ts` 中只表達契約：device 內部穩定、不隨 `get_port()` 陣列順序變動、非全局可定址 key。
2. **目前不在 `device` 抽象基類或 `port` 介面中加入任何形式的計數器或發號機制**（例如 `next_port_uid`）。這件事完全下放給每個具體 `device` 子類別自行決定怎麼保證穩定性。
3. `space.next_device_uid` 維持原樣，僅視為 `space` 自己選用的一種 `device_uid` 發號手段，不作為其他 uid（如 `port_uid`）該效仿的範本。