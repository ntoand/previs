import { ITag } from "@app/core/models/tag.model";

export interface ITagState {
    items: ITag[];
    currTagId: string;
}
export const initialTagState: ITagState = {
    items: [],
    currTagId: ''
};
