import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { Dataset } from '../shared/dataset.model';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';

import { MatDialog, MatDialogRef  } from '@angular/material';
import { ConfirmdialogComponent } from '../core/confirmdialog/confirmdialog.component';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  constructor(private appService: AppService, private authService: AuthService, 
              private dialog: MatDialog) { }
  
  message = { type: "", content: "" };
  navPath = "review";
  
  datasets: Dataset[] = [];
  
  ngOnInit() {
    this.appService.setMenuIdx(2);
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processtag') {
        console.log(msg.data);
        
        this.message.type = '';
        this.message.content = '';
        if(msg.data.status === 'error') {
          this.message.type = 'error';
          this.message.content = 'failed to get tags';
          return;
        }
        
        var tags = msg.data.result;
        if(tags.length > 0) {
          this.message.type = 'success';
          this.message.content = 'Found ' + tags.length + ' tag(s)';
        }
        else {
          this.message.type = 'warning';
          this.message.content = 'No tags found!';
        }
        
        for(var i=0; i < tags.length; i++) {
          var d = new Dataset();
          d.parseResultData(tags[i].data);
          this.datasets.push(d);
        }
      }
      
      else if(msg.action === 'admindeletetags') {
        console.log(msg.data);
        this.message.type = '';
        this.message.content = '';
        if(msg.data.status === 'error') {
          this.message.type = 'error';
          this.message.content = 'failed to delete tag';
          return;
        }
        this.datasets = [];
        this.message.type = 'working';
        this.message.content = 'Loading tags...';
        this.appService.sendMsg({action: 'processtag', data: {userEmail: this.authService.userDetails.email}});
      }
      
    });
  }
  
  onLoadTags($event) {
    $event.preventDefault();
    console.log('load my tags clicked');
    this.datasets = [];
    this.message.type = 'working';
    this.message.content = 'Loading tags...';
    this.appService.sendMsg({action: 'processtag', data: {userEmail: this.authService.userDetails.email}});
  }
  
  onDeleteTag(tag) {
    console.log('delete ' + tag);
    let dialogRef = this.dialog.open(ConfirmdialogComponent, {
      width: '300px',
      data: { title: "Delete tag " + tag }
    });

    dialogRef.afterClosed().subscribe(result => {
      
      if (result === true) {
          this.appService.sendMsg({action: 'admindeletetags', data: {tags: [{tag:tag, userId: this.authService.userDetails.uid}]}});
      }
      
    });
  }

}
