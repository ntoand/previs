import { Action } from "@ngrx/store";

export enum EUserActions {
  GetOrCreateUserDone = "[User] Get or Create User Done"
}

export class GetOrCreateUserDone implements Action {
    public readonly type = EUserActions.GetOrCreateUserDone;
    constructor(public payload: any) {}
  }

export type UserActions = GetOrCreateUserDone;
