import { RouterReducerState } from "@ngrx/router-store";

import { ITagState, initialTagState } from "@app/core/store/state/tag.state";
import { ICollectionState, initialCollectionState } from "@app/core/store/state/collection.state";
import { INotificationState, initialNotificationState } from "@app/core/store/state/notification.state";
import { IUserState, initialUserState } from "@app/core/store/state/user.state";

export interface IAppState {
  router?: RouterReducerState;
  tag: ITagState;
  collection: ICollectionState;
  notification: INotificationState;
  user: IUserState;
}

export const initialAppState: IAppState = {
  tag: initialTagState,
  collection: initialCollectionState,
  notification: initialNotificationState,
  user: initialUserState
};

export function getInitialState(): IAppState {
  return initialAppState;
}
