import { Injectable } from "@angular/core";
import { FileFilter, IpcRendererEvent, ipcRenderer } from "electron";
import { merge } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { IpcRendererService } from "./ipc-renderer.service";
import * as constants from "../../../electron.constants";

@Injectable({
  providedIn: "root"
})
export class FilePathService {
  public directoryPath$ = this.ipcRendererService.fromEvent<string>(constants.DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [directoryPath] }) => ({ event, directoryPath })),
      shareReplay(1)
    );

  private scanTemplateFilePath$ = this.ipcRendererService.fromEvent<{ templatePath: string }>(constants.SCAN_DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [{ templatePath }] }) => ({ event, filePath: templatePath }))
    );

  private selectTemplateFilePath$ = this.ipcRendererService.fromEvent<string>(constants.TEMPLATE_FILE_PATH_SUCCESS)
    .pipe(
      map(({ event, args: [filePath]}) => ({ event, filePath }))
    );

  public templateFilePath$ = merge<{ event: IpcRendererEvent, filePath: string }>(this.scanTemplateFilePath$, this.selectTemplateFilePath$)
    .pipe(
      shareReplay(1)
    );

  private scanDataFilePath$ = this.ipcRendererService.fromEvent<{ dataPath: string }>(constants.SCAN_DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [{ dataPath }] }) => ({ event, filePath: dataPath }))
    );

  private selectDataFilePath$ = this.ipcRendererService.fromEvent<string>(constants.DATA_FILE_PATH_SUCCESS)
    .pipe(
      map(({ event, args: [filePath]}) => ({ event, filePath }))
    );

  public dataFilePath$ = merge<{ event: IpcRendererEvent, filePath: string }>(this.scanDataFilePath$, this.selectDataFilePath$)
    .pipe(
      shareReplay(1)
    );

  private scanPartialDirectoryPath$ = this.ipcRendererService.fromEvent<{ partialsPath: string }>(constants.SCAN_DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [{ partialsPath }] }) => ({ event, directoryPath: partialsPath }))
    );

  private selectPartialDirectoryPath$ = this.ipcRendererService.fromEvent<string>(constants.PARTIALS_DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [directoryPath]}) => ({ event, directoryPath }))
    );

  public partialDirectoryPath$ = merge<{ event: IpcRendererEvent, directoryPath: string }>(this.scanPartialDirectoryPath$, this.selectPartialDirectoryPath$)
    .pipe(
      shareReplay(1)
    );

  private scanPartialPaths$ = this.ipcRendererService.fromEvent<string[]>(constants.SCAN_PARTIALS_SUCCESS)
    .pipe(
      map(({ event, args: [filePaths]}) => ({ event, filePaths }))
    );

  public partialPaths$ = this.scanPartialPaths$
    .pipe(
      shareReplay(1)
    );

  private scanOutput$ = this.ipcRendererService.fromEvent<{ output: string }>(constants.SCAN_DIRECTORY_SUCCESS)
    .pipe(
      map(({ event, args: [{ output }] }) => ({ event, output }))
    );

  public output$ = this.scanOutput$
    .pipe(
      shareReplay(1)
    );

  private readonly handlebarsFileFilter: FileFilter = {
    name: "Handlebars",
    extensions: ["hbs", "handlebars"]
  };

  private readonly jsonFileFilter: FileFilter = {
    name: "JSON",
    extensions: ["json"]
  };

  constructor(private ipcRendererService: IpcRendererService) { }

  public dispatchSelectDirectory() {
    ipcRenderer.send(constants.SHOW_DIALOG_DIRECTORY, constants.DIRECTORY_SUCCESS);
  }

  public scanDirectory(directoryPath: string) {
    ipcRenderer.send(constants.SCAN_DIRECTORY, directoryPath);
  }

  public dispatchShowTemplateDialog() {
    ipcRenderer.send(constants.SHOW_DIALOG_FILE, [this.handlebarsFileFilter], constants.TEMPLATE_FILE_PATH_SUCCESS);
  }

  public dispatchShowDataDialog() {
    ipcRenderer.send(constants.SHOW_DIALOG_FILE, [this.jsonFileFilter], constants.DATA_FILE_PATH_SUCCESS);
  }

  public dispatchShowPartialsDialog() {
    ipcRenderer.send(constants.SHOW_DIALOG_DIRECTORY, constants.PARTIALS_DIRECTORY_SUCCESS);
  }

  public scanPartials(partialsDirectoryPath: string) {
    ipcRenderer.send(constants.SCAN_PARTIALS, partialsDirectoryPath);
  }
}
