import { Component, OnInit } from '@angular/core';

import { AppService } from '@app/core/services/app.service';
import { Experiment } from "../mytardis.model";
import { SocketioService } from '@app/core/services/socketio.service';

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

  constructor(private socket: SocketioService, private appService: AppService) { }

  ngOnInit() {
    
    //this.appService.setMenuIdx(3);
    var scope = this;
    scope.socket.processMytardisReceived$.subscribe((data: any)=>{
      if(data.datatype === 'experiment' && data.task === 'get_json') {
        //console.log('ExperimentListComponent processMytardisReceived$', data);
        if(data.status === 'error') {
          scope.errMsg = 'Cannot get experiment';
          return;
        }

        scope.prevStr = data.result.meta.previous;
        scope.nextStr = data.result.meta.next;
        const mytardis = scope.appService.mytardis;
        if(mytardis.accessType == 'public') {
          scope.totalItems = data.result.meta.total_count;
          scope.numPages = Math.floor((scope.totalItems -1) / data.result.meta.limit) + 1;
        }
        else {
          scope.totalItems = 0;
          scope.numPages = 1;
        }
      
        const objects = data.result.objects;
        if(objects) {
          scope.experiments = new Array();
          objects.forEach((entry) => {
            let experiment = new Experiment();
            experiment.id = entry.id;
            experiment.title = entry.title;
            experiment.description = entry.description;
            experiment.created_time = entry.created_time;
            if(mytardis.accessType == 'public') {
              scope.experiments.push(experiment);
            }
            else {
              if(entry.owner_ids.indexOf(scope.userId) !== -1 ) {
                scope.experiments.push(experiment);
                scope.totalItems += 1;
              }
            }
          });
        }
      }
    });
    
    const mytardis = this.appService.mytardis;
    if(mytardis) {
      let msg = {};
      if(mytardis.accessType === 'public') {
        msg = { task: 'get_json', datatype: 'experiment', 
                host: mytardis.host, path: '/api/v1/experiment/?format=json', apikey: mytardis.apiKey};
      }
      else {
        msg = { task: 'get_json', datatype: 'experiment', 
                host: mytardis.host, path: '/api/v1/experiment/?format=json&limit=0', apikey: mytardis.apiKey};
        this.userId = mytardis.userId;
      }
      this.accessType = mytardis.accessType;
      this.socket.sendMessage('processmytardis', msg);
    }
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'experiment', 
                        host: mytardis.host, path: this.prevStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'experiment', 
                        host: mytardis.host, path: this.nextStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx + 1;
  }

}
