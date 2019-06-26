import { Component, OnInit, Input } from '@angular/core';
import { AppService } from '@app/core/services/app.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketioService } from '@app/core/services/socketio.service';

@Component({
  selector: 'app-mytardis',
  templateUrl: './mytardis.component.html',
  styleUrls: ['./mytardis.component.css']
})
export class MytardisComponent implements OnInit {

  constructor(private socket: SocketioService, private appService: AppService, 
              private router: Router, private activeRoute: ActivatedRoute) { }
  
  errMsg = '';
  loggedin = false;
  username = '';

  subHandle = null;
  
  ngOnInit() {
    //this.appService.setMenuIdx(3);
    var scope = this;
    this.subHandle = scope.socket.processMytardisReceived$.subscribe((data: any)=>{
      //console.log('MytardisComponent processMytardisReceived$', data);
      if(data.task === 'get_json' && data.datatype === 'user') {
        if(data.status === 'error' || data.result.meta.total_count === 0) {
          this.errMsg = 'Cannot find user, please check your api key';
          return;
        }
        const userId = data.result.objects[0].id;
        const mytardis = this.appService.mytardis;
        scope.appService.mytardis = {host: mytardis.host, accessType: mytardis.accessType, apiKey: mytardis.apiKey, userId: userId};
        scope.router.navigate([{ outlets: { "auxMytardis": ["experiment"] }}], { relativeTo: scope.activeRoute });
        scope.loggedin = true;
        let parts = mytardis.apiKey.split(':');
        scope.username = parts[0];
      }
    });
  
    if(scope.appService.mytardis.apiKey !== '') {
      this.username = scope.appService.mytardis.apiKey.split(":")[0];
    }
    else {
      this.username = 'anonymous';
    }
    
  }

  ngOnDestroy() {
    this.subHandle.unsubscribe()
  }
  
  onGoClick($event) {
    $event.preventDefault();
    this.errMsg = '';
    var scope = this;
    
    const mytardis = this.appService.mytardis;
    if(mytardis.accessType == 'mydata') {
      if(mytardis.apiKey === '') {
        scope.errMsg = 'Please input your apikey in format name:key';
        return;
      }
      let parts = mytardis.apiKey.split(':');
      if (parts.length !== 2) {
        scope.errMsg = 'Please input your apikey in format name:key';
        return;
      }
      let username = parts[0];
      console.log(username);
      scope.socket.sendMessage('processmytardis', { task: 'get_json', datatype: 'user', 
                                host: mytardis.host, path: '/api/v1/user/?format=json&username=' + username, apikey: mytardis.apiKey});

    }
    else {
      const mytardis = this.appService.mytardis;
      this.appService.mytardis = {host: mytardis.host, accessType: mytardis.accessType, apiKey: '', userId: ''};
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
  }

}
