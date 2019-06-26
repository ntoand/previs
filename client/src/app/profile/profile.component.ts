import { Component, OnInit } from '@angular/core';
import { AppService } from '@app/core/services/app.service';
import { AuthService } from '@app/core/services/auth.service';
import { SocketioService } from '@app/core/services/socketio.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  message = { type: "", content: "" };
  apikey = {
    key: '',
    date: ''
  };

  constructor(private socket: SocketioService, private appService: AppService, public authService: AuthService) { }

  ngOnInit() {
    var scope = this;
    scope.socket.apiKeyReceived$.subscribe((data: any)=>{
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

}
