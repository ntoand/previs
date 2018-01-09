import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';

import { AppService } from '../../../core/app.service';
import { Experiment, Dataset } from "../mytardis.model";

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

  constructor(private appService: AppService, private activeRoute: ActivatedRoute, private location: Location) { }

  ngOnInit() {
    
    //this.appService.setMenuIdx(3);
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'dataset') {
        console.log(msg.data);
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get dataset';
          return;
        }
        
        this.prevStr = msg.data.result.meta.previous;
        this.nextStr = msg.data.result.meta.next;
        this.totalItems = msg.data.result.meta.total_count;
        this.numPages = Math.floor((this.totalItems -1) / msg.data.result.meta.limit) + 1;
        
        const objects = msg.data.result.objects;
        if(objects) {
          this.datasets = new Array();
          objects.forEach((entry) => {
            let dataset = new Dataset();
            dataset.id = entry.id;
            dataset.description = entry.description;
            this.datasets.push(dataset);
          });
        }
      }
      else if (msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'experiment_detail') {
        console.log(msg.data);
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get experiment detail';
          return;
        }
        let result = msg.data.result;
        this.experiment = new Experiment();
        this.experiment.id = result.id;
        this.experiment.title = result.title;
        this.experiment.description = result.description;
        this.experiment.created_time = result.created_time;
      }
    });
    
    const mytardis = localStorage.getItem('currentMytardis');
    if(mytardis) {
      let info = JSON.parse(mytardis);
      console.log(info);
      const id = this.activeRoute.snapshot.params["id"];
      //get experiment detail
      let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'experiment_detail', 
                        host: info.host, path: '/api/v1/experiment/' + id + '/?format=json', apikey: info.apiKey} };
      console.log(msg);
      this.appService.sendMsg(msg);
      
      //get datasets
      msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'dataset', 
                        host: info.host, path: '/api/v1/dataset/?experiments__id=' + id + '&format=json', apikey: info.apiKey} };
      console.log(msg);
      this.appService.sendMsg(msg);
    }
  }
  
  onBackClick($event) {
    $event.preventDefault();
    this.location.back();
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'dataset', 
                        host: info.host, path: this.prevStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'dataset', 
                        host: info.host, path: this.nextStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx + 1;
  }

}
