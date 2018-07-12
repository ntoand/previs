import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { Dataset } from '../shared/dataset.model';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';
import { TagDetailComponent } from './tag-detail/tag-detail.component';

import { MatDialog, MatDialogRef  } from '@angular/material';
import { ConfirmdialogComponent } from '../core/confirmdialog/confirmdialog.component';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  constructor(private appService: AppService, public authService: AuthService, 
              private dialog: MatDialog) { }
  
  connection; 
  message = { type: "", content: "" };
  navPath = "review";
  
  datasets: Dataset[] = [];
  noteStrPrev = '';
  
  ngOnInit() {
    this.appService.setMenuIdx(2);
    
    this.connection = this.appService.onMessage().subscribe(msg => {
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
        
        this.datasets = [];
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
      
      else if(msg.action === 'adminupdatetag') {
        console.log(msg.data);
        this.message.type = '';
        this.message.content = '';
        if(msg.data.status === 'error') {
          this.message.type = 'error';
          this.message.content = 'failed to update tag';
          this.updateTagNote(msg.data.result.tag, this.noteStrPrev);
          return;
        }
        const tag = msg.data.result.tag;
        const note = msg.data.result.data.note;
        this.updateTagNote(tag, note);
        this.message.type = 'success';
        this.message.content = 'Updated note for tag ' + tag;
      }
      
    });
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
  
  onLoadTags($event) {
    $event.preventDefault();
    console.log('load my tags clicked');
    this.datasets = [];
    this.message.type = 'working';
    this.message.content = 'Loading tags...';
    this.appService.sendMsg({action: 'processtag', data: {userEmail: this.authService.userDetails.email}});
  }
  
  onDeleteTag($event, childtag) {
    //console.log(childtag);
    const tag = $event;
    if(tag !== childtag)
      return;
  
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
  
  onUpdateTag($event, childtag) {
    //console.log(childtag);
    if($event.tag !== childtag)
      return;
      
    this.noteStrPrev = $event.noteStrPrev;
    this.appService.sendMsg({action: 'adminupdatetag', data: {tag: $event.tag, data: {note: $event.noteStr}}});
  }
  
  updateTagNote(tag, note) {
    for(var i=0; i < this.datasets.length; i++) {
      if(this.datasets[i].tag === tag) {
        this.datasets[i].note = note;
        break;
      }
    }
  }

}
