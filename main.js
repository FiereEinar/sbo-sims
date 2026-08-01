const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');

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
let expressAppProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Student Information Management System',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

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

app.whenReady().then(() => {
  const isDev = !app.isPackaged;

  if (!isDev) {
    const serverPath = path.join(__dirname, 'server/dist/src/app.js');
    logToFile(`Attempting to launch Express from: ${serverPath}`);

    // Use Electron binary as Node executable to avoid needing Node installed globally
    expressAppProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env, // Preserve system PATH
        ...envVariables,
        ELECTRON_RUN_AS_NODE: '1', // Instructs Electron to act as standard Node.js
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
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (expressAppProcess) expressAppProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
