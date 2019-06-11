import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent {

  // note
  editMode = false;
  noteStr = '';
  noteStrPrev = '';
  // password
  passwordShowMode = false;
  passwordEditMode = false;
  passwordStr = '';
  passwordStrPrev = '';

  onUpdateTag = new EventEmitter();

  constructor(public dialogRef: MatDialogRef<TagDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

      this.noteStr = this.data.note;
      this.noteStrPrev = this.noteStr;
      this.passwordStr = this.data.password;
      this.passwordStrPrev = this.passwordStr;
  }
   
  ngOnChanges(changes) {
    this.noteStr = changes.data.currentValue.note;
    this.passwordStr = changes.data.currentValue.password;
  }
  
  onDeleteTag(tag, dir) {
    //this.deleteTagEvent.emit({tag: tag, dir: dir});
    var cn = confirm('Do you want to delete tag: ' + tag + '?');
    if(cn){
      console.log('delete and close');
      this.dialogRef.close({type: 'delete', tag: tag, dir: dir});
    }
  }
  
  // note
  onNoteEnableEdit($event) {
    $event.preventDefault();
    this.editMode = true;
  }
  
  onNoteEditCancel($event) {
    $event.preventDefault();
    this.editMode = false;
    this.noteStr = this.noteStrPrev;
  }
  
  onNoteEditGo($event) {
    $event.preventDefault();
    this.editMode = false;
    if(this.noteStr !== this.data.note) {
      this.onUpdateTag.emit({tag: this.data.tag, type: 'note', noteStr: this.noteStr, noteStrPrev: this.data.note});
      this.noteStrPrev = this.noteStr;
    }
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
    this.passwordStr = this.passwordStrPrev;
  }

  onPasswordEditGo($event) {
    $event.preventDefault();
    this.passwordEditMode = false;
    if(this.passwordStr !== this.data.password) {
      this.onUpdateTag.emit({tag: this.data.tag, type: 'password', passwordStr: this.passwordStr, passwordStrPrev: this.data.password});
      this.passwordStrPrev = this.passwordStr;
    }
  }

}
