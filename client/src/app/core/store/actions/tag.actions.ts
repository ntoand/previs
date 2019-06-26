import { Action } from "@ngrx/store";
/**
* build enum for chat actions
*/
export enum ETagActions {
  GetTags = "[Tag] Get Tags",
  ReceiveTags = "[Tag] Receive Tags",
  SetCurrentTagId = "[Tag] Set Current Tag ID",
  UpdateTag = "[Tag] Update Tag",
  UpdateTagDone = "[Tag] Update Tag Done",
  UpdateTagCollection = "[Tag] Update Tag Collection",
  UpdateTagCollectionDone = "[Tag] Update Tag Collection Done",
  DeleteTags = "[Tag] Delete Tags",
  DeleteTagsDone = "[Tag] Delete Tags Done",
  UpdateShareEmail = "[Tag] Update Share Email",
  UpdateShareEmailDone = "[Tag] Update Share Email Done"
}

export class GetTags implements Action {
  public readonly type = ETagActions.GetTags;
  constructor(public payload: any) {}
}

export class ReceiveTags implements Action {
  public readonly type = ETagActions.ReceiveTags;
  constructor(public payload: any) {}
}

export class SetCurrentTagID implements Action {
  public readonly type = ETagActions.SetCurrentTagId;
  constructor(public payload: string) {}
}

export class UpdateTag implements Action {
  public readonly type = ETagActions.UpdateTag;
  constructor(public payload: any) {}
}
export class UpdateTagDone implements Action {
  public readonly type = ETagActions.UpdateTagDone;
  constructor(public payload: any) {}
}

export class UpdateTagCollection implements Action {
  public readonly type = ETagActions.UpdateTagCollection;
  constructor(public payload: any) {}
}
export class UpdateTagCollectionDone implements Action {
  public readonly type = ETagActions.UpdateTagCollectionDone;
  constructor(public payload: any) {}
}

export class DeleteTags implements Action {
  public readonly type = ETagActions.DeleteTags;
  constructor(public payload: any) {}
}
export class DeleteTagsDone implements Action {
  public readonly type = ETagActions.DeleteTagsDone;
  constructor(public payload: any) {}
}

export class UpdateTagShareEmail implements Action {
  public readonly type = ETagActions.UpdateShareEmail;
  constructor(public payload: any) {}
}
export class UpdateTagShareEmailDone implements Action {
  public readonly type = ETagActions.UpdateShareEmailDone;
  constructor(public payload: any) {}
}

export type TagActions = GetTags | ReceiveTags | SetCurrentTagID |
                        UpdateTag | UpdateTagDone | UpdateTagCollection | UpdateTagCollectionDone |
                        DeleteTags | DeleteTagsDone | UpdateTagShareEmail | UpdateTagShareEmailDone;
