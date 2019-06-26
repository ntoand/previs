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

  subHandles: any[] = [];
  // store
  appstate$: Observable<IAppState>;
  // notificaiton
  notification: INotification;

  collectionValue = ''; // to add new
  collections: ICollection[] = [];
  editCollectionID = ''; // to check if the item is in edit mode
  editStr = '';  // to store edit string

  constructor(private store: Store<IAppState>, private socket: SocketioService,
              public authService: AuthService, public dialogRef: MatDialogRef<CollectionComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
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

    // collections
    var h2 = scope.appstate$.pipe(
      select(selectCollections),
      map(collection => collection.items)
    ).subscribe(items =>{
      scope.collections = items.filter( item => item.owner === 'yes');
    });
    this.subHandles.push(h2);

    var h3 = this.socket.addCollectionReceived$.subscribe((m: any)=>{
      console.log('CollectionComponent addCollectionReceived$');
      this.store.dispatch(new AddCollectionDone(m));
    });
    this.subHandles.push(h3);

    var h4 = this.socket.updateCollectionReceived$.subscribe((m: any)=>{
      this.store.dispatch(new UpdateCollectionDone(m));
    });
    this.subHandles.push(h4);

    var h5 = this.socket.deleteCollectionReceived$.subscribe((m: any)=>{
      this.store.dispatch(new DeleteCollectionDone(m));
    });
    this.subHandles.push(h5);
  }

  ngOnDestroy() {
    for(var i=0; i < this.subHandles.length; i++) {
      this.subHandles[i].unsubscribe();
    }
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
  }

}
