import { ICollection } from "../../models/collection.model";

export interface ICollectionState {
    items: ICollection[];
    optionItems: ICollection[];
}
export const initialCollectionState: ICollectionState = {
    items: [],
    optionItems: []
};
