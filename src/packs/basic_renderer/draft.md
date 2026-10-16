# basic_renderer — 功能草稿

為 cleanroom design 而留:只列原實作提供的功能,不描述做法。原始碼見 git 歷史(刪除前最後一版:`4ad764d`)。

## 定位

把一份 2D 投影畫成畫面。不做投影,也不知道空間有幾維;投影由 `camera` 提供。

## 功能

1. 接收camera傳入
2. 定義每個device要怎麼畫
3. render成DOM/SVG/Canvas, return