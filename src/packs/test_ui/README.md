# test_ui

## 目的

測試用的介面，用來確認 panel、cli 與 history 能接在一起運作。不是正式 UI。

## Code

| 檔案 | 內容 |
|---|---|
| `ui.ts` | 四個 panel 與版面：左 `history`、中 `view`、右上 `edit`、右下 `cli`；`mark` 操作模板；committed 時重畫 history；view 的視角控制與 `view_color`；共用控制項樣式（第一次 render 時掛一個 `<style>` 進 `<head>`） |
| `demo_device.ts` | `demo_box`／`demo_bar`／`demo_slab`：示範裝置；`project_ports`：依視角投影埠 |
| `index.ts` | manifest：`devices.box`、`op_templates.mark`、`other_info.panel.panels`、`create_state`（每個 world 的 refresh 清單）、`on['core:committed']` |

## 行為

- `edit`：選操作（create／move／delete），再選裝置類別（create，列出 registry 全部）或既有裝置（move／delete，committed 時更新），輸入座標後按 Enter 或 run，送出對應的 cli 指令；結果或錯誤顯示在下方。
- `cli`：輸入一行按 Enter 呼叫 `cli.run`，顯示結果；錯誤以紅字顯示。
- `history`：以縮排列出整棵 history tree，`●` 為目前節點；點節點跳過去；上方有 undo、redo、root、leaf。
- `view`：無限畫布。`camera.project` 後剪掉空間範圍外的格子（全被剪掉的裝置不畫），以 `basic_renderer.render` 畫成圖層放進 `<svg>`；`viewBox` 由 view 持有的 `camera_state` 經 `camera.window_of` 算出。committed 或改視角時重畫；滾輪以游標為中心縮放、拖曳平移、「全景」按鈕 `camera.fit`，這三者只改 `viewBox` 不重畫。第一次量到畫面大小時自動 fit，換軸時保留平移/縮放。上方可選橫/直軸（選到另一軸時兩軸互換）與每個切片軸的位置；初始視角為 d0/d1、其餘軸切在 1。畫面左側與下方標出直軸、橫軸的 index 與正方向（直軸向上，見 basic_renderer）。空間範圍以底色標出；格線每格一條，只畫畫面看得到的範圍（含空間外），線寬不隨縮放改變，一格小於 6px 時不畫。不合法的切片不採用，畫面還原後 throw。
- `test_ui:box`／`bar`／`slab`（`demo_device.ts`）：示範長方體裝置，分別為每軸一格、第 0 軸兩格、第 0 和 1 軸各兩格；可用 `create_device test_ui:<id> <coords...>` 建立；每軸兩端各有一個埠（位於第一格那一列）；顏色由 view 依視角決定（`view_color`：畫面軸組合定色相、切片平均相對位置定明暗）。
  - 埠：第 1 軸兩面為雙向，其餘各軸負面輸入、正面輸出。`draw` 用收到的 `view` 投影埠：切片軸上距切片 ≤ 1 才畫；位於畫面軸的面上畫成格邊小方塊，位於切片軸的面上（朝畫面內外）畫在格中心，輸入為外圈、其他為實心點。顏色：輸入藍、輸出橘、雙向紫；滑鼠停留顯示 `port_uid` 與方向。
- `mark [label]`：不改 space 的操作，只為了在 history 產生節點。
