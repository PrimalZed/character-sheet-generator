import { app, BrowserWindow, shell } from "electron";
import { merge } from "rxjs";
import { filter, map, shareReplay } from "rxjs/operators";
import * as path from "path";
import { DialogService } from "./services/dialog.service";
import { HandlebarsService } from "./services/handlebars.service";
import { ScanService } from "./services/scan.service";
import * as constants from "../electron.constants";
import { AppDataService } from "./services/app-data.service";

let mainWindow: BrowserWindow = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === "--serve");

function createWindow(): BrowserWindow {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600, 
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (serve) {
    mainWindow.loadURL("http://localhost:4200");
  } else {
    mainWindow.loadURL(new URL(`file:///${path.join(__dirname, "renderer/index.html")}`).toString());
  }

  if (serve) {
    mainWindow.webContents.openDevTools();
  }

  // Event when a hyperlink with target="_blank" is clicked
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Event when the window is closed.
  mainWindow.on("closed", function () {
    mainWindow = null
  });

  return mainWindow;
}

const dialogService = new DialogService();
const scanService = new ScanService();
const handlebarsService = new HandlebarsService();
const appDataService = new AppDataService(dialogService);

const subscription = merge(
    dialogService.getFilePath$,
    dialogService.getDirectoryPath$,
    scanService.scanDirectory$,
    scanService.scanPartials$,
    handlebarsService.generate$,
    appDataService.loadDirectory$
  )
  .subscribe();

// Create window on electron intialization
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  appDataService.saveDirectory()
    .subscribe({
      complete: () => {
        if (subscription && !subscription.closed) {
          subscription.unsubscribe();
        }
        
        app.quit();
      }
    });
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});
