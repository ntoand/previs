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
  
  // note
  editMode = false;
  noteStr = '';
  // password
  passwordShowMode = false;
  passwordEditMode = false;
  passwordStr = '';
  
  ngOnInit() {
    if(this.dataset) {
      this.noteStr = this.dataset.note;
      this.passwordStr = this.dataset.password;
    }
  }
  
  ngOnChanges(changes) {
    this.noteStr = changes.dataset.currentValue.note;
    this.passwordStr = changes.dataset.currentValue.password;
  }
  
  onDeleteTag(tag, dir) {
    this.deleteTagEvent.emit({tag: tag, dir: dir});
  }
  
  // note
  onNoteEnableEdit($event) {
    $event.preventDefault();
    this.editMode = true;
  }
  
  onNoteEditCancel($event) {
    $event.preventDefault();
    this.editMode = false;
    this.noteStr = this.dataset.note;
  }
  
  onNoteEditGo($event) {
    $event.preventDefault();
    this.editMode = false;
    if(this.noteStr !== this.dataset.note) 
      this.updateTagEvent.emit({tag: this.dataset.tag, type: 'note', noteStr: this.noteStr, noteStrPrev: this.dataset.note});
  }

  // password
  onPasswordToggleShow($event) {
    $event.preventDefault();
    this.passwordShowMode = !this.passwordShowMode;
  }

  onPasswordEnableEdit($event) {
    $event.preventDefault();
    this.passwordEditMode = true;
  }

  onPasswordEditCancel($event) {
    $event.preventDefault();
    this.passwordEditMode = false;
    this.passwordStr = this.dataset.password;
  }

  onPasswordEditGo($event) {
    $event.preventDefault();
    this.passwordEditMode = false;
    if(this.passwordStr !== this.dataset.password) 
      this.updateTagEvent.emit({tag: this.dataset.tag, type: 'password', passwordStr: this.passwordStr, passwordStrPrev: this.dataset.password});
  }

}
