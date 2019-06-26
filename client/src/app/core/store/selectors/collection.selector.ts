import { createSelector } from "@ngrx/store";

import { IAppState } from "@app/core/store/state/app.state";
import { ICollectionState } from "@app/core/store/state/collection.state";

const collectionState = (state: IAppState) => state.collection;

export const selectCollections = createSelector(
    collectionState,
    (state: ICollectionState) => state
);

