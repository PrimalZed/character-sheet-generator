import { FileFilter, IpcMainEvent, ipcMain, dialog } from "electron";
import { Observable } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import * as constants from "../../electron.constants";

export class DialogService {
  public getFilePath$ =
    new Observable<{ event: IpcMainEvent, fileFilters: FileFilter[], responseChannel: string }>((observer) => {
      ipcMain.on(constants.SHOW_DIALOG_FILE, (event, fileFilters, responseChannel) => {
        observer.next({ event, fileFilters, responseChannel });
      });
    })
    .pipe(
      switchMap(({ event, fileFilters, responseChannel }) => 
        dialog.showOpenDialog({ filters: fileFilters, properties: [ "openFile" ] })
          .then((dialogReturn) => ({ event, dialogReturn, responseChannel }))
      ),
      tap(({ event, dialogReturn, responseChannel }) => {
        event.reply(responseChannel, dialogReturn.filePaths.length && dialogReturn.filePaths[0]);
      })
    );

  public getDirectoryPath$ =
    new Observable<{ event: IpcMainEvent, responseChannel: string }>((observer) => {
      ipcMain.on(constants.SHOW_DIALOG_DIRECTORY, (event, responseChannel) => {
        observer.next({ event, responseChannel });
      });
    })
    .pipe(
      switchMap(({ event, responseChannel }) => 
        dialog.showOpenDialog({ properties: [ "openDirectory" ] })
          .then((dialogReturn) => ({ event, dialogReturn, responseChannel }))
      ),
      tap(({ event, dialogReturn, responseChannel }) => {
        event.reply(responseChannel, dialogReturn.filePaths.length && dialogReturn.filePaths[0]);
      })
    );
}
