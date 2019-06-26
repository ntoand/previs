import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AppService } from '@app/core/services/app.service';
import { AuthService } from '@app/core/services/auth.service';

// store
import { SocketioService } from '@app/core/services/socketio.service';
import { Store, select } from '@ngrx/store';
import { map, first } from 'rxjs/operators';
import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { AddCollection, AddCollectionDone, UpdateCollection, UpdateCollectionDone,
         DeleteCollection, DeleteCollectionDone } from "@app/core/store/actions/collection.actions";
import { selectCollections } from '@app/core/store/selectors/collection.selector';
import { INotification } from '@app/core/models/notification.model';
import { selectNotification } from '@app/core/store/selectors/notification.selector';
import { SetNotification } from '@app/core/store/actions/notification.actions';
import { ICollection } from '../../core/models/collection.model';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent {

  // store
  appstate$: Observable<IAppState>;
  // notificaiton
  notification: INotification;

  collectionValue = ''; // to add new
  collections: ICollection[] = [];
  editCollectionID = ''; // to check if the item is in edit mode
  editStr = '';  // to store edit string

  needReloadCollections = new EventEmitter();

  constructor(private store: Store<IAppState>, private socket: SocketioService,
              private appService: AppService, public authService: AuthService, 
              public dialogRef: MatDialogRef<CollectionComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
    // store
    var scope = this;
    scope.appstate$ = this.store;
    // notification
    scope.appstate$.pipe(
      select(selectNotification),
      map(notification => notification.item)
    ).subscribe(item =>{
      scope.notification = item;
    });
    // collections
    scope.appstate$.pipe(
      select(selectCollections),
      map(collection => collection.items)
    ).subscribe(items =>{
      scope.collections = items.filter( item => item.owner === 'yes');
    });

    this.socket.addCollectionReceived$.subscribe((m: any)=>{
      this.store.dispatch(new AddCollectionDone(m));
    });

    this.socket.updateCollectionReceived$.subscribe((m: any)=>{
      this.store.dispatch(new UpdateCollectionDone(m));
    });

    this.socket.deleteCollectionReceived$.subscribe((m: any)=>{
      this.store.dispatch(new DeleteCollectionDone(m));
    });

    /*
    var scope = this;
    this.connection = this.appService.onMessage().subscribe(msg => {

      if(!scope.isComponentMessage(msg.action)) return;

      console.log(msg.data);
      scope.message.type = '';
      scope.message.content = '';
      if(msg.data.status === 'error') {
        scope.message.type = 'error';
        scope.message.content = scope.getErrorMessage(msg.action);
        return;
      }

      if(msg.action === 'adminaddcollection') {
        scope.collections.push(msg.data.result);
        scope.message.type = 'success';
        scope.message.content = 'Collection added';
      }

      else if (msg.action === 'adminupdatecollection') {
        for(var i=0; i < scope.collections.length; i++) {
          if(scope.collections[i].id === msg.data.result.id) {
            scope.collections[i].name = msg.data.result.name;
          }
        }
        scope.message.type = 'success';
        scope.message.content = 'Collection updated';
      }

      else if(msg.action === 'admindeletecollection') {
        var ind = 0;
        for(var i=0; i < scope.collections.length; i++) {
          if(scope.collections[i].id === msg.data.result.id) {
            ind = i;
            break;
          }
        }
        scope.collections.splice(ind, 1);
        scope.message.type = 'success';
        scope.message.content = 'Collection deleted';
      }

    });
    */
  }

  isComponentMessage(action) {
    if(action === 'adminaddcollection' || action === 'adminupdatecollection' || action === 'admindeletecollection')
      return true;
    return false;
  }

  getErrorMessage(action) {
    if(action === 'adminaddcollection') return 'failed to add collection';
    if(action === 'adminupdatecollection') return 'failed to update collection';
    if(action === 'admindeletecollection') return 'failed to delete collection';
  }

  onAddNewCollection(data) {
    if(this.collectionValue === '') return;
    console.log(data);
    const collection = {
      name: this.collectionValue,
      numtags: 0,
      userId: this.authService.userDetails.uid,
      userEmail: this.authService.userDetails.email 
    }
    this.store.dispatch(new AddCollection({data: collection}));
    this.needReloadCollections.emit({});
    this.collectionValue = '';
    this.editCollectionID = '';
  }

  onEditClick(data) {
    if(this.editCollectionID === '') {
      this.editCollectionID = data.id;
      this.editStr = data.name;
    }
  }

  onItemEditGo(data) {
    console.log('onItemEditGo', data);
    if(data.name !== this.editStr) {
      // update collection name
      const collection = {
        id: data.id,
        name: this.editStr,
      }
      this.store.dispatch(new UpdateCollection({data: collection}));
      this.needReloadCollections.emit({});
    }
    this.editCollectionID = '';
    this.editStr = '';
    this.collectionValue = '';
  }

  onItemEditCancel() {
    this.editCollectionID = '';
    this.editStr = '';
  }

  onDeleteClick(collection) {
    this.store.dispatch(new DeleteCollection({data: collection}));
    this.needReloadCollections.emit({});
  }

}
