import { environment } from '../../environments/environment';

export class Collection {
  owner: string;
  id: string;
  name: string;
  numtags: number;
  share: any;
  
  constructor(id: string = '', name: string = '') { 
    this.clear();
    this.id = id;
    this.name = name;
  }
  
  clear() {
    this.owner = '';
    this.id = '';
    this.name = '';
    this.numtags = 0;
    this.share = {};
  }

  parseResultData(result, userEmail) {
    this.owner = result.userEmail === userEmail ? 'yes' : 'no';
    this.id = result.id;
    this.name = result.name
    this.numtags = result.numtags;
    this.share = result.share;
  }
  
}