import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styles: [
    "a { padding: 1rem; }"
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent { }
