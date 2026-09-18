# Panel

`panel` 負責排列 panels，並讓相鄰 panels 可以透過 resize handle 交換空間。
初始尺寸、比例、min/max constraint 與 responsive rules 仍由下游 CSS 決定。

## Resize invariants

以下實作看似可以簡化，但各自維持必要的拖曳行為，不應在沒有替代機制時移除：

- `freeze_size()`：拖曳開始時固定同層其他 panels 的實際尺寸，避免不相鄰的 panel 參與 flex shrink。
- `set_resizable_size()`：只讓 resize handle 兩側的 panels 吸收尺寸變化與 min/max constraint。
- `pointer_id`：只接受目前拖曳 pointer 的後續事件，避免其他 pointer 干擾。
- `setPointerCapture()`：pointer 離開 resize handle 後仍能繼續拖曳。
- `pointercancel`：清理被瀏覽器或系統中止的拖曳。
- `touch-action: none`：避免觸控拖曳被瀏覽器解讀為捲動。
- `align-self: stretch`：即使下游改變 parent 的 `align-items`，resize handle 仍覆蓋完整副軸。
- `is_dragging`：pointer 離開 resize handle 後仍保留拖曳中的視覺狀態。
- ARIA `separator`：描述 resize handle 的 DOM 語義。

其中 `freeze_size()` 與 `set_resizable_size()` 共同維持最重要的 invariant：拖曳一條 resize handle 時，只有相鄰的兩個 panels 改變尺寸。
