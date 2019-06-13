import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { log } from 'util';

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
  // collection
  collectionEditMode = false;
  collectionId = '';
  collectionIdPrev = '';
  collectionName = '';

  dataset = null;
  collections = null;

  onUpdateTag = new EventEmitter();
  needReloadCollections = new EventEmitter();

  constructor(public dialogRef: MatDialogRef<TagDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

      this.dataset = data.dataset;
      this.collections = data.collections;
      if(this.dataset.collection) {
        this.collectionId = this.dataset.collection;
        this.collectionName = this.findCollectionName(this.collectionId);
        this.collectionIdPrev = this.collectionId;
      }

      this.noteStr = this.dataset.note;
      this.noteStrPrev = this.noteStr;
      this.passwordStr = this.dataset.password;
      this.passwordStrPrev = this.passwordStr;
  }

  findCollectionName(id) {
    for(var i=0; i < this.collections.length; i++) {
      if(this.collections[i].id === id)
        return this.collections[i].name;
    }
    return '';
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
    if(this.noteStr !== this.dataset.note) {
      this.onUpdateTag.emit({tag: this.dataset.tag, type: 'note', noteStr: this.noteStr, noteStrPrev: this.dataset.note});
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
    if(this.passwordStr !== this.dataset.password) {
      this.onUpdateTag.emit({tag: this.dataset.tag, type: 'password', passwordStr: this.passwordStr, passwordStrPrev: this.dataset.password});
      this.passwordStrPrev = this.passwordStr;
    }
  }

  getImageContainerStyles(url) {
    let styles = {
      width: '100%', 
      height: '150px', 
      backgroundImage: 'url(' + url + ')', 
      overflow: 'hidden',  
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      paddingTop: 10, 
      marginBottom: 20
    };
    return styles;
  }

  onCollectionEnableEdit($event) {
    console.log('onCollectionEnableEdit');
    $event.preventDefault();
    this.collectionEditMode = true;
  }

  onCollectionRemove($event) {
    $event.preventDefault();
    console.log('onCollectionRemove', this.collectionIdPrev);
    this.onUpdateTag.emit({tag: this.dataset.tag, type: 'collection', collection: '', collectionPrev: this.collectionIdPrev });
    this.collectionIdPrev = '';
    this.collectionName = '';
  }

  onCollectionEditGo($event) {
    $event.preventDefault();
    console.log('onCollectionEditGo', this.collectionId, this.collectionIdPrev);
    this.collectionEditMode = false;
    if(this.collectionId  && this.collectionId !== this.dataset.collection) {
      this.onUpdateTag.emit({tag: this.dataset.tag, type: 'collection', collection: this.collectionId, collectionPrev: this.collectionIdPrev });
      this.collectionIdPrev = this.collectionId;
      this.collectionName = this.findCollectionName(this.collectionId);
      this.needReloadCollections.emit({});
    }
  }

  onCollectionEditCancel($event) {
    $event.preventDefault();
    this.collectionEditMode = false;
  }

}
