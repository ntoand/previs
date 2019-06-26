import { INotification } from "@app/core/models/notification.model";

export interface INotificationState {
    item: INotification;
}
export const initialNotificationState: INotificationState = {
    item: {
        type: '',
        content: '',
        for: ''
    }
};
