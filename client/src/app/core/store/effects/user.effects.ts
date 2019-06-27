import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store, select } from "@ngrx/store";
import { IAppState } from "../state/app.state";
import { SocketioService } from "@app/core/services/socketio.service";
import { map, tap, first, withLatestFrom } from "rxjs/operators";

import {
  UserActions,
  EUserActions,
  GetOrCreateUserDone
} from "../actions/user.actions";

import {
  SetNotification
} from "../actions/notification.actions";

@Injectable()
export class UserEffects {
  constructor(private actions$: Actions<UserActions>, 
              private store: Store<IAppState>,
              private socket: SocketioService) {
  }

  @Effect({ dispatch: false })
  getOrCreateUserDone$ = this.actions$.pipe(
    ofType(EUserActions.GetOrCreateUserDone),
    map((action: GetOrCreateUserDone) => action.payload),
    tap((msg) => {
      if(msg.status === 'error') this.store.dispatch(new SetNotification({type: "error", content: "failed to load user", for: "user"}));
    })
  );

}
