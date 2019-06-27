import { EUserActions, UserActions } from "@app/core/store/actions/user.actions";
import { IUserState, initialUserState } from "@app/core/store/state/user.state";

export function userReducers (state = initialUserState, action: UserActions): IUserState {
    //console.log('notificationReducers', action);
    switch (action.type) {
      case EUserActions.GetOrCreateUserDone: {
        let payload = action.payload;
        let result = payload.result;
        if(payload.status === 'error') {
            return state;
        }
        let disk = result.disk || 0;
        const user = {
            id: result.id,
            name: result.name,
            email: result.email,
            displayName: result.displayName,
            photoURL: result.photoURL,
            active: result.active || true,
            numtags: result.numtags || 0,
            disk: disk,
            quota: result.quota || 0,
            diskStr: disk < 1024 ? disk.toFixed(2)+' MB' : (disk/1024).toFixed(2)+' GB'
        }
        return {
          ...state,
          item: user,
          loaded: true
        };
      }
      
      default:
        return state;
    }
};