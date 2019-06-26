import { ENotificationActions, NotificationActions } from "@app/core/store/actions/notification.actions";
import { INotificationState, initialNotificationState } from "@app/core/store/state/notification.state";

export function notificationReducers (state = initialNotificationState, action: NotificationActions): INotificationState {
    //console.log('notificationReducers', action);
    switch (action.type) {
      case ENotificationActions.SetNotification: {
        let payload = action.payload;
        return {
          ...state,
          item: payload
        };
      }
      
      default:
        return state;
    }
};