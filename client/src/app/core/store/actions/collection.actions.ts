import { Action } from "@ngrx/store";
import { ICollection } from "@app/core/models/collection.model";

export enum ECollectionActions {
  GetCollections = "[Collection] Get Collections",
  ReceiveCollections = "[Collection] Collection Tags",
  UpdateShareEmail = "[Collection] Update Share Email",
  UpdateShareEmailDone = "[Collection] Update Share Email Done",
  AddCollection = "[Collection] Add Collection",
  AddCollectionDone = "[Collection] Add Collection Done",
  UpdateCollection = "[Collection] Update Collection",
  UpdateCollectionDone = "[Collection] Update Collection Done",
  DeleteCollection = "[Collection] Delete Collection",
  DeleteCollectionDone = "[Collection] Delete Collection Done"
}

export class GetCollections implements Action {
  public readonly type = ECollectionActions.GetCollections;
  constructor(public payload: any) {}
}

export class ReceiveCollections implements Action {
  public readonly type = ECollectionActions.ReceiveCollections;
  constructor(public payload: any) {}
}

export class UpdateCollectionShareEmail implements Action {
  public readonly type = ECollectionActions.UpdateShareEmail;
  constructor(public payload: any) {}
}

export class UpdateCollectionShareEmailDone implements Action {
  public readonly type = ECollectionActions.UpdateShareEmailDone;
  constructor(public payload: any) {}
}

export class AddCollection implements Action {
  public readonly type = ECollectionActions.AddCollection;
  constructor(public payload: any) {}
}

export class AddCollectionDone implements Action {
  public readonly type = ECollectionActions.AddCollectionDone;
  constructor(public payload: any) {}
}

export class UpdateCollection implements Action {
  public readonly type = ECollectionActions.UpdateCollection;
  constructor(public payload: any) {}
}

export class UpdateCollectionDone implements Action {
  public readonly type = ECollectionActions.UpdateCollectionDone;
  constructor(public payload: any) {}
}

export class DeleteCollection implements Action {
  public readonly type = ECollectionActions.DeleteCollection;
  constructor(public payload: any) {}
}

export class DeleteCollectionDone implements Action {
  public readonly type = ECollectionActions.DeleteCollectionDone;
  constructor(public payload: any) {}
}

export type CollectionActions = GetCollections | ReceiveCollections | UpdateCollectionShareEmail | UpdateCollectionShareEmailDone |
                                AddCollection | AddCollectionDone | UpdateCollection | UpdateCollectionDone |
                                DeleteCollection | DeleteCollectionDone;
