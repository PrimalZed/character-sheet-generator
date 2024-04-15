import { Component, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { FilePathService } from "./../services/file-path.service";
import { GeneratorService } from "./../services/generator.service";
import { BehaviorSubject, Subject, combineLatest, merge, timer } from "rxjs";
import { map, mapTo, tap, startWith, switchMap } from "rxjs/operators";

@Component({
  selector: "handlebars",
  templateUrl: "./handlebars.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HandlebarsComponent implements OnDestroy {
  public directoryPath$ = this.filePathService.directoryPath$
    .pipe(
      map(({ directoryPath }) => directoryPath || null),
      tap((directoryPath) => {
        if (directoryPath) {
          this.filePathService.scanDirectory(directoryPath);
        }
      })
    );
  public templateFilePath$ = this.filePathService.templateFilePath$
    .pipe(
      map(({ filePath }) => filePath || null)
    );
  public dataFilePath$ = this.filePathService.dataFilePath$
    .pipe(
      map(({ filePath }) => filePath || null)
    );
  public partialsDirectoryPath$ = this.filePathService.partialDirectoryPath$
    .pipe(
      map(({ directoryPath }) => directoryPath || null),
      tap((directoryPath) => {
        if (directoryPath) {
          this.filePathService.scanPartials(directoryPath);
        }
      })
    );
  public partialPaths$ = this.filePathService.partialPaths$
    .pipe(
      map(({ filePaths }) => filePaths || null),
    );

  private scanPartialsSubject: Subject<void> = new BehaviorSubject(void(0));
  private scanPartials$ = combineLatest([this.partialsDirectoryPath$, this.scanPartialsSubject])
    .pipe(
      tap(([directoryPath]) => this.filePathService.scanPartials(directoryPath)),
    );

  private outputSubject: Subject<string> = new Subject();
  public output$ = merge(this.outputSubject, this.filePathService.output$.pipe(map(({ output }) => output && output.split("/").pop() || null)));

  public escape: boolean;

  private submittingSubject: Subject<void> = new Subject();
  public submitting$ = merge(
    this.submittingSubject.pipe(mapTo(true)),
    this.generatorService.htmlSuccess$.pipe(mapTo(false)),
    this.generatorService.htmlFailure$.pipe(mapTo(false))
  );

  public success$ = this.generatorService.htmlSuccess$
    .pipe(
      switchMap(() => timer(5000).pipe(mapTo(false),startWith(true)))
    );

  public failure$ = merge(this.submittingSubject.pipe(mapTo(false)), this.generatorService.htmlFailure$);

  private subscription = this.scanPartials$.subscribe();

  constructor(
    private filePathService: FilePathService,
    private generatorService: GeneratorService
  ) { }

  selectDirectoryPath() {
    this.filePathService.dispatchSelectDirectory();
  }

  selectTemplateFilePath() {
    this.filePathService.dispatchShowTemplateDialog();
  }

  selectDataFilePath() {
    this.filePathService.dispatchShowDataDialog();
  }

  selectPartialsDirectoryPath() {
    this.filePathService.dispatchShowPartialsDialog();
  }

  refreshPartialFiles() {
    this.scanPartialsSubject.next();
  }

  changeOutput(value: string) {
    this.outputSubject.next(value);
  }

  submit({ directoryPath, templatePath, dataPath, partialPaths, output, escape }) {
    this.submittingSubject.next();
    this.generatorService.generateHtml(directoryPath, templatePath, dataPath, partialPaths, output, !escape);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
