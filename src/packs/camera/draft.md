# camera — 功能草稿

為 cleanroom design 而留:只描述原實作「做了什麼」,不保留程式碼。原實作已刪除;需要原始碼時看 git 歷史(刪除前最後一版:`4ad764d`)。

## 定位

把 N 維空間用「選兩軸 + 其餘軸切片」的方式投影成 2D 資料,再交給 `basic_renderer` 繪製。

pack id:`camera`,manifest 只有 `pack_id`,沒有 hooks、state、commands。

AGENTS.md 對 camera 的期望比原實作多:「camera state、viewport control、projection、camera CLI」。原實作只有 projection 與一個 render 包裝,**沒有** camera 狀態、視口控制、CLI。

## 輸入資料

- `camera_args`
  - `axes`:`[a, b]`,要顯示成畫面水平、垂直的兩個軸索引
  - `slices`:`{ 軸索引: 切片座標 }`,其他軸要切在哪裡
  - `other_info`:附帶資訊,原樣併入投影結果

## 功能

### 1. 投影(`project(space, args)`)

- **可見規則「接觸即傳」**:裝置只要有任一個單元接觸所有切片,就整個放進結果;不裁切裝置。
- **接觸判定**:對每個切片軸,單元在該軸佔 `[位置 + 單元偏移, 再加 2)` 的半開區間(一個單元 2 個座標單位寬);切片值落在區間內才算接觸。
- 沒有出現在 `slices` 的軸不做篩選。
- 結果:
  - `size` = `[space.size[axes[0]], space.size[axes[1]]]`
  - `devices` = 可見裝置(原物件,不複製,不轉成 2D 座標)
  - `other_info` = `{ axes, slices, ...args.other_info }`

### 2. 繪製包裝(`render(space, args, options)`)

先 `project`,再 `basic_renderer.render(projection, options)`。
