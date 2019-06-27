import { IUser } from "@app/core/models/user.model";

export interface IUserState {
    item: IUser;
    loaded: boolean;
}

export const initialUserState: IUserState = {
    item: null,
    loaded: false
};
