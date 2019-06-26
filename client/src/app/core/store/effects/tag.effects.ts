import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, select } from "@ngrx/store";
import { IAppState } from "../state/app.state";
import { SocketioService } from "@app/core/services/socketio.service";
import { map, tap, first, withLatestFrom } from "rxjs/operators";

import {
  TagActions,
  ETagActions,
  GetTags, ReceiveTags,
  UpdateTag,  UpdateTagCollection, 
  DeleteTags,  DeleteTagsDone, UpdateTagShareEmail
} from "../actions/tag.actions";

import {
  SetNotification
} from "../actions/notification.actions";

@Injectable()
export class TagEffects {
  constructor(private actions$: Actions<TagActions>, 
              private store: Store<IAppState>,
              private socket: SocketioService) {
  }

  @Effect({ dispatch: false })
  getTags$ = this.actions$.pipe(
    ofType(ETagActions.GetTags),
    map((action: GetTags) => action.payload),
    tap(msg => this.socket.sendMessage("admingettags", msg))
  );

  @Effect({ dispatch: false })
  receiveTags$ = this.actions$.pipe(
    ofType(ETagActions.ReceiveTags),
    map((action: ReceiveTags) => action.payload),
    tap((msg) => {
      //console.log("@Effect receiveTags$", msg);
      if(msg.status === 'error') {
        this.store.dispatch(new SetNotification({type: "error", content: "failed to load tags", for: "review"}));
      }
      else {
        (msg.result.length > 0) ? this.store.dispatch(new SetNotification({type: "success", content: msg.result.length + " tags loaded", for: "review"}))
                            : this.store.dispatch(new SetNotification({type: "warning", content: "no tags found", for: "review"}));
      }
      
    })
  );

  // update
  @Effect({ dispatch: false })
  updateTag$ = this.actions$.pipe(
    ofType(ETagActions.UpdateTag),
    map((action: UpdateTag) => action.payload),
    tap(msg => this.socket.sendMessage("adminupdatetag", msg))
  );

  @Effect({ dispatch: false })
  updateTagCollection$ = this.actions$.pipe(
    ofType(ETagActions.UpdateTagCollection),
    map((action: UpdateTagCollection) => action.payload),
    tap(msg => this.socket.sendMessage("adminupdatetagcollection", msg))
  );

  @Effect({ dispatch: false })
  updateTagShareEmail$ = this.actions$.pipe(
    ofType(ETagActions.UpdateShareEmail),
    map((action: UpdateTagShareEmail) => action.payload),
    tap(msg => this.socket.sendMessage("adminupdateshareemail", msg))
  );


  @Effect({ dispatch: false })
  updateTagDone$ = this.actions$.pipe(
    ofType(ETagActions.UpdateTagDone, ETagActions.UpdateTagCollectionDone, ETagActions.UpdateShareEmailDone),
    map((action) => action.payload),
    tap((msg) => {
      msg.status === 'done' ? this.store.dispatch(new SetNotification({type: "success", content: "tag updated", for: "tagdetail"}))
                            : this.store.dispatch(new SetNotification({type: "error", content: "failed to update tag", for: "tagdetail"}));
    })
  );

  // delete
  @Effect({ dispatch: false })
  deleteTags$ = this.actions$.pipe(
    ofType(ETagActions.DeleteTags),
    map((action: DeleteTags) => action.payload),
    tap(msg => this.socket.sendMessage("admindeletetags", msg))
  );

  @Effect({ dispatch: false })
  deleteTagsDone$ = this.actions$.pipe(
    ofType(ETagActions.DeleteTagsDone),
    map((action: DeleteTagsDone) => action.payload),
    tap((msg) => {
      msg.status === 'done' ? this.store.dispatch(new SetNotification({type: "success", content: "tag deleted", for: "review"}))
                            : this.store.dispatch(new SetNotification({type: "error", content: "failed to delete tag", for: "review"}));
    })
  );


}
