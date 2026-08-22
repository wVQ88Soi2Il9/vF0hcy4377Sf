# 0032_202608222202_layered-2d-rotate-flip-api-and-ui

- **status:** done
- **prev:** ./0031_202608222126_add-pipeline-device.md
- **skill:** plan-history v3

## 主題簡述

由 layered_2d Pack 提供旋轉（Rotate）與翻轉（Flip）相關的 API 與 Command，並透過 asic_ui 擴充機制（
egister_device_action / 
egister_device_inspector）在裝置卡片面板（Device Card）中呈現旋轉與鏡像互動按鈕與狀態。

**本計畫的約束**

- 嚴格遵循 Allman 大括號風格、全小寫 snake_case 命名與結尾分號 ;。
- 遵循三層單向架構，layered_2d 透過 $basic_ui/ 擴充目錄主動向 asic_ui 註冊動作，保持單向依賴。
- 拒絕隱性補齊。

## 規劃描述

1. **API / Command 提供**：
   - 於 layered_2d 提供旋轉與翻轉裝置之函式與 Command（支援 Undo/Redo 歷史紀錄）。
2. **UI 整合（/）**：
   - 於 src/packs/layered_2d//device_transform_inspector.ts 向 asic_ui 註冊 Rotate (+90°)、Rotate (-90°)、Flip X 動作按鈕，並於 Device Card 顯示當前 	ransform 旋轉角度與翻轉狀態。
3. **驗證與測試**：
   - 執行 
pm run build 確認型別與編譯正常。

## 觀察與推論

### O1 · 2026-08-22 22:02:23+08:00 — layered_2d 旋轉與鏡像 API / UI 需求
使用者指示 layered_2d 提供 rotate / flip 的 API 並放入 basic_ui 面板中，讓具備 rotatable 特性的 2.5D 裝置可直接透過 UI 進行旋轉與鏡像互動。

## 待辦

### 1 提供 rotate/flip API 並註冊至 basic_ui
- **state:** 完成
- **basis:** → O1

於 layered_2d 導出 rotate/flip 操作函式與 Command，並透過 src/packs/layered_2d// 自動向 asic_ui 註冊裝置卡片操作按鈕（Rotate / Flip）與 Transform 狀態檢查器。

**沿革**

- H1 · 2026-08-22 22:02 決斷 —— 開立計畫將 layered_2d rotate/flip 提供 API 並整合至 basic_ui（使用者）
- H2 · 2026-08-22 22:04 落地 —— 實作 commands.ts (rotate/flip/set_transform) 與 /device_transform_inspector.ts，完成編譯驗證（Agent） → O1
