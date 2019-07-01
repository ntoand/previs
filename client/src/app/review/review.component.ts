import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '@app/core/services/app.service';

import { AuthService } from '@app/core/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { TagDetailComponent } from './tag-detail/tag-detail.component';
import { CollectionComponent } from './collection/collection.component';

import { MatDialog } from '@angular/material';

import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// store
import { SocketioService } from '@app/core/services/socketio.service';
import { Store, select } from '@ngrx/store';
import { map, first } from 'rxjs/operators';
import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { ITag } from '../core/models/tag.model';
import { selectTags } from '@app/core/store/selectors/tag.selector';
import { GetTags, ReceiveTags, SetCurrentTagID, DeleteTags, DeleteTagsDone } from "@app/core/store/actions/tag.actions";
import { ICollection } from '../core/models/collection.model';
import { GetCollections, ReceiveCollections, UpdateCollectionShareEmail, UpdateCollectionShareEmailDone } from "@app/core/store/actions/collection.actions";
import { selectCollections } from '@app/core/store/selectors/collection.selector';
import { INotification } from '../core/models/notification.model';
import { selectNotification } from '@app/core/store/selectors/notification.selector';
import { SetNotification } from '@app/core/store/actions/notification.actions';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  constructor(private store: Store<IAppState>, private socket: SocketioService,
              private appService: AppService, public authService: AuthService, 
              private dialog: MatDialog) { }

  navPath = "review";
  subHandles: any[] = [];
  // store
  appstate$: Observable<IAppState>;
  // notificaiton
  notification: INotification;
  // tags
  tags: ITag[] = [];
  // collections
  collections: ICollection[] = [];
  optionCollections: ICollection[] = [];
  needReloadCollections = false;
  // table/list view
  displayedColumns: string[] = ['tag', 'type', 'dateStr', 'size', 'collection', 'hasPassword', 'note'];
  dataSource = new MatTableDataSource(this.tags);
  //sharing
  canShareCollection = false;
  showSharing = false;
  shareEmails = [];
  notifyPeople = false;
  addOnBlur = true;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  private sort: MatSort;
  
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.dataSource.sort = this.sort;
  }
  
  ngOnInit() {
    this.appService.setMenuIdx(2);

    // store
    var scope = this;
    scope.appstate$ = this.store;
    // notification
    var h1 = scope.appstate$.pipe(
      select(selectNotification),
      map(notification => notification.item)
    ).subscribe(item =>{
      scope.notification = item;
    });
    this.subHandles.push(h1);

    // tags
    var h2 = scope.appstate$.pipe(
      select(selectTags),
      map(tag => tag.items)
    ).subscribe(items =>{
      scope.tags = items;
      scope.dataSource.data = scope.tags;
    });
    this.subHandles.push(h2);

    // collections
    var h3 = scope.appstate$.pipe(
      select(selectCollections),
      map(collection => collection)
    ).subscribe(collection =>{
      scope.collections = collection.items;
      scope.optionCollections = collection.optionItems;
    });
    this.subHandles.push(h3);

    var h4 = scope.socket.tagsReceived$.subscribe((m: any)=>{
      m.loginEmail = scope.authService.userDetails.email;
      scope.store.dispatch(new ReceiveTags(m));
    });
    this.subHandles.push(h4);

    var h5 = scope.socket.collectionsReceived$.subscribe((m: any)=>{
      m.loginEmail = scope.authService.userDetails.email;
      scope.store.dispatch(new ReceiveCollections(m));
    });
    this.subHandles.push(h5);

    var h6 = scope.socket.updateShareEmailReceived$.subscribe((m: any)=>{
      if(m.result.for === 'collection') {
        scope.store.dispatch(new UpdateCollectionShareEmailDone(m));
      }
    });
    this.subHandles.push(h6);

    var h7 = scope.socket.deleteTagReceived$.subscribe((m: any)=>{
      scope.store.dispatch(new DeleteTagsDone(m));
      scope.store.dispatch(new GetCollections({userEmail: scope.authService.userDetails.email}));
    });
    this.subHandles.push(h7);

    scope.store.dispatch(new SetNotification({type: '', content: '', for: 'review'}));
    
    if(scope.appService.needReload) {
      scope.loadData();
      scope.appService.needReload = false;
    }
  }

  ngOnDestroy() {
    for(var i=0; i < this.subHandles.length; i++) {
      this.subHandles[i].unsubscribe();
    }
  }

  loadData() {
    this.store.dispatch(new SetNotification({type: 'working', content: 'loading tags...', for: 'review'}));
    this.store.dispatch(new GetTags({userEmail: this.authService.userDetails.email, collection: this.appService.collectionId}));
    this.store.dispatch(new GetCollections({userEmail: this.authService.userDetails.email}));
    this.appService.showOptions = true;
  }

  findCollectionName(id) {
    for(var i=0; i < this.collections.length; i++) {
      if(this.collections[i].id === id) {
        let name = this.collections[i].name;
        return (name.length>20)? name.slice(0, 20)+'..' : (name)
      } 
    }
    return '';
  }

  onLoadTags($event) {
    $event.preventDefault();
    this.loadData();
  }
  
  deleteTag($event) {
    const tag = $event.tag;
    const dir = $event.dir;
    this.store.dispatch(new SetNotification({type: 'working', content: 'deleting tag...', for: 'review'}));
    this.store.dispatch(new DeleteTags({tags: [{tag:tag, dir: dir, userId: this.authService.userDetails.uid}]}));
  }
  
  toogleViewType() {
    this.appService.listView = !this.appService.listView;
  }

  getMyCollections() {
    var scope = this;
    var myCollections = [];
    for(var i=0; i < scope.collections.length; i++) {
      if(scope.collections[i].owner === 'yes') {
        myCollections.push(scope.collections[i]);
      }
    }
    return myCollections;
  }

  onCollectionEdit() {
    var scope = this;
    var dialogRef = this.dialog.open(CollectionComponent, {
      width: '600px',
      data: scope.getMyCollections()
    });
    dialogRef.afterClosed().subscribe(data => {
      //
   });
  }

  onDatasetClick(dataset) {
    var scope = this;

    this.store.dispatch(new SetNotification({type: '', content: '', for: 'tagreview'}));
    scope.store.dispatch(new SetCurrentTagID(dataset.tag));

    var clone = this.collections.slice(0); clone.slice(0, 2);
    var dialogRef = this.dialog.open(TagDetailComponent, {
      width: '800px',
      data: {dataset: dataset, collections: clone}
    });

    dialogRef.componentInstance.needReloadCollections.subscribe((data) => {
      scope.needReloadCollections = true;
    });
    
    dialogRef.afterClosed().subscribe(result => {
      //console.log(result);
      if(result !== undefined && result.type === 'delete') {
        scope.deleteTag(result);
      }
      if(scope.needReloadCollections) {
        scope.needReloadCollections = false;
        setTimeout(function(){ 
          console.log('reload collections');
          scope.store.dispatch(new GetCollections({userEmail: scope.authService.userDetails.email}));
        }, 2000);
      }
    });
  }

  getShareEmails(share) {
    //console.log('getSharedEmails', share);
    var shareEmails = [];
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

  onCollectionChange() {
    var scope = this;
    let collections = scope.optionCollections;
    for(var i=0; i < collections.length; i++) {
      if(collections[i].id === scope.appService.collectionId) {
        if(collections[i].owner === 'yes') {
          scope.canShareCollection = true;
          scope.shareEmails = scope.getShareEmails(collections[i].share);
        }
        else {
          scope.canShareCollection = false;
          scope.showSharing = false;
          scope.shareEmails = [];
        }
        break;
      }
    }
    // get tags
    this.store.dispatch(new GetTags({userEmail: this.authService.userDetails.email, collection: scope.appService.collectionId}));
  }

  toogleCollectionSharing() {
    this.showSharing = !this.showSharing;
  }

  onRemoveShareEmail(email) {
    console.log('onRemoveShareEmail');
    var cn = confirm('Do you want to remove ' + email + ' from sharing?');
    var scope = this;
    if(cn){
      let data = {for: 'collection', action: 'remove', id: scope.appService.collectionId, 
                  email: email, notify: false, 
                  author: scope.authService.userDetails.displayName};
      this.store.dispatch(new UpdateCollectionShareEmail({data: data}));
      const index = scope.shareEmails.indexOf(email);
      if (index >= 0) {
        scope.shareEmails.splice(index, 1);
      }
    }
  }

  onAddShareEmail(event) {
    console.log('onAddShareEmail', this.shareEmails);
    var scope = this;
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.store.dispatch(new SetNotification({type: '', content: '', for: 'review'}));
      
      if(value.includes('@') && (value.includes('monash.edu') || value.includes('gmail.com'))) {
        // update share email
        var cn = confirm('Do you want this collection with ' + value + '?');
        if(cn) {
          let data = {for: 'collection', action: 'add', id: scope.appService.collectionId, 
                      email: value.trim(), notify: scope.notifyPeople, 
                      author: this.authService.userDetails.displayName};
          this.store.dispatch(new UpdateCollectionShareEmail({data: data}));
          scope.shareEmails.push(value.trim());
        }
      }
      else {
        this.store.dispatch(new SetNotification({type: 'error', content: 'support only monash/gmail', for: 'review'}));
      }
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
    
  }

}
