import { app, BrowserWindow, shell } from "electron";
import { merge } from "rxjs";
import * as path from "path";
import * as url from "url";
import { DialogService } from "./services/dialog.service";
import { HandlebarsService } from "./services/handlebars.service";
import { ScanService } from "./services/scan.service";
// import __basedir from "../basedir";

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
      nodeIntegration: true
    }
  });
  // console.log("basedir", __basedir);
  // console.log("dirname", __dirname);

  if (serve) {
    win.loadURL("http://localhost:4200");
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, "renderer/index.html"),
      protocol: "file:",
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Event when a hyperlink with target="_blank" is clicked
  win.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
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
