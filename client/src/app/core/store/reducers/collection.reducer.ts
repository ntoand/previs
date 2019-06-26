import { ECollectionActions, CollectionActions } from "@app/core/store/actions/collection.actions";
import { ICollectionState, initialCollectionState } from "@app/core/store/state/collection.state";
import { ICollection } from "../../models/collection.model";

function parseCollection(data, loginEmail) {
  var collection = data;
  collection.owner = data.userEmail === loginEmail ? 'yes' : 'no';
  return collection;
}

export function collectionReducers (state = initialCollectionState, action: CollectionActions): ICollectionState {
  switch (action.type) {
    case ECollectionActions.ReceiveCollections: {
      var collections = action.payload.result.map( (item) => parseCollection(item.data, action.payload.loginEmail));
      const my: ICollection = {id: "my", name: "-- my tags --", owner: "", numtags: 0, share: {}};
      const share: ICollection = {id: "shared", name: "-- shared tags --", owner: "", numtags: 0, share: {}};
      return {
        ...state,
        items: collections,
        optionItems: [my, share, ...collections]
      };
    }

    case ECollectionActions.UpdateShareEmailDone: {
      let collections = state.items;
      const my: ICollection = {id: "my", name: "-- my tags --", owner: "", numtags: 0, share: {}};
      const share: ICollection = {id: "shared", name: "-- shared tags --", owner: "", numtags: 0, share: {}};
      for(var i=0; i < collections.length; i++) {
        if(collections[i].id === action.payload.result.id) {
          collections[i].share[action.payload.result.email] = action.payload.result.action === 'add' ? 1 : 0;
          break;
        }
      }
      return {
        ...state,
        items: collections,
        optionItems: [my, share, ...collections]
      }
    }

    case ECollectionActions.AddCollectionDone: {
      let c = action.payload.result;
      const collection: ICollection = {id: c.id, name: c.name, numtags: c.numtags, share: {}, owner: 'yes'};
      return {
        ...state,
        items: [collection, ...state.items],
        optionItems: [collection, ...state.optionItems]
      }
    }

    case ECollectionActions.UpdateCollectionDone: {
      let collections = state.items;
      const my: ICollection = {id: "my", name: "-- my tags --", owner: "", numtags: 0, share: {}};
      const share: ICollection = {id: "shared", name: "-- shared tags --", owner: "", numtags: 0, share: {}};
      for(var i=0; i < collections.length; i++) {
        if(collections[i].id === action.payload.result.id) {
          collections[i].name = action.payload.result.name;
          break;
        }
      }
      return {
        ...state,
        items: collections,
        optionItems: [my, share, ...collections]
      }
    }

    case ECollectionActions.DeleteCollectionDone: {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.result.id),
        optionItems: state.optionItems.filter(item => item.id !== action.payload.result.id)
      }
    }
    
    default:
      return state;
  }
};
