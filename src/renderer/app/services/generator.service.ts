import { Injectable } from "@angular/core";
import { ipcRenderer } from "electron";
import { map, shareReplay } from "rxjs/operators";
import { IpcRendererService } from "./ipc-renderer.service";
import * as constants from "../../../electron.constants";

@Injectable({
  providedIn: "root"
})
export class GeneratorService {
  public htmlSuccess$ = this.ipcRendererService.fromEvent(constants.GENERATE_HANDLEBARS_SUCCESS)
    .pipe(
      shareReplay(1)
    );

  public htmlFailure$ = this.ipcRendererService.fromEvent<any>(constants.GENERATE_HANDLEBARS_FAILURE)
    .pipe(
      map(({ args: [error] }) => error && error.message || error)
    );

  constructor(private ipcRendererService: IpcRendererService) { }

  generateHtml(directoryPath: string, templatePath: string, dataPath: string, partialPaths: string[], output: string, noEscape: boolean) {
    ipcRenderer.send(constants.GENERATE_HANDLEBARS, { templatePath, dataPath, partialPaths, directoryPath, output, noEscape });
  }
}
