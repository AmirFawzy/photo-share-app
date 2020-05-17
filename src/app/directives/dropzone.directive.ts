import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[psDropzone]'
})
export class DropzoneDirective {
  @Output() filesDroped = new EventEmitter<FileList>();
  @Output() hovered = new EventEmitter<boolean>();

  constructor() { }

  /**
   * on drop file(S)
   * @param evt <DragEvent> drag event object
   * preventDefault of the drop event behavior on the browser
   * emit list of files dropped to `filesDroped` <FileList>
   * emit false <boolean> to `hovered` <boolean>
   */
  @HostListener('drop', ['$event']) ondrop(evt: DragEvent) {
    evt.preventDefault();
    this.filesDroped.emit(evt.dataTransfer.files);
    this.hovered.emit(false);
  }

  /**
   * on moving on whiel dragging
   * @param evt <Event> holds the event object
   * preventDefault of the dragover event behavior on the browser
   * emit true <boolean> to `hovered` <boolean>
   */
  @HostListener('dragover', ['$event']) ondragover(evt: Event) {
    evt.preventDefault();
    this.hovered.emit(true);
  }

  // same as above except the event is [dragleave]
  @HostListener('dragleave', ['$event']) ondragleave(evt: Event) {
    evt.preventDefault();
    this.hovered.emit(false);
  }

}
