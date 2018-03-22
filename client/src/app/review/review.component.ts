import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { Dataset } from '../shared/dataset.model';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';


@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  constructor(private appService: AppService, private authService: AuthService) { }
  
  input_tag;
  dataset: Dataset = new Dataset();
  
  message = { type: "", content: "" };
  navPath = "review";

  ngOnInit() {
    this.appService.setMenuIdx(2);
    this.input_tag = '';
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processtag') {
        console.log(msg.data);
        if(msg.data.result === null) {
          this.message.type = 'error';
          this.message.content = 'tag is not available';
        }
        else {
          this.message.type = '';
          this.message.content = '';
        }
        this.dataset.parseResult(msg.data);
      }
    });
  }
  
  onGoClick($event) {
    $event.preventDefault();
    console.log('go clicked');
    this.appService.sendMsg({action: 'processtag', data: {tag: this.input_tag}});
  }

}
