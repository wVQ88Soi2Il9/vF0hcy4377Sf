# 0051_202608252208_cli-tool-pure-logic-core-registry

- **status:** in-progress
- **prev:** ./0050_202608252115_pack-module-command-registry.md
- **skill:** plan-history v3

## 主題簡述

重構 `src/packs/cli_tool` 為極致純粹的命令列解析與執行引擎，完全消除對其他下游 Pack（`vanilla`, `basic_renderer`, `basic_ui`）的依賴，以 Core 的 `pack_registry` 為唯一真實來源（SSOT）驅動所有指令查找、動態反射執行與 Help 生成。

---

## 觀察與推論

### O1 · 2026-08-25 22:08:00+08:00 — CLI Tool 純粹化與 Core Command Registry SSOT
`cli_tool` 的本質為純文字指令解析與轉譯介面，所有 Pack（`core`, `vanilla`, `layered_2d`, `pipe` 等）的指令應直接宣告於 `pack_module.commands` 並註冊至 Core 的 `pack_registry`。`cli_tool` 僅依賴 `@/core` 與 `@/runtime` 讀取註冊表執行，並自動掛載至 DevTools Console（`window.cli`）。

---

## 待辦

### 1 重構 cli_tool 為純邏輯核心 (Pure CLI Tool Logic)
- **state:** 等待確認
- **basis:** → O1

徹底清除 `src/packs/cli_tool` 對下游 Pack 的依賴，僅依賴 `@/core` 與 `@/runtime`。實作純文字解析、Core Registry 動態反射執行、Core 歷史導航指令與動態 Help 生成，並於瀏覽器掛載 `window.cli`。

**沿革**

- H1 · 2026-08-25 22:08 決斷 —— 確立 cli_tool 僅依賴 core 與 runtime 之純邏輯重構待辦（使用者）
- H2 · 2026-08-25 22:09 落地 —— 完成 cli_tool 純邏輯核心重構，徹底消除下游 Pack 依賴，以 Core Command Registry 為 SSOT 驅動通用指令反射與 Help，並綁定 window.cli（agent: gemini-3.7-flash-high） → O1

### 2 擴充指令回歸 Core Registry 與 UI 面板適配 (Core Registry & UI Adaptation)
- **state:** 待實作
- **basis:** → O1

將各 Pack 之擴充操作納入各自的 `pack_module.commands`，並在 `shirones_ui/cli_panel.ts` 整合別名映射與終端機 UI 面板。

**沿革**

- H1 · 2026-08-25 22:08 決斷 —— 確立指令回歸 Core Registry 與 UI 面板適配待辦（使用者）
