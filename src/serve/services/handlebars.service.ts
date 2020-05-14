
import { camelCase } from "camel-case";
import { combineLatest, concat, from, EMPTY } from "rxjs";
import { catchError, last, map, mergeMap, switchMap, tap } from "rxjs/operators";
import { promisify } from "util";
import * as fs from "fs";
import * as handlebars from "handlebars";
import * as helpersLib from "../utilities/handlebars-helpers";
import * as handlebarsRepeat from "handlebars-helper-repeat";
import * as path from "path";
import { fromIpcMainEvent } from "../utilities/fromIpcMainEvent";
import * as constants from "../../electron.constants";

export class HandlebarsService {
  private readFile = promisify(fs.readFile);
  private writeFile = promisify(fs.writeFile);
  public generate$ = fromIpcMainEvent<{ directoryPath: string, templatePath: string, dataPath: string, partialPaths: string[], output: string}>(constants.GENERATE_HANDLEBARS)
    .pipe(
      switchMap(({ event, args: [{ directoryPath, templatePath, dataPath, partialPaths, output}]}) => {
        const registerPartialFiles$ = this.registerPartialFiles(partialPaths);

        const template$ = from(this.readFile(templatePath, { encoding: "utf8" }))
          .pipe(
            map((file) => handlebars.compile(file))
          );
      
        const data$ = from(this.readFile(dataPath, { encoding: "utf8" }))
          .pipe(
            map((file) => JSON.parse(file))
          );
        const outputPath = path.join(directoryPath, output);
        const writeFile$ = combineLatest(template$, data$)
          .pipe(
            map(([template, data]) => template(data)),
            switchMap((outFile) => this.writeFile(outputPath, outFile))
          );

        return concat(registerPartialFiles$, writeFile$)
          .pipe(
            last(),
            tap(() => event.reply(constants.GENERATE_HANDLEBARS_SUCCESS)),
            catchError((err) => {
              console.error(err && err.message || err);
              event.reply(constants.GENERATE_HANDLEBARS_FAILURE, err);
              return EMPTY;
            })
          );
      })
    );

  constructor() {
    for (let group of Object.values(helpersLib)) {
      for (let [key, helper] of Object.entries(group)) {
        handlebars.registerHelper(key, helper as any);
      }
    }
    
    handlebars.registerHelper("repeat", handlebarsRepeat);
  }

  private registerPartialFiles(partialPaths: string[]) {
    return from(partialPaths ?? [])
      .pipe(
        mergeMap((match) => this.readFile(match, { encoding: "utf8" }).then((file) => ({ match, file }))),
        tap(({ match, file }) => {
          const fileName = match.split("/").slice(-1)[0];
          const fileNameSansExtension = fileName.split(".").slice(0, -1).join(".");
          const partialName = camelCase(fileNameSansExtension);
          handlebars.registerPartial(partialName, file);
        })
      );
  }
}
