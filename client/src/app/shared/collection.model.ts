import { environment } from '../../environments/environment';

export class Collection {
  id: string;
  name: string;
  numtags: number;
  
  constructor(id: string = '', name: string = '') { 
    this.clear();
    this.id = id;
    this.name = name;
  }
  
  clear() {
    this.id = '';
    this.name = '';
    this.numtags = 0;
  }

  parseResultData(result) {
    this.id = result.id;
    this.name = result.name
    this.numtags = result.numtags;
  }
  
}