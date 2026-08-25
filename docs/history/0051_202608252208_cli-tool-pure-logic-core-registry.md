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

徹底清除 `src/packs/cli_tool` 對下游 Pack 的依賴，僅保留純字串分詞（`tokenize_input`）、旗標清洗（`clean_flag_arg`）、命令註冊表（`CLI_COMMAND_REGISTRY`）與執行器（`execute_command`），空間維度數學工具全數遷出，並於瀏覽器掛載 `window.cli`。

**沿革**

- H1 · 2026-08-25 22:08 決斷 —— 確立 cli_tool 僅依賴 core 與 runtime 之純邏輯重構待辦（使用者）
- H2 · 2026-08-25 22:09 落地 —— 完成 cli_tool 純邏輯核心重構，徹底消除下游 Pack 依賴，以 Core Command Registry 為 SSOT 驅動通用指令反射與 Help，並綁定 window.cli（agent: gemini-3.7-flash-high） → O1
- H3 · 2026-08-25 22:17 落地 —— 將 parse_axis_name, get_axis_label, get_right_oriented_axes 移至 vanilla/axes.ts，消滅 cli_tool 內嵌遊戲業務邏輯，cli_tool 達成 100% 自包含零外部依賴（agent: gemini-3.7-flash-high） → O1

### 2 擴充指令回歸 Core Registry 與 UI 面板適配 (Core Registry & UI Adaptation)
- **state:** 等待確認
- **basis:** → O1

將各 Pack 之擴充操作納入各自模組初始化時註冊至 CLI（`vanilla` 註冊地圖/歷程指令、`layered_2d` 註冊旋轉/翻轉、`basic_renderer` 註冊相機、`basic_ui` 註冊裝置資訊），並由 `shirones_ui/cli_panel.ts` 統一調用。

**沿革**

- H1 · 2026-08-25 22:08 決斷 —— 確立指令回歸 Core Registry 與 UI 面板適配待辦（使用者）
- H2 · 2026-08-25 22:17 落地 —— 建立各 Pack（vanilla, layered_2d, basic_renderer, basic_ui）之 cli_commands 註冊模組並於 init_pack 自動註冊，shirones_ui 面板完美調用（agent: gemini-3.7-flash-high） → O1
