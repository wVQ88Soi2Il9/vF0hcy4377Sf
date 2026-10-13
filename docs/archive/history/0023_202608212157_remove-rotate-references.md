# 0023_202608212157_remove-rotate-references

- **status:** done
- **prev:** ./0022_202608210204_refactor-vanilla-overlap-streamline.md
- **skill:** plan-history v3

## 主題簡述

移除專案中所有與已廢棄的 
otate（旋轉）相關之指令分支、文件描述與 API 清單參照。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 ;。
- 遵循三層單向架構。
- 拒絕隱性補齊。

## 規劃描述

1. 於 src/packs/basic_ui/cmd_executor.ts 中移除 case 'rotate': 分支。
2. 於 README.md 中移除 project structure 的 
otate 註解及 CMD 指令表中的 
otate 行。
3. 於 docs/architecture.md 中移除 API 邊界表格的 
otate_device 與 on_device_rotate 行。

## 觀察與推論

### O1 · 2026-08-21 21:57:00+08:00 — 清理旋轉殘留程式碼與文檔
專案已轉向以 OOP device 多型體系替代舊有靜態 
otation 屬性，舊有的 
otate 指令與相關 API 文件描述已不再使用，應徹底清除以保持程式碼庫整潔一致。

## 待辦

### 1 移除 rotate 相關實作與文檔
- **state:** 完成
- **basis:** → O1

移除 cmd_executor.ts 中的 
otate 指令分支，並同步清理 README.md 與 docs/architecture.md 中的相關參照。

**沿革**

- H1 · 2026-08-21 21:57 決斷 —— 確立刪除所有與 rotate 相關之內容（使用者）
- H2 · 2026-08-21 21:58 落地 —— 移除 cmd_executor.ts 的 rotate 分支並同步更新 README.md 與 architecture.md → O1
