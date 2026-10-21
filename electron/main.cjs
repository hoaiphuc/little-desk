// The desktop version: the same web build (dist/) in its own window, so it
// can be downloaded and played without a browser. Build it with
// `npm run package:win`; try it with `npm run desktop`.

const path = require('node:path');
const { app, BrowserWindow, shell } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 540,
    useContentSize: true, // 960x540 for the game itself, not counting the title bar
    minWidth: 480,
    minHeight: 270,
    backgroundColor: '#15112a',
    title: 'Little Desk',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false,
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());

  // F11 toggles fullscreen, Esc leaves it (the menu that would do this is removed).
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (input.key === 'Escape' && win.isFullScreen()) {
      win.setFullScreen(false);
    }
  });

  // Any link that tries to open a new window goes to the real browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
