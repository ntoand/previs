import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, select } from "@ngrx/store";
import { IAppState } from "../state/app.state";
import { SocketioService } from "@app/core/services/socketio.service";
import { map, tap, first, withLatestFrom } from "rxjs/operators";

import {
  CollectionActions,
  ECollectionActions,
  GetCollections, ReceiveCollections,
  UpdateCollectionShareEmail,
  AddCollection, AddCollectionDone,
  UpdateCollection, UpdateCollectionDone,
  DeleteCollection, DeleteCollectionDone
} from "../actions/collection.actions";

import {
  SetNotification
} from "../actions/notification.actions";

@Injectable()
export class CollectionEffects {
  constructor(private actions$: Actions<CollectionActions>, 
              private store: Store<IAppState>,
              private socket: SocketioService) {
  }

  @Effect({ dispatch: false })
  getCollections$ = this.actions$.pipe(
    ofType(ECollectionActions.GetCollections),
    map((action: GetCollections) => action.payload),
    tap(msg => this.socket.sendMessage("admingetcollections", msg))
  );

  @Effect({ dispatch: false })
  receiveCollection$ = this.actions$.pipe(
    ofType(ECollectionActions.ReceiveCollections),
    map((action: ReceiveCollections) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to load collections", for: "review"}));
    })
  );

  @Effect({ dispatch: false })
  updateCollectionShareEmail$ = this.actions$.pipe(
    ofType(ECollectionActions.UpdateShareEmail),
    map((action: UpdateCollectionShareEmail) => action.payload),
    tap(msg => this.socket.sendMessage("adminupdateshareemail", msg))
  );

  @Effect({ dispatch: false })
  updateCollectonDone$ = this.actions$.pipe(
    ofType(ECollectionActions.UpdateShareEmailDone),
    map((action) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to update collection", for: "review"}));
    })
  );

  // collection dialog
  @Effect({ dispatch: false })
  addCollection$ = this.actions$.pipe(
    ofType(ECollectionActions.AddCollection),
    map((action: AddCollection) => action.payload),
    tap(msg => this.socket.sendMessage("adminaddcollection", msg))
  );

  @Effect({ dispatch: false })
  addCollectionDone$ = this.actions$.pipe(
    ofType(ECollectionActions.AddCollectionDone),
    map((action: AddCollectionDone) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to add collection", for: "collection"}));
      else this.store.dispatch(new SetNotification({type: "success", content: "collection added", for: "collection"}));
    })
  );

  @Effect({ dispatch: false })
  updateCollection$ = this.actions$.pipe(
    ofType(ECollectionActions.UpdateCollection),
    map((action: UpdateCollection) => action.payload),
    tap(msg => this.socket.sendMessage("adminupdatecollection", msg))
  );

  @Effect({ dispatch: false })
  updateCollectionDone$ = this.actions$.pipe(
    ofType(ECollectionActions.UpdateCollectionDone),
    map((action: UpdateCollectionDone) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to update collection", for: "collection"}));
      else this.store.dispatch(new SetNotification({type: "success", content: "collection updated", for: "collection"}));
    })
  );

  @Effect({ dispatch: false })
  deleteCollection$ = this.actions$.pipe(
    ofType(ECollectionActions.DeleteCollection),
    map((action: DeleteCollection) => action.payload),
    tap(msg => this.socket.sendMessage("admindeletecollection", msg))
  );

  @Effect({ dispatch: false })
  deleteCollectionDone$ = this.actions$.pipe(
    ofType(ECollectionActions.DeleteCollectionDone),
    map((action: DeleteCollectionDone) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to delete collection", for: "collection"}));
      else this.store.dispatch(new SetNotification({type: "success", content: "collection deleted", for: "collection"}));
    })
  );

}
