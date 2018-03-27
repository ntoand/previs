import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { Dataset } from '../../shared/dataset.model';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent implements OnInit {

  constructor() { }
  
  @Input() dataset: Dataset = null;
  
  @Output() deleteTagEvent = new EventEmitter();
  @Output() updateTagEvent = new EventEmitter();
  
  editMode = false;
  noteStr = '';
  
  ngOnInit() {
    if(this.dataset) {
      this.noteStr = this.dataset.note;
    }
  }
  
  ngOnChanges(changes) {
    this.noteStr = changes.dataset.currentValue.note;
  }
  
  onDeleteTag(tag) {
    this.deleteTagEvent.emit(tag);
  }
  
  onEnableEdit($event) {
    $event.preventDefault();
    this.editMode = true;
  }
  
  onEditCancel($event) {
    $event.preventDefault();
    this.editMode = false;
    this.noteStr = this.dataset.note;
  }
  
  onEditGo($event) {
    $event.preventDefault();
    this.editMode = false;
    if(this.noteStr !== this.dataset.note) 
      this.updateTagEvent.emit({tag: this.dataset.tag, noteStr: this.noteStr, noteStrPrev: this.dataset.note});
  }

}
