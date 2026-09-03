# QA 紀錄規範 (Question & Answer Records)

本目錄用來記錄開發過程中的架構問題、需求澄清與設計決策，讓未來的開發者能理解：

> **當初為什麼會做出這個決定？**

QA 記錄的是**思辨過程**，不只是最後答案。

* **保留重要轉折。** 若某個方案一開始合理、後來被推翻，應留下「為什麼考慮它」以及「為什麼放棄它」。
* **允許錯誤與修正。** 誤解、反例、被指出的問題與後續修正，只要影響決策，就有保留價值。
* **不必逐字保存對話。** 可以濃縮、合併與刪除重複內容，但不能把重要轉折整理掉。
* `docs/history/` 主要記錄**發生了什麼、觀察到什麼**；`docs/QA/` 主要記錄**為什麼這樣想、為什麼這樣決定**。

判斷一段內容是否值得留下：

> 如果拿掉它，會不會讓這個決策看起來比實際上更順理成章？

如果會，就應該保留。

---

## 1. 檔案命名

```text
docs/QA/<yymmddhhmm>.md
```

* `<yymmddhhmm>`：建立 QA 的時間，預設UTC+8。
* 檔名只保留時間碼；主題改以檔尾 3～10 個 kebab-case hashtags 表示。

例如：

```text
docs/QA/2608301625.md
```

時間放在最前方，使檔案能自然依建立時間排序。

---

## 2. 建議格式

```markdown
# <yymmddhhmm>

- **status:** resolved  <!-- open | resolved | archived -->
- **topic:** <討論主題>

## 提問與回答

### Q1 ·（human: <name>）
<問題、想法或質疑>

### A1 ·（agent: <model_name>）
<回答、分析與方案>

### Q2 ·（human: <name>）
<後續問題或修正>

### A2 ·（agent: <model_name>）
<後續分析或修正>

## 結論
<目前達成的共識，以及仍未確定的部分>

#core #architecture #example
```

一組 Q/A 不必逐字對應一次真實對話，可以適度濃縮與合併；但重要的錯誤、反例、被否決方案與設計轉折不能因此消失。

---

## 3. 身分標註

**每個 Q/A 都應標註來源。**

* 人類：`（human: <name>）`
* Agent：`（agent: <model_name>）`

多人協作時，人類名稱優先使用本地 `git config user.name`。

Agent 應記錄實際模型名稱；若 reasoning level、模式或其他設定可能顯著影響回答品質，也應一併標註。

身分標註是 QA 的 provenance。未來重新檢視決策時，應能知道某段 reasoning 是由誰提出的。

---

## 4. Hashtags

每份 QA 結尾應加入 3～10 個 hashtags，作為該筆紀錄的主題標題並方便跨檔案搜尋。

例如：

```markdown
#core #architecture #port #graph
```

* 使用小寫英文與 kebab-case。
* 優先標記實際涉及的 subsystem / concept，例如 `#core`、`#runtime`、`#port`、`#hook`、`#graph`。
* QA 數量較少時，搜尋召回率優先於極度精簡：除了 subsystem，也標記關鍵實體、API、架構決策與相近名詞；寧可多找到相關 QA，也不要因缺少同義詞而找不到。
* 同一概念應有一個優先使用的 canonical tag；若有常見搜尋別名，可在不超過 10 個的前提下同時加入，例如 `#hook` 與 `#hooks`。
* Hashtag 用於搜尋，不必完整描述 QA；保留可辨識且具搜尋價值的數個標籤即可。

## 5. 避免過強的結論

Agent 容易使用比實際證據更強的語氣。整理 QA 時應保留原本的不確定性，不要把建議、偏好或暫時結論寫成必然規則。

例如：

```text
「目前較適合」≠「必須」

「尚未發現 standalone port 的需求」≠「port 必須屬於 device」

「這個設計較簡單」≠「這是正確的設計」
```

除非已由明確需求、invariant、證明或團隊決策支持，否則避免使用 `must`、`always`、`never`、`obviously`、`the correct design` 等過強措辭。

**QA 應記錄當時能支持多強的結論，就只寫到多強。**
