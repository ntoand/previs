import { environment } from '../../environments/environment';

export class Collection {
  id: string;
  name: string;
  
  constructor(id: string, name:string) { 
    this.clear();
    this.id = id;
    this.name = name;
  }
  
  clear() {
    this.id = '';
    this.name = '';
  }

  parseResult(data) {
    var result = data.result;
    if(data.status === 'done' && result) {
      this.parseResultData(result);
    }
    else {
      this.clear();
    }
  }
  
  parseResultData(result) {

  }
  
}