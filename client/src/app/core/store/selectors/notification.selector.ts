import { createSelector } from "@ngrx/store";

import { IAppState } from "@app/core/store/state/app.state";
import { INotificationState } from "@app/core/store/state/notification.state";

const notificationState = (state: IAppState) => state.notification;

export const selectNotification = createSelector(
    notificationState,
    (state: INotificationState) => state
);
