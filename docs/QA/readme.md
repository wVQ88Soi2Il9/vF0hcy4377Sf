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
docs/QA/<yymmddhhmm>_<topic>.md
```

* `<yymmddhhmm>`：建立 QA 的時間，預設UTC+8。
* `<topic>`：簡短英文主題，使用 kebab-case。

例如：

```text
docs/QA/2608301625_port-and-spatial-graph.md
```

時間放在最前方，使檔案能自然依建立時間排序。

---

## 2. 建議格式

```markdown
# <yymmddhhmm>_<topic>

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

每份 QA 結尾應加入少量 hashtags，方便跨檔案搜尋相關討論。

例如：

```markdown
#core #architecture #port #graph
```

* 使用小寫英文。
* 優先標記實際涉及的 subsystem / concept，例如 `#core`、`#runtime`、`#port`、`#hook`、`#graph`。
* 同一概念應盡量使用一致名稱，避免同時出現 `#hook`、`#hooks`、`#hook-system` 等同義標籤。
* Hashtag 用於搜尋，不必完整描述 QA；保留最有辨識力的數個標籤即可。