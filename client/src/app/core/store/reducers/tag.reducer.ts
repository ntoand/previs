import { ETagActions, TagActions } from "@app/core/store/actions/tag.actions";
import { ITagState, initialTagState } from "@app/core/store/state/tag.state";
import { ITag } from "@app/core/models/tag.model";
import { environment } from "@env/environment";

function parseTag(data, loginEmail) {
  var tag = <any>{};
  tag.owner = data.userEmail === loginEmail ? 'yes' : 'no';
  tag.id = data.id || data.tag;
  tag.tag = data.tag;
  tag.dir = data.dir || data.tag;
  tag.type = data.type;
  tag.share = data.share || {};
  tag.size = data.volumes[0].res.toString();
  if(data.collection) tag.collection = data.collection;
  tag.disk = data.disk || 0;
  tag.hasThumbnail = data.hasThumbnail || false;
  tag.status = data.status || 'processed';
  
  let d = new Date(data.date);
  //tag.dateStr = d.toString();
  tag.dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  tag.qrUrl = environment.ws_url + '/qrcode/index.html?tag=' + data.tag;
  var subdir = data.volumes[0].subdir;
  if(!subdir) subdir = tag.type + '_result';
  var dirPath = 'data/tags/' + tag.dir + '/' + subdir + '/';
  
  if (tag.type === 'volume') {
    tag.imgUrl =  environment.ws_url + '/' + dirPath + 'vol_web_thumb.png?' + (new Date()).getTime();  
    tag.viewUrl = environment.ws_url + '/sharevol/index.html?tag=' + data.tag;
  } 
  else if (tag.type === 'mesh') {
    tag.imgUrl = tag.hasThumbnail === true ? environment.ws_url  + '/data/tags/' + tag.dir + '/thumbnail.png?' + (new Date()).getTime() 
                                            : 'assets/img/no-image-box.png';
    tag.viewUrl = environment.ws_url + '/meshviewer/?tag=' + data.tag;
    if(tag.size ==='0,0,0')
      tag.size = 'not available';
    else
      tag.size = tag.size + ' objects';
  }
  else if (tag.type === 'point') {
    tag.imgUrl = tag.hasThumbnail === true ? environment.ws_url + '/data/tags/' + tag.dir + '/thumbnail.png?' +(new Date()).getTime() 
                                          : 'assets/img/no-image-box.png';
    tag.viewUrl = environment.ws_url + '/pointviewer/?tag=' + data.tag;
    tag.size = tag.size + ' points';
  }
  else if (tag.type === 'image') {
    tag.imgUrl = environment.ws_url + '/' + dirPath + 'thumb.jpeg';
    tag.viewUrl = environment.ws_url + '/imageviewer?tag=' + data.tag;
    tag.size = tag.size + ' image(s)';
  }

  tag.note = (data.note !== undefined && data.note !== null) ? data.note : '';
  tag.password = (data.password !== undefined && data.password !== null) ? data.password : '';
  tag.hasPassword  = (tag.password !== '') ? 'yes' : 'no';
  
  return tag;
}

export function tagReducers (state = initialTagState, action: TagActions): ITagState {
  //console.log('tagReducers', action);
  switch (action.type) {
    case ETagActions.ReceiveTags: {
      if(action.payload.status === 'error') return state;
        
      var tags = action.payload.result.map( (item) => parseTag(item.data, action.payload.loginEmail));
      return {
        ...state,
        items: tags
      };
    }

    case ETagActions.SetCurrentTagId: {
      return {
        ...state,
        currTagId: action.payload
      }
    }

    case ETagActions.UpdateTagDone: 
    case ETagActions.UpdateTagCollectionDone: {
      if(action.payload.status === 'error') return state;

      let type = action.payload.type; // note, password, collection
      let items = state.items;
      for(var i=0; i < items.length; i++) {
        if(items[i].id === action.payload.result.tag) {
          if(type  === 'note') {
            items[i].note = action.payload.result.data.note;
          }
          else if(type === 'password') {
            items[i].password = action.payload.result.data.password;
            items[i].hasPassword = (items[i].password && items[i].password) !== '' ? 'yes' : 'no';
          }
          else if(type === 'collection') {
            items[i].collection = action.payload.result.data.collection;
          }
          break;
        }
      }
      return {
        ...state,
        items: items
      }
    }

    case ETagActions.UpdateShareEmail: {
      let tags = state.items;
      for(var i=0; i < tags.length; i++) {
        if(tags[i].id === action.payload.data.id) {
          tags[i].share[action.payload.data.email] = action.payload.data.action === 'add' ? 1 : 0;
          break;
        }
      }
      return {
        ...state,
        items: tags
      }
    }

    case ETagActions.DeleteTagsDone: {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.result.tags[0].tag),
      }
    }
    
    default:
      return state;
  }
};
