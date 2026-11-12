const { app, BrowserWindow, dialog, Menu, net, protocol, session, shell } = require('electron');
const path = require('node:path');
const { stat } = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const APP_ID = 'org.asonog.nuestralabor2026';
const APP_URL = 'asonog://app/';
const CONTENT_ROOT = path.resolve(__dirname, '..', 'dist');
const EXTERNAL_HOSTS = new Set(['www.geoboundaries.org', 'www.openstreetmap.org']);
const CONTENT_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'";
let mainWindow;

app.setName('ASONOG Nuestra Labor 2026');
app.setAppUserModelId(APP_ID);

protocol.registerSchemesAsPrivileged([{
  scheme: 'asonog',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

function isAppUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'asonog:' && url.host === 'app';
  } catch { return false; }
}

function openCreditLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && EXTERNAL_HOSTS.has(url.hostname)) {
      shell.openExternal(url.href).catch(() => {});
    }
  } catch { /* Ignore links outside the application's credits. */ }
}

async function serveApp(request) {
  try {
    if (!isAppUrl(request.url)) return new Response('Not found', { status: 404 });
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(CONTENT_ROOT, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(CONTENT_ROOT + path.sep)) return new Response('Forbidden', { status: 403 });
    if (!(await stat(file)).isFile()) return new Response('Not found', { status: 404 });
    const response = await net.fetch(pathToFileURL(file).href);
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', CONTENT_POLICY);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function createWindow() {
  const hidden = app.commandLine.hasSwitch('hidden');
  mainWindow = new BrowserWindow({
    title: 'ASONOG · Nuestra Labor 2026',
    width: 1440,
    height: 950,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#E9E8E5',
    icon: path.join(CONTENT_ROOT, 'assets', 'asonog-logo.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.once('ready-to-show', () => {
    if (!hidden) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openCreditLink(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      openCreditLink(url);
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadURL(APP_URL).catch(error => {
    dialog.showErrorBox('No se pudo abrir ASONOG', error.message);
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    protocol.handle('asonog', serveApp);
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
      (_request, callback) => callback({ cancel: true }),
    );
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(permission === 'fullscreen');
    });
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch(error => {
    dialog.showErrorBox('No se pudo iniciar ASONOG', error.message);
    app.quit();
  });
}

app.on('window-all-closed', () => app.quit());
