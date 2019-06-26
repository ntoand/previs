import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer } from '@ngrx/router-store';

import { IAppState } from "@app/core/store/state/app.state";

import { tagReducers } from '@app/core/store/reducers/tag.reducer';
import { collectionReducers } from '@app/core/store/reducers/collection.reducer';
import { notificationReducers } from '@app/core/store/reducers/notification.reducer';
//import { initStateFromLocalStorage } from './local-storage.reducer';

export const metaReducers: MetaReducer<IAppState>[] = [
  //initStateFromLocalStorage
];

export const appReducers: ActionReducerMap<IAppState, any> = {
  router: routerReducer,
  tag: tagReducers,
  collection: collectionReducers,
  notification: notificationReducers
};