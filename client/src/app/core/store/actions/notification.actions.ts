import { Action } from "@ngrx/store";
import { INotification } from '@app/core/models/notification.model';

export enum ENotificationActions {
  SetNotification = "[Notification] Set Notification",
}

export class SetNotification implements Action {
  public readonly type = ENotificationActions.SetNotification;
  constructor(public payload: INotification) {}
}

export type NotificationActions = SetNotification;
