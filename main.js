const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const syncEngine = require('./sync-engine');

// File logger to catch crashes in packaged EXE
const logPath = path.join(app.getPath('userData'), 'server-debug.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function logToFile(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line);
  logStream.write(line);
}

const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');

const result = dotenv.config({ path: envPath });
const envVariables = result.parsed || {};

let mainWindow;
let expressAppProcess = null;
let mongodProcess = null;

// Path where MongoDB will store its local data files
const dbDataPath = path.join(app.getPath('userData'), 'dbdata');

if (!fs.existsSync(dbDataPath)) {
  fs.mkdirSync(dbDataPath, { recursive: true });
}

function startMongoDB() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;

    const mongoBinPath = isDev
      ? path.join(__dirname, 'bin', 'mongod.exe')
      : path.join(process.resourcesPath, 'bin', 'mongod.exe');

    logToFile(`Starting MongoDB from: ${mongoBinPath}`);

    mongodProcess = spawn(mongoBinPath, [
      '--dbpath',
      dbDataPath,
      '--port',
      '27017',
      '--bind_ip',
      '127.0.0.1',
    ]);

    let resolved = false;

    mongodProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      // logToFile(`[Mongo]: ${msg}`);

      // Look for MongoDB readiness indicator
      if (
        !resolved &&
        (msg.includes('Waiting for connections') ||
          msg.includes('msg":"Waiting for connections"'))
      ) {
        resolved = true;
        resolve();
      }
    });

    mongodProcess.stderr.on('data', (data) => {
      logToFile(`[Mongo Error]: ${data}`);
    });

    mongodProcess.on('error', (err) => {
      logToFile(`[Mongo Spawn Failed]: ${err.message}`);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    // Timeout fallback in case stdout parsing skips the ready signal
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 5000);
  });
}

function startExpressBackend() {
  return new Promise((resolve) => {
    const isDev = !app.isPackaged;

    if (isDev) {
      logToFile(
        'Running in Dev Mode: Skipping internal Express spawn (assumed external node server).',
      );
      return resolve();
    }

    const serverPath = path.join(__dirname, 'server/dist/src/app.js');
    logToFile(`Attempting to launch Express from: ${serverPath}`);

    expressAppProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        ...envVariables,
        ELECTRON_RUN_AS_NODE: '1',
      },
    });

    expressAppProcess.stdout.on('data', (data) =>
      logToFile(`[Express]: ${data}`),
    );
    expressAppProcess.stderr.on('data', (data) =>
      logToFile(`[Express Error]: ${data}`),
    );
    expressAppProcess.on('error', (err) =>
      logToFile(`[Express Spawn Failed]: ${err.message}`),
    );
    expressAppProcess.on('exit', (code) =>
      logToFile(`[Express Exited with code]: ${code}`),
    );

    // Allow Express brief window to initialize HTTP listener
    setTimeout(resolve, 1500);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Student Information Management System',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.maximize();
  mainWindow.show();

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      logToFile(`Failed to load index.html: ${err}`);
    });
  }
}

app.whenReady().then(async () => {
  try {
    // 1. Start MongoDB first and wait until ready
    await startMongoDB();
    logToFile('Local MongoDB engine started successfully!');

    // 2. Start Express Backend next so it connects cleanly to Mongo
    await startExpressBackend();

    // 3. Render Electron Window
    createWindow();

    // 4. Start SyncEngine (after window is created so IPC is available)
    const atlasBaseUrl = process.env.CLOUD_API_URL || '';
    syncEngine.start({
      window: mainWindow,
      userDataDir: app.getPath('userData'),
      localApiBaseUrl: `http://localhost:${process.env.PORT || 3000}`,
      atlasBaseUrl,
      logFn: logToFile,
    });
    logToFile('SyncEngine started.');
  } catch (err) {
    logToFile(`Application startup failed: ${err.message}`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  syncEngine.stop();
  if (mongodProcess) {
    mongodProcess.kill();
  }
  if (expressAppProcess) {
    expressAppProcess.kill();
  }
});
