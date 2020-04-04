import { IpcMainEvent, ipcMain } from "electron";
import { Observable } from "rxjs";

export function fromIpcMainEvent<T1>(channel: string): Observable<{ event: IpcMainEvent, args: [ T1 ] }>;
export function fromIpcMainEvent<T1, T2>(channel: string): Observable<{ event: IpcMainEvent, args: [ T1, T2 ] }>;
export function fromIpcMainEvent<R>(channel: string): Observable<{ event: IpcMainEvent, args: R[] }> {
  return new Observable<{ event: IpcMainEvent, args: R[] }>((observer) => {
    ipcMain.on(channel, (event, arg1, arg2) => {
      observer.next({ event, args: [arg1, arg2]});
    });
  })
}
