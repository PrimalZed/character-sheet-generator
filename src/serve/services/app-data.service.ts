import { app, ipcMain, IpcMainEvent } from "electron";
import { from, Observable } from "rxjs";
import { filter, first, map, mapTo, shareReplay, startWith, switchMap, tap, withLatestFrom } from "rxjs/operators";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { DialogService } from "./dialog.service";
import * as constants from "../../electron.constants";

export class AppDataService {
  private readFile = promisify(fs.readFile);
  private exists = promisify(fs.exists);
  private mkDir = promisify(fs.mkdir);
  private writeFile = promisify(fs.writeFile);

  private readonly path = path.join(
    app.getPath('appData'),
    'PrimalZed/CharacterSheetGenerator'
  );;
  private readonly appDataFile = path.join(
    this.path,
    'data.json'
  );
  public loadDirectory$ =
    new Observable<{ event: IpcMainEvent, responseChannel: string }>((observer) => {
      ipcMain.on(constants.LOAD_APP_DATA_DIRECTORY, (event, responseChannel) => {
        observer.next({ event, responseChannel });
      });
    })
      .pipe(
        switchMap(({ event, responseChannel}) => {
          return this.readFile(this.appDataFile, { encoding: 'utf8' })
            .then((json) => ({ event, responseChannel, data: JSON.parse(json) }))
            .catch((err) => ({ event, responseChannel, data: { directory: null } }))
        }),
        map(({ event, responseChannel, data: { directory } }) => ({
          event,
          responseChannel,
          directory
        })),
        tap(({ event, responseChannel, directory }) => {
          event.reply(responseChannel, directory);
        }),
        map(({ directory }) => directory),
        shareReplay(1)
      );

  constructor(private dialogService: DialogService) { }

  public saveDirectory(): Observable<void> {
    return this.loadDirectory$
      .pipe(
        first(),
        withLatestFrom(this.dialogService.getDirectoryPath$
          .pipe(
            filter(({ responseChannel }) => responseChannel === constants.DIRECTORY_SUCCESS),
            map(({ directory }) => directory),
            startWith(null as string)
          )
        ),
        map(([initialDirectory, latestDirectory]) => latestDirectory ?? initialDirectory),
        filter((directory) => Boolean(directory)),
        switchMap((directory) => from(this.exists(this.path))
          .pipe(
            switchMap((exists) => exists
              ? Promise.resolve<string>(this.path)
              : this.mkDir(this.path, { recursive: true })
            ),
            mapTo(directory)
          )
        ),
        switchMap((directory) => this.writeFile(this.appDataFile, JSON.stringify({ directory }), { encoding: 'utf8' }))
      );
  }
}
