import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { Dataset } from '../../models/dataset';


@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css']
})
export class ReviewComponent implements OnInit {

  constructor(private appService: AppService) { }
  
  input_tag;
  dataset: Dataset = new Dataset();
  
  message = { type: "", content: "" };

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
