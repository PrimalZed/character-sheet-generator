import { Injectable, NgZone } from "@angular/core";
import { IpcRendererEvent, ipcRenderer } from "electron";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class IpcRendererService {
  constructor(private zone: NgZone) { }

  fromEvent(channel: string): Observable<{ event: IpcRendererEvent }>;
  fromEvent<T1>(channel: string): Observable<{ event: IpcRendererEvent, args: [ T1 ] }>;
  fromEvent<T1, T2>(channel: string): Observable<{ event: IpcRendererEvent, args: [ T1, T2 ] }>;
  fromEvent<R>(channel: string): Observable<{ event: IpcRendererEvent, args: R[] }> {
    return new Observable<{ event: IpcRendererEvent, args: R[] }>((observer) => {
      ipcRenderer.on(channel, (event, arg1, arg2) => {
        this.zone.run(() => {
          observer.next({ event, args: [arg1, arg2]});
        });
      });
    })
  }
}
