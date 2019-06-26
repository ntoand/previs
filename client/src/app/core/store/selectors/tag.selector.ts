import { createSelector } from "@ngrx/store";

import { IAppState } from "@app/core/store/state/app.state";
import { ITagState } from "@app/core/store/state/tag.state";

const tagState = (state: IAppState) => state.tag;

export const selectTags = createSelector(
    tagState,
    (state: ITagState) => state
);

export const selectCurrentTag = createSelector(
    tagState,
    (state: ITagState) => state.items.find( element => element.tag === state.currTagId )
);
