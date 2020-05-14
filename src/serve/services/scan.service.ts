import { switchMap, tap } from "rxjs/operators";
import { promisify } from "util";
import * as glob from "glob";
import * as path from "path";
import { fromIpcMainEvent } from "../utilities/fromIpcMainEvent";
import * as constants from "../../electron.constants";

export class ScanService {
  private glob = promisify(glob);

  public scanDirectory$ = fromIpcMainEvent<string>(constants.SCAN_DIRECTORY)
    .pipe(
      switchMap(({ event, args: [ directoryPath ]}) => {
        const directories = ["src", "handlebars", "hbs", ""];
        var checkTemplate = this.checkFile(directoryPath, this.createPatterns(directories, ["hbs", "handlebars"]));
        var checkData = this.checkFile(directoryPath, this.createPatterns(directories, ["json"]));
        var checkPartials = this.checkDirectory(directoryPath, directories, "partials");
        var checkOutput = this.checkFile(directoryPath, this.createPatterns([""], ["html"]));

        return Promise.all([checkTemplate, checkData, checkPartials, checkOutput])
          .then(([templatePath, dataPath, partialsPath, output]) =>
            ({ event, templatePath, dataPath, partialsPath, output })
          );
      }),
      tap(({ event, templatePath, dataPath, partialsPath, output }) => {
        event.reply(constants.SCAN_DIRECTORY_SUCCESS, { templatePath, dataPath, partialsPath, output });
      })
    );

  public scanPartials$ = fromIpcMainEvent<string>(constants.SCAN_PARTIALS)
    .pipe(
      switchMap(({ event, args: [ directoryPath ]}) => {
        return this.checkFiles(directoryPath, this.createPatterns(["**"], ["hbs", "handlebars"]))
          .then((matches) => ({ event, filePaths: matches }))
      }),
      tap(({ event, filePaths }) => {
        event.reply(constants.SCAN_PARTIALS_SUCCESS, filePaths);
      })
    );

  private checkFile(root: string, patterns: { directory: string, extension: string }[]): Promise<string> {
    return this.checkFiles(root, patterns, true)
      .then((matches) => matches && matches.length && matches[0]);
  }

  private checkFiles(root: string, patterns: { directory: string, extension: string }[], exitOnFirstMatch: boolean = false): Promise<string[]> {
    if (!patterns.length) {
      return Promise.resolve([]);
    }

    const { directory, extension } = patterns.splice(0, 1)[0];

    return this.glob(path.join(root, directory, `*.${extension}`))
      .then((matches) => {
        if (matches.length && exitOnFirstMatch) {
          return matches;
        }
        return this.checkFiles(root, patterns)
          .then((recurseMatches) => [ ...matches, ...recurseMatches ])
      });
  }

  private checkDirectory(root: string, directories: string[], target: string): Promise<string> {
    if (!directories.length) {
      return Promise.resolve(null);
    }

    const directory = directories.splice(0, 1)[0];

    return this.glob(path.join(root, directory, target))
      .then((matches) => {
        if (matches.length) {
          return matches[0];
        }
        return this.checkDirectory(root, directories, target);
      });
  }

  private createPatterns(directories: string[], extensions: string[]) {
    return directories
      .map((directory) => extensions.map((extension) => ({ directory, extension })))
      .reduce((arr, curr) => arr.concat(curr), []);
  }
}
