import { Component, OnInit } from '@angular/core';

import { AppService } from '../../../core/app.service';
import { Experiment } from "../mytardis.model";

@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.css']
})
export class ExperimentListComponent implements OnInit {
  
  experiments: Experiment[];
  errMsg = '';
  totalItems = 0;
  accessType = 'public';
  userId = '';
  nextStr = null;
  prevStr = null;
  pageIdx = 1;
  numPages = 1;

  constructor(private appService: AppService) { }

  ngOnInit() {
    
    //this.appService.setMenuIdx(3);
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'experiment') {
        console.log(msg.data);
        
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get experiment';
          return;
        }
        
        this.prevStr = msg.data.result.meta.previous;
        this.nextStr = msg.data.result.meta.next;
        if(this.accessType == 'public') {
          this.totalItems = msg.data.result.meta.total_count;
          this.numPages = Math.floor((this.totalItems -1) / msg.data.result.meta.limit) + 1;
        }
        else {
          this.totalItems = 0;
          this.numPages = 1;
        }
      
        const objects = msg.data.result.objects;
        if(objects) {
          this.experiments = new Array();
          objects.forEach((entry) => {
            let experiment = new Experiment();
            experiment.id = entry.id;
            experiment.title = entry.title;
            experiment.description = entry.description;
            experiment.created_time = entry.created_time;
            if(this.accessType == 'public') {
              this.experiments.push(experiment);
            }
            else {
              if(entry.owner_ids.indexOf(this.userId) !== -1 ) {
                this.experiments.push(experiment);
                this.totalItems = this.totalItems + 1;
              }
            }
            
          });
        }
      }
    });
    
    const mytardis = localStorage.getItem('currentMytardis');
    if(mytardis) {
      let info = JSON.parse(mytardis);
      console.log(info);
      let msg = {};
      if(info.accessType === 'public') {
        msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'experiment', 
                        host: info.host, path: '/api/v1/experiment/?format=json', apikey: info.apiKey} };
      }
      else {
        msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'experiment', 
                        host: info.host, path: '/api/v1/experiment/?format=json&limit=0', apikey: info.apiKey} };
        this.userId = info.userId;
      }
      console.log(msg);
      this.accessType = info.accessType;
      this.appService.sendMsg(msg);
    }
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'experiment', 
                        host: info.host, path: this.prevStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'experiment', 
                        host: info.host, path: this.nextStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx + 1;
  }

}
