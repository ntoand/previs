import { Injectable } from '@angular/core';
import { ITag } from '../models/tag.model';
import { environment } from '@env/environment';

@Injectable()
export class AppService {
  
  // ===== MENU =====
  private menuidx;

  getMenuIdx(): number {
    return this.menuidx;
  }

  setMenuIdx(id: number) {
    this.menuidx = id;
  }

  // ===== UPLOAD =====
  public dataType: string = "none";
  public uploadType: string = "local";
  public settings = {
    voxelSizeX: 1,
    voxelSizeY: 1,
    voxelSizeZ: 1,
    channel: 0,
    time: 0,
    sendEmail: false,
  };
  public mytardis = {
    host: 'store.erc.monash.edu',
    accessType: 'public',
    apiKey: '',
    userId: ''
  }
  
  // ===== REVIEW =====
  public loaded = false;
  public listView = false;
  public needReload = false;
  public showOptions = false;
  public collectionId = 'my';

  // ==== UTILS ====
  public parseTagFromResult(result, userEmail) {
    //console.log('parseResultData');
    //console.log(result);
    var tag = {} as ITag;
    tag.owner = result.userEmail === userEmail ? 'yes' : 'no';
    tag.id = result.id || result.tag;
    tag.tag = result.tag;
    tag.dir = result.dir || result.tag;
    tag.type = result.type;
    tag.share = result.share;
    tag.size = result.volumes[0].res.toString();
    if(result.collection) tag.collection = result.collection;
    
    let d = new Date(result.date);
    //this.dateStr = d.toString();
    tag.dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    tag.qrUrl = environment.ws_url + '/qrcode/index.html?tag=' + result.tag;
    var subdir = result.volumes[0].subdir;
    if(!subdir) subdir = tag.type + '_result';
    var dirPath = 'data/tags/' + tag.dir + '/' + subdir + '/';
    
    if (tag.type === 'volume') {
      tag.imgUrl =  environment.ws_url + '/' + dirPath + 'vol_web_thumb.png';  
      tag.viewUrl = environment.ws_url + '/sharevol/index.html?tag=' + result.tag;
    } 
    else if (tag.type === 'mesh') {
      tag.imgUrl = 'assets/img/no-image-box.png';
      tag.viewUrl = environment.ws_url + '/meshviewer/?tag=' + result.tag;
      tag.size = tag.size ==='0,0,0' ? 'not available' : tag.size + ' objects';
    }
    else if (tag.type === 'point') {
      tag.imgUrl = 'assets/img/no-image-box.png';
      tag.viewUrl = environment.ws_url + '/pointviewer/?tag=' + result.tag;
      tag.size += ' points';
    }
    else if (tag.type === 'image') {
      tag.imgUrl = environment.ws_url + '/' + dirPath + 'thumb.jpeg';
      tag.viewUrl = environment.ws_url + '/imageviewer?tag=' + result.tag;
      tag.size += ' image(s)';
    }
    
    tag.note = (result.note !== undefined && result.note !== null) ? result.note : '';
    tag.password = (result.password !== undefined && result.password !== null) ? result.password : '';
    if(tag.password !== '') tag.hasPassword = 'yes';

    return tag;
  }

}
