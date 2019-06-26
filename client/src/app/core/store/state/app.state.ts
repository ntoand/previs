import { RouterReducerState } from "@ngrx/router-store";

import { ITagState, initialTagState } from "@app/core/store/state/tag.state";
import { ICollectionState, initialCollectionState } from "@app/core/store/state/collection.state";
import { INotificationState, initialNotificationState } from "@app/core/store/state/notification.state";

export interface IAppState {
  router?: RouterReducerState;
  tag: ITagState;
  collection: ICollectionState;
  notification: INotificationState;
}

export const initialAppState: IAppState = {
  tag: initialTagState,
  collection: initialCollectionState,
  notification: initialNotificationState
};

export function getInitialState(): IAppState {
  return initialAppState;
}
