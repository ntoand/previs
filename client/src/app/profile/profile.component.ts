import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';
import { SocketioService } from '@app/core/services/socketio.service';
import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { selectUser } from '@app/core/store/selectors/user.selector';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  subHandles: any[] = [];
  message = { type: "", content: "" };
  apikey = {
    key: '',
    date: ''
  };

  // store
  appstate$: Observable<IAppState>;
  user = null;
  // edit
  mytardisApikeyStr = '';
  mytardisApikeyEditMode = false;

  constructor(private store: Store<IAppState>,
              private socket: SocketioService, public authService: AuthService) { }

  ngOnInit() {
    var scope = this;
    scope.appstate$ = this.store;

    // user
    var h1 = scope.appstate$.pipe(
      select(selectUser),
      map(user => user)
    ).subscribe(user =>{
      scope.user = user;
      if(user.item) scope.mytardisApikeyStr = user.item.mytardisApikey;
    });
    this.subHandles.push(h1);

    var h2 = scope.socket.apiKeyReceived$.subscribe((data: any)=>{
      this.message.type = '';
      this.message.content = '';
      if(data.status === 'error') {
        this.message.type = 'error';
        this.message.content = 'failed to get api key';
        return;
      }
      
      let result = data.result;
      this.apikey.key = result.key;
      this.apikey.date = '';
      if(result.date !== '') {
        var d = new Date(result.date);
        this.apikey.date = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
      }
    });
    this.subHandles.push(h2);
  }

  ngOnDestroy() {
    for(var i=0; i < this.subHandles.length; i++) {
      this.subHandles[i].unsubscribe();
    }
  }

  onRefresh($event) {
    // update user profile
    $event.preventDefault();
    const user = this.authService.userDetails;
    this.socket.sendMessage("admingetorcreateuser", {data: {id: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL}});
  }
  
  onLoadKey($event) {
    $event.preventDefault();
    this.message.type = 'working';
    this.message.content = 'Loading key...';
    const userDetails = {
      uid: this.authService.userDetails.uid,
      email: this.authService.userDetails.email,
      displayName: this.authService.userDetails.displayName
    };
    this.socket.sendMessage('processapikey', {type: 'load', userDetails: userDetails});
  }
  
  onGenerateKey($event) {
    $event.preventDefault();
    this.message.type = 'working';
    this.message.content = 'Generating new key...';
    const userDetails = {
      uid: this.authService.userDetails.uid,
      email: this.authService.userDetails.email,
      displayName: this.authService.userDetails.displayName
    };
    this.socket.sendMessage('processapikey', {type: 'generate', userDetails: userDetails});
  }

  onCopyToClipboard($event) {
    if(this.apikey.key === '' || this.apikey.key.includes('not available')) return;
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.apikey.key;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  onMytardisApikeyEnableEdit($event) {
    $event.preventDefault();
    this.mytardisApikeyEditMode = true;
  }

  onMytardisApikeyEditCancel($event) {
    $event.preventDefault();
    this.mytardisApikeyEditMode = false;
  }

  onMytardisApikeyEditGo($event) {
    $event.preventDefault();
    if(this.mytardisApikeyStr.trim().length === 0) {
      this.message.type = 'error';
      this.message.content = 'Empty api key';
      return;
    }
    this.socket.sendMessage('adminupdateuser', {data: {id: this.authService.userDetails.uid, mytardisApikey: this.mytardisApikeyStr}});
    this.mytardisApikeyEditMode = false;
  }

}
