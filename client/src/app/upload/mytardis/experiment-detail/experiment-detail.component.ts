import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';

import { AppService } from '@app/core/services/app.service';
import { Experiment, Dataset } from "../mytardis.model";
import { SocketioService } from '../../../core/services/socketio.service';

@Component({
  selector: 'app-experiment-detail',
  templateUrl: './experiment-detail.component.html',
  styleUrls: ['./experiment-detail.component.css']
})
export class ExperimentDetailComponent implements OnInit {

  experiment: Experiment;
  datasets: Dataset[];
  errMsg = '';
  
  totalItems = 0;
  nextStr = null;
  prevStr = null;
  pageIdx = 1;
  numPages = 1;

  subHandle = null;

  constructor(private socket: SocketioService, private appService: AppService, 
              private activeRoute: ActivatedRoute, private location: Location) { }

  ngOnInit() {
    
    //this.appService.setMenuIdx(3);
    var scope = this;
    this.subHandle = scope.socket.processMytardisReceived$.subscribe((data: any)=>{
      if(data.datatype === 'dataset' && data.task === 'get_json') {
        //console.log('ExperimentDetailComponent processMytardisReceived$', data);
        if(data.status === 'error') {
          scope.errMsg = 'Cannot get dataset';
          return;
        }

        scope.prevStr = data.result.meta.previous;
        scope.nextStr = data.result.meta.next;
        scope.totalItems = data.result.meta.total_count;
        scope.numPages = Math.floor((this.totalItems -1) / data.result.meta.limit) + 1;
        
        const objects = data.result.objects;
        if(objects) {
          scope.datasets = new Array();
          objects.forEach((entry) => {
            let dataset = new Dataset();
            dataset.id = entry.id;
            dataset.description = entry.description;
            scope.datasets.push(dataset);
          });
        }

      }
      else if (data.datatype === 'experiment_detail' && data.task === 'get_json') {
        //console.log('ExperimentDetailComponent processMytardisReceived$', data);
        if(data.status === 'error') {
          scope.errMsg = 'Cannot get experiment_detail';
          return;
        }

        let result = data.result;
        scope.experiment = new Experiment();
        scope.experiment.id = result.id;
        scope.experiment.title = result.title;
        scope.experiment.description = result.description;
        scope.experiment.created_time = result.created_time;
      }
    });
    
    const mytardis = this.appService.mytardis;
    if(mytardis) {
      const id = this.activeRoute.snapshot.params["id"];
      //get experiment detail
      let msg = { task: 'get_json', datatype: 'experiment_detail', 
                        host: mytardis.host, path: '/api/v1/experiment/' + id + '/?format=json', apikey: mytardis.apiKey};
      this.socket.sendMessage('processmytardis', msg);
      
      //get datasets
      msg = { task: 'get_json', datatype: 'dataset', 
                        host: mytardis.host, path: '/api/v1/dataset/?experiments__id=' + id + '&format=json', apikey: mytardis.apiKey};
      this.socket.sendMessage('processmytardis', msg);
    }
  }

  ngOnDestroy() {
    this.subHandle.unsubscribe()
  }
  
  onBackClick($event) {
    $event.preventDefault();
    this.location.back();
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'dataset', 
                        host: mytardis.host, path: this.prevStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'dataset', 
                        host: mytardis.host, path: this.nextStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx + 1;
  }

}
