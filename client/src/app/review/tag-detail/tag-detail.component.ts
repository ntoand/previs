import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AuthService } from '@app/core/services/auth.service';

import { SocketioService } from '@app/core/services/socketio.service';
import { Store, select } from '@ngrx/store';
import { map, first } from 'rxjs/operators';
import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { ITag } from '../../core/models/tag.model';
import { selectCurrentTag } from '@app/core/store/selectors/tag.selector';
import { UpdateTag, UpdateTagDone, UpdateTagCollection, UpdateTagCollectionDone,
         UpdateTagShareEmail, UpdateTagShareEmailDone } from "@app/core/store/actions/tag.actions";
import { INotification } from '@app/core/models/notification.model';
import { selectNotification } from '@app/core/store/selectors/notification.selector';
import { SetNotification } from '@app/core/store/actions/notification.actions';

@Component({
  selector: 'app-tag-detail',
  templateUrl: './tag-detail.component.html',
  styleUrls: ['./tag-detail.component.css']
})
export class TagDetailComponent {

  message = { type: "", content: "" };

  // store
  appstate$: Observable<IAppState>;
  tag: ITag;
  // notificaiton
  notification: INotification;

  // note
  editMode = false;
  noteStr = '';
  // password
  passwordShowMode = false;
  passwordEditMode = false;
  passwordStr = '';
  // collection
  collectionEditMode = false;
  collectionId = '';
  collectionName = '';
  collectionIdPrev = '';
  //sharing
  shareEmails = [];
  notifyPeople = false;
  addOnBlur = true;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  owner = false;
  
  collections = [];
  myCollections = [];

  needReloadCollections = new EventEmitter();

  constructor(private store: Store<IAppState>, private socket: SocketioService,
              public authService: AuthService, public dialogRef: MatDialogRef<TagDetailComponent>,
  @Inject(MAT_DIALOG_DATA) public data: any) {

    this.collections = data.collections;
    for(var i=0; i < this.collections.length; i++) {
      if(this.collections[i].owner === 'yes') {
        this.myCollections.push(this.collections[i]);
      }
    }
  }

  ngOnInit() {
    var scope = this;
    scope.appstate$ = this.store;
    // notification
    scope.appstate$.pipe(
      select(selectNotification),
      map(notification => notification.item)
    ).subscribe(item =>{
      scope.notification = item;
    });
    // tag
    scope.appstate$.pipe(
      select(selectCurrentTag),
      map(item => item)
    ).subscribe(item =>{
      //console.log('selectCurrentTag', item);
      if(item) {
        scope.tag = item;
        scope.shareEmails = scope.getShareEmails(scope.tag.share);
        scope.owner = scope.tag.owner === 'yes';
        if(scope.tag.collection) {
          scope.collectionId = scope.tag.collection;
          scope.collectionIdPrev = scope.collectionId;
          scope.collectionName = scope.findCollectionName(scope.collectionId, scope.collections);
        }
        scope.noteStr = scope.tag.note;
        scope.passwordStr = scope.tag.password;
      }
    });

    // update
    scope.socket.updateTagReceived$.subscribe((m: any)=>{
      //console.log("updateTagReceived$", m);
      this.store.dispatch(new UpdateTagDone(m));
    });
    scope.socket.updateTagCollectionReceived$.subscribe((m: any)=>{
      //console.log("updateTagCollectionReceived$", m);
      this.store.dispatch(new UpdateTagCollectionDone(m));
    });

    this.socket.updateShareEmailReceived$.subscribe((m: any)=>{
      if(m.result.for === 'tag') {
        this.store.dispatch(new UpdateTagShareEmailDone(m));
      }
    });

  }

  findCollectionName(id, collections = null) {
    if(!collections) collections = this.collections;
    for(var i=0; i < collections.length; i++) {
      if(collections[i].id === id)
        return collections[i].name;
    }
    return '';
  }

  getShareEmails(share) {
    var shareEmails = [];
    //console.log('getSharedEmails', share);
    if(share) {
      var keys = Object.keys(share);
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
    this.noteStr = this.tag.note;
  }
  
  onNoteEditGo($event) {
    $event.preventDefault();
    this.editMode = false;
    if(this.noteStr !== this.tag.note) {
      this.store.dispatch(new UpdateTag({tag: this.tag.id, type: 'note', data: {note: this.noteStr}}));
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
    this.passwordStr = this.tag.password;
  }

  onPasswordEditGo($event) {
    $event.preventDefault();
    this.passwordEditMode = false;
    if(this.passwordStr !== this.tag.password) {
      this.store.dispatch(new UpdateTag({tag: this.tag.id, type: 'password', data: {password: this.passwordStr}}));
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
    //console.log('onCollectionEnableEdit');
    $event.preventDefault();
    this.collectionEditMode = true;
  }

  onCollectionRemove($event) {
    $event.preventDefault();
    this.store.dispatch(new UpdateTagCollection({tag: this.tag.id, type: 'collection', collectionPrev: this.collectionIdPrev, data: {collection: ''}}));
    this.collectionName = '';
    this.collectionIdPrev = '';
    this.needReloadCollections.emit({});
  }

  onCollectionEditGo($event) {
    $event.preventDefault();
    this.collectionEditMode = false;
    if(this.collectionId  && this.collectionId !== this.tag.collection) {
      this.store.dispatch(new UpdateTagCollection({tag: this.tag.id, type: 'collection', collectionPrev: this.collectionIdPrev, data: {collection: this.collectionId}}));
      this.collectionName = this.findCollectionName(this.collectionId);
      this.collectionIdPrev = this.collectionId;
      this.needReloadCollections.emit({});
    }
  }

  onCollectionEditCancel($event) {
    $event.preventDefault();
    this.collectionEditMode = false;
  }

  onAddShareEmail(event) {
    //console.log('onAddShareEmail', this.shareEmails);
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
          const data = {for: 'tag', action: 'add', id: scope.tag.id, 
          email: value.trim(), notify: scope.notifyPeople, 
          author: this.authService.userDetails.displayName};
          this.store.dispatch(new UpdateTagShareEmail({data: data}));
          scope.shareEmails.push(value.trim());
        }
      }
      else {
        this.store.dispatch(new SetNotification({type: 'error', content: 'support only monash/gmain', for: 'tagdetail'}));
      }
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  onRemoveShareEmail(email) {
    //console.log('onRemoveShareEmail');
    var cn = confirm('Do you want to remove ' + email + ' from sharing?');
    if(cn){
      const data = {for: 'tag', action: 'remove', id: this.tag.id, 
      email: email, notify: false, 
      author: this.authService.userDetails.displayName};
      this.store.dispatch(new UpdateTagShareEmail({data: data}));
      const index = this.shareEmails.indexOf(email);
      if (index >= 0) {
        this.shareEmails.splice(index, 1);
      }
    }
  }

}
