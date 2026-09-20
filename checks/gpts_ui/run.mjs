import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('node_modules/.tmp/gpts-ui');
await mkdir(output, { recursive: true });
const process_handle = spawn(process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9239',
    `--user-data-dir=${output}/profile`, '--window-size=1440,1000', 'about:blank'
], { windowsHide: true, stdio: 'ignore' });
let socket;
try
{
    let page;
    for (let attempt = 0; attempt < 100; attempt++)
    {
        try
        {
            const pages = await (await fetch('http://127.0.0.1:9239/json')).json();
            page = pages.find(page => page.type === 'page');
            if (page) { break; }
        }
        catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!page) { throw new Error('Edge debugging endpoint unavailable'); }
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let next_id = 0;
    const pending = new Map();
    socket.onmessage = event =>
    {
        const response = JSON.parse(event.data);
        if (!response.id) { return; }
        const request = pending.get(response.id);
        pending.delete(response.id);
        if (response.error) { request.reject(new Error(JSON.stringify(response.error))); }
        else { request.resolve(response.result); }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) =>
    {
        const id = ++next_id;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
    async function evaluate(expression)
    {
        const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) { throw new Error(JSON.stringify(result.exceptionDetails)); }
        return result.result.value;
    }
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:5179/checks/gpts_ui/index.html' });
    let title;
    for (let attempt = 0; attempt < 100; attempt++)
    {
        title = await evaluate('document.title');
        if (title === 'PASS' || title === 'FAIL') { break; }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    const report = await evaluate('document.getElementById("results")?.textContent');
    console.log(report);
    if (title !== 'PASS') { throw new Error('Browser behavior checks failed'); }
    await evaluate('document.getElementById("results").hidden = true');
    const dimensions = () => evaluate(`(() => {
        const ui = window.test_ui;
        return [ui.cad_timeline.element, ui.viewport_panel.panel.element, ui.info_bar.element, ui.cli_bar.element].map(el => {
            const r = el.getBoundingClientRect(); return { width:r.width, height:r.height };
        });
    })()`);
    async function drag(selector, dx, dy)
    {
        const point = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', buttons: 1, clickCount: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + dx, y: point.y + dy, button: 'left', buttons: 1 });
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + dx, y: point.y + dy, button: 'left', clickCount: 1 });
    }
    function check(condition, message)
    {
        if (!condition) { throw new Error(message); }
        console.log(`PASS ${message}`);
    }
    const initial = await dimensions();
    await drag('.gpts_ui > [role="separator"]', 60, 0);
    const horizontal = await dimensions();
    check(Math.abs(horizontal[0].width - initial[0].width - 60) < 2 && Math.abs(horizontal[2].width - initial[2].width) < 2, 'horizontal drag changes adjacent panels only');
    await evaluate('window.test_ui.cad_timeline.set_collapsed(true)');
    check(Math.abs((await dimensions())[0].width - 38) < 1, 'history collapses to 38px after dragging');
    await evaluate('window.test_ui.cad_timeline.set_collapsed(false)');
    check(Math.abs((await dimensions())[0].width - horizontal[0].width) < 2, 'history expanded width survives collapse');
    await drag('.gpts_ui > [role="separator"]:last-of-type', -35, 0);
    const right = await dimensions();
    check(Math.abs(right[2].width - horizontal[2].width - 35) < 2, 'right splitter resizes status panel');
    await evaluate('window.test_ui.info_bar.set_collapsed(true); window.test_ui.info_bar.set_collapsed(false)');
    check(Math.abs((await dimensions())[2].width - right[2].width) < 2, 'status expanded width survives collapse');
    await drag('.gpts_center > [role="separator"]', 0, -50);
    const vertical = await dimensions();
    check(Math.abs(vertical[3].height - right[3].height - 50) < 2, 'vertical drag resizes CLI');
    await evaluate('window.test_ui.cli_bar.set_collapsed(true); window.test_ui.cli_bar.set_collapsed(false)');
    check(Math.abs((await dimensions())[3].height - vertical[3].height) < 2, 'CLI expanded height survives collapse');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${output}/expanded.png`, Buffer.from(screenshot.data, 'base64'));
    await writeFile(`${output}/results.txt`, report);
    console.log(`Screenshot: ${output}/expanded.png`);
    await send('Browser.close');
}
finally
{
    socket?.close();
    process_handle.kill();
}
