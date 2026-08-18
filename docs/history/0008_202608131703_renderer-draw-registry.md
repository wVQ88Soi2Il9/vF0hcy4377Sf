# 0008_202608131703_renderer-draw-registry

- **status:** done
- **prev:** 0007_202608130046_cmd-tool-split.md
- **skill:** plan-history v3

## 主題簡述

Renderer 架構重構與強制裝置專屬 Draw Function 規範、Rely-Pack 擴充目錄 (`$<rely_pack>/`) 確立。

## 觀察與推論

### O1 · 2026-08-13 17:03:00+08:00 — Rely-Pack 擴充目錄與 Draw Function
確定每個 Device 強制具備專屬 draw function，並正名 Rely-Pack 擴充目錄 (`$<rely_pack>/`) 規範與 `import.meta.glob` 動態註冊機制。

## 待辦

### 1 強制專屬 Draw Function 與 Rely-Pack 擴充目錄
- **state:** 完成
- **basis:** → O1

移除 `draw_devices()` 內部 inline fallback 色塊/紅框繪製，統一物件導出 `basic_renderer`，建立 `src/packs/test/$basic_renderer/` 並以 `import.meta.glob` 動態註冊，確立 Rely-Pack 擴充目錄規範（Rule 6）。

**沿革**
- H1 · 2026-08-13 17:03 落地 —— 完成 Renderer 架構重構與 Rely-Pack 規範 → O1
