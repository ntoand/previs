import { Component, OnInit, Input } from '@angular/core';
import { AppService } from '../../core/app.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mytardis',
  templateUrl: './mytardis.component.html',
  styleUrls: ['./mytardis.component.css']
})
export class MytardisComponent implements OnInit {

  constructor(private appService: AppService, private router: Router, private activeRoute: ActivatedRoute) { }
  
  host = 'store.erc.monash.edu';
  accessType = 'public';
  apiKey = '';
  errMsg = '';
  loggedin = false;
  username = '';
  
  @Input() settings;

  ngOnInit() {
    //this.appService.setMenuIdx(3);
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'user') {
        console.log(msg.data);
        if(msg.data.status === 'error' || msg.data.result.meta.total_count === 0) {
          this.errMsg = 'Cannot find user, please check your api key';
          return;
        }
      
        const userId = msg.data.result.objects[0].id;
        localStorage.setItem('currentMytardis', 
                              JSON.stringify({host: this.host, accessType: this.accessType, apiKey: this.apiKey, userId: userId, settings: this.settings}));
        //this.router.navigate(['/mytardis/experiment']);
        this.router.navigate([{ outlets: { "auxMytardis": ["experiment"] }}], { relativeTo: this.activeRoute });
        this.loggedin = true;
        let parts = this.apiKey.split(':');
        this.username = parts[0];
      }
    });
    
    const mytardis = localStorage.getItem('currentMytardis');
    console.log(mytardis);
    if(mytardis) {
      let info = JSON.parse(mytardis);
      this.loggedin = true;
      this.host = info.host;
      this.accessType = info.accessType;
      this.apiKey = info.apiKey;
      if(this.apiKey !== '') {
        this.username = this.apiKey.split(":")[0];
      }
      else {
        this.username = 'anonymous';
      }
    }
    else {
      this.loggedin = false;
    }
    
  }
  
  onGoClick($event) {
    $event.preventDefault();
    this.errMsg = '';
    
    if(this.accessType == 'mydata') {
      if(this.apiKey === '') {
        this.errMsg = 'Please input your apikey in format name:key';
        return;
      }
      let parts = this.apiKey.split(':');
      if (parts.length !== 2) {
        this.errMsg = 'Please input your apikey in format name:key';
        return;
      }
      let username = parts[0];
      console.log(username);
      this.appService.sendMsg({action: 'processmytardis', 
                             data: { task: 'get_json', datatype: 'user', 
                                     host: this.host, path: '/api/v1/user/?format=json&username=' + username, apikey: this.apiKey} });

    }
    else {
      localStorage.setItem('currentMytardis', JSON.stringify({host: this.host, accessType: this.accessType, apiKey: ''}));
      //this.router.navigate(['/mytardis/experiment']);
      this.router.navigate([{ outlets: { "auxMytardis": ["experiment"] }}], { relativeTo: this.activeRoute });
      this.loggedin = true;
      this.username = 'anonymous';
    }
  }
  
  onLogout($event) {
    $event.preventDefault();
    this.errMsg = '';
    this.loggedin = false;
    console.log(this.loggedin);
    localStorage.removeItem('currentMytardis');
  }

}
