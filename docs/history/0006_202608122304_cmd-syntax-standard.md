# 0006_202608122304_cmd-syntax-standard

- **status:** done
- **prev:** 0005_202608122204_n-dim-expansion.md
- **skill:** plan-history v3

## 主題簡述

Pack 跨模組依賴檢查、3D 維度統一與 CMD 指令語法規範化。

## 觀察與推論

### O1 · 2026-08-12 23:04:00+08:00 — CMD 語法雙引號 Flag 統一
CMD 指令統一為 `create --"<def_id>" --"<position>"`、`move --"<uid>" --"<pos>"` 雙引號 Flag 格式。

## 待辦

### 1 Pack 依賴檢查與 CMD 雙引號 Flag 語法統一
- **state:** 完成
- **basis:** → O1

確認全專案 Packs 單向依賴，統一 CMD 指令為 `create --"<def_id>" --"<position>"`、`move --"<uid>" --"<pos>"`、`delete --"<uid>"` 格式，更新 README.md。

**沿革**
- H1 · 2026-08-12 23:04 落地 —— 完成 CMD 指令語法規範化 → O1
