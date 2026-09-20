# GPTs UI

依 [功能清單](FEATURES.md) 獨立重寫。使用 `core`、`world`、`panel`、`cli`、`vanilla_alpha`、`vanilla_beta`；沒有引用 `shirones_ui`。

```ts
import { create_ui_layout, create_extensions } from '@/packs/gpts_ui';

const extensions = create_extensions();
extensions.register_device_action({ label: 'Inspect', on_click: dev => console.log(dev) });
const ui = create_ui_layout(target_world, host, extensions);
ui.info_bar.display_device_info(1);
ui.viewport_panel.content_element.append(canvas);
// 移除 UI 時解除其 world hooks。
ui.destroy();
```

world 需先依專案契約初始化 `vanilla_alpha` hooks，UI 才能接收外部事件。`global_init(registry)` 註冊 pack 身分，不保存全域 world。省略 extensions 時每個 layout 各自建立一份；傳入相同物件可共用擴充。註冊擴充後可呼叫 `info_bar.refresh()` 更新檢視；建立選項在 definition 切換時重新產生，普通狀態刷新保留使用者輸入。

可以分別建立 `create_info_bar(world, on_change?, extensions?)`、`create_history_tree(world, on_change?)`、`create_cli_bar(world, on_change?)`、`create_viewport_panel()`。狀態與歷史元件的 `destroy()` 解除 hook，完整 layout 的 `destroy()` 另會移除根 DOM。

Viewport 只提供容器與縮放顯示；未整合相機或 renderer。CLI 依既有 `exe` 執行，不另行改寫命令／歷史契約。registry 若沒有 devices，建立選單為空。

## 預覽與校驗

```powershell
npm run dev -- --host 127.0.0.1 --port 5179
# 瀏覽 http://127.0.0.1:5179/gpts-ui.html

node node_modules/typescript/bin/tsc -p checks/gpts_ui/tsconfig.json --pretty false
node checks/gpts_ui/run.mjs
npm run build
```

自動瀏覽器校驗使用本機 Edge、Node 內建 WebSocket 與 CDP，沒有新增套件。可透過 `EDGE_PATH` 指定瀏覽器執行檔；使用 port 9239。行為校驗也可直接開啟 `/checks/gpts_ui/index.html`。截圖與結果在 `node_modules/.tmp/gpts-ui/`。

正式預覽 bundle 可於 PowerShell 執行：

```powershell
@'
import { build } from 'vite';
await build({ build: { outDir: 'node_modules/.tmp/gpts-build', rollupOptions: { input: 'gpts-ui.html' } } });
'@ | node --input-type=module
```

`src/main.ts` 已使用 GPTs UI。獨立預覽入口沒有測試設備；行為校驗入口包含獨立測試 world 與設備。
