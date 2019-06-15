import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent {

  message = { type: "", content: "" };

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
  //sharing
  shareEmails = [];
  notifyPeople = false;
  addOnBlur = true;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  owner = false;
  
  dataset = null;
  collections = [];
  myCollections = [];

  onUpdateTag = new EventEmitter();
  needReloadCollections = new EventEmitter();
  updateShareEmail = new EventEmitter();

  constructor(public authService: AuthService, 
    public dialogRef: MatDialogRef<TagDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

      this.dataset = data.dataset;
      this.shareEmails = this.getShareEmails(this.dataset.share);
      this.collections = data.collections;
      this.owner = this.dataset.owner === 'yes';
      for(var i=0; i < this.collections.length; i++) {
        if(this.collections[i].owner === 'yes') {
          this.myCollections.push(this.collections[i]);
        }
      }
      if(this.dataset.collection) {
        this.collectionId = this.dataset.collection;
        this.collectionName = this.findCollectionName(this.collectionId, this.collections);
        this.collectionIdPrev = this.collectionId;
      }

      this.noteStr = this.dataset.note;
      this.noteStrPrev = this.noteStr;
      this.passwordStr = this.dataset.password;
      this.passwordStrPrev = this.passwordStr;
  }

  findCollectionName(id, collections = null) {
    console.log('findCollectionName', id, collections);
    if(!collections) collections = this.collections;
    for(var i=0; i < collections.length; i++) {
      if(collections[i].id === id)
        return collections[i].name;
    }
    return '';
  }

  getShareEmails(share) {
    var shareEmails = [];
    console.log('getSharedEmails', share);
    if(share) {
      var keys = Object.keys(share);
      console.log(keys);
      for(var i=0; i<keys.length; i++) {
        if(share[keys[i]] > 0) {
          shareEmails.push(keys[i]);
        }
      }
    }
    return shareEmails;
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

  onAddShareEmail(event) {
    console.log('onAddShareEmail', this.shareEmails);
    var scope = this;
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      scope.message.type = '';
      scope.message.content = '';

      if(value.includes('@') && (value.includes('monash.edu') || value.includes('gmail.com'))) {
        // update share email
        var cn = confirm('Do you want to share to ' + value + '?');
        if(cn) {
          scope.updateShareEmail.emit({for: 'tag', action: 'add', id: scope.dataset.tag, 
                                  email: value.trim(), notify: scope.notifyPeople, 
                                  author: this.authService.userDetails.displayName});
          scope.shareEmails.push(value.trim());
        }
      }
      else {
        scope.message.type = 'error';
        scope.message.content = 'support only monash/gmail';
      }
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  onRemoveShareEmail(email) {
    console.log('onRemoveShareEmail');
    var cn = confirm('Do you want to remove ' + email + ' from sharing?');
    if(cn){
      this.updateShareEmail.emit({for: 'tag', action: 'remove', id: this.dataset.tag, 
                              email: email, notify: false, 
                              author: this.authService.userDetails.displayName});
      const index = this.shareEmails.indexOf(email);
      if (index >= 0) {
        this.shareEmails.splice(index, 1);
      }
    }
  }

}
