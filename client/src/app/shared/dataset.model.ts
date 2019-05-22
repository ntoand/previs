import { environment } from '../../environments/environment';

export class Dataset {
  tag: string;
  dir: string;
  type: string;
  size: string;
  dateStr: string;
  imgUrl: string;
  viewUrl: string;
  qrUrl: string;
  note: string;
  password: string;
  
  constructor() { 
    this.clear();
  }
  
  clear() {
    this.tag = '';
    this.dir = '';
    this.type = '';
    this.dateStr = '';
    this.size = '';
    this.imgUrl = '';
    this.viewUrl = '';
    this.qrUrl = '';
    this.note = '';
    this.password = '';
  }

  parseResult(data) {
    //console.log('parseResult');
    //console.log(data);
    var result = data.result;
    if(data.status === 'done' && result) {
      this.parseResultData(result);
    }
    else {
      this.clear();
    }
  }
  
  parseResultData(result) {
    //console.log('parseResultData');
    //console.log(result);
   
    this.tag = result.tag;
    this.dir = result.dir || result.tag;
    this.type = result.type;
    this.size = result.volumes[0].res.toString();
    
    let d = new Date(result.date);
    //this.dateStr = d.toString();
    this.dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    this.qrUrl = environment.ws_url + '/qrcode/index.html?tag=' + result.tag;
    var subdir = result.volumes[0].subdir;
    if(!subdir) subdir = this.type + '_result';
    var dirPath = 'data/tags/' + this.dir + '/' + subdir + '/';
    
    if (this.type === 'volume') {
      this.imgUrl =  environment.ws_url + '/' + dirPath + 'vol_web_thumb.png';  
      this.viewUrl = environment.ws_url + '/sharevol/index.html?tag=' + result.tag;
    } 
    else if (this.type === 'mesh') {
      this.imgUrl = 'assets/img/no-image-box.png';
      this.viewUrl = environment.ws_url + '/meshviewer/?tag=' + result.tag;
      if(this.size ==='0,0,0')
        this.size = 'not available';
      else
        this.size = this.size + ' objects';
    }
    else if (this.type === 'point') {
      this.imgUrl = 'assets/img/no-image-box.png';
      this.viewUrl = environment.ws_url + '/pointviewer/?tag=' + result.tag;
      this.size = this.size + ' points';
    }
    else if (this.type === 'image') {
      this.imgUrl = environment.ws_url + '/' + dirPath + 'thumb.jpeg';
      this.viewUrl = environment.ws_url + '/imageviewer?tag=' + result.tag;
      this.size = this.size + ' image(s)';
    }
    
    if(result.note !== undefined && result.note !== null)
      this.note = result.note;
    else
      this.note = '';

    if(result.password !== undefined && result.password !== null)
      this.password = result.password;
    else
      this.password = '';
    
  }
  
}