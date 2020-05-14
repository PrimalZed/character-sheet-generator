
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { RouterModule } from "@angular/router";

import { AboutComponent } from "./components/about.component";
import { HandlebarsComponent } from "./components/handlebars.component";
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [
    AppComponent,
    HandlebarsComponent,
    AboutComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([
      { path: "", redirectTo: "/handlebars", pathMatch: "full" },
      { path: "handlebars", component: HandlebarsComponent },
      { path: "about", component: AboutComponent }
    ])
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
