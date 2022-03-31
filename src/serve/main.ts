import { app, BrowserWindow, shell } from "electron";
import { merge } from "rxjs";
import * as path from "path";
import { DialogService } from "./services/dialog.service";
import { HandlebarsService } from "./services/handlebars.service";
import { ScanService } from "./services/scan.service";

app.allowRendererProcessReuse = false;

let win: BrowserWindow = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === "--serve");

function createWindow(): BrowserWindow {
  // Create the browser window.
  win = new BrowserWindow({
    width: 600, 
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (serve) {
    win.loadURL("http://localhost:4200");
  } else {
    win.loadURL(new URL(`file:///${path.join(__dirname, "renderer/index.html")}`).toString());
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Event when a hyperlink with target="_blank" is clicked
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Event when the window is closed.
  win.on("closed", function () {
    win = null
  });

  return win;
}

const dialogService = new DialogService();
const scanService = new ScanService();
const handlebarsService = new HandlebarsService();

const subscription = merge(
    dialogService.getFilePath$,
    dialogService.getDirectoryPath$,
    scanService.scanDirectory$,
    scanService.scanPartials$,
    handlebarsService.generate$
  )
  .subscribe();

// Create window on electron intialization
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  if (subscription && !subscription.closed) {
    subscription.unsubscribe();
  }
  app.quit();
});
