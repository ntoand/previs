import { createSelector } from "@ngrx/store";

import { IAppState } from "@app/core/store/state/app.state";
import { IUserState } from "@app/core/store/state/user.state";

const userState = (state: IAppState) => state.user;

export const selectUser = createSelector(
    userState,
    (state: IUserState) => state
);
