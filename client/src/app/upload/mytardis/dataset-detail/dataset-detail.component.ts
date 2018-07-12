import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';

import { AppService } from '../../../core/app.service';
import { Dataset, Datafile } from "../mytardis.model";
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-dataset-detail',
  templateUrl: './dataset-detail.component.html',
  styleUrls: ['./dataset-detail.component.css']
})
export class DatasetDetailComponent implements OnInit {
  
  connection;
  dataset: Dataset;
  datafiles: Datafile[];
  errMsg = '';
  detailId = -1;
  detailStr = '';
  
  totalItems = 0;
  nextStr = null;
  prevStr = null;
  pageIdx = 1;
  numPages = 1;

  constructor(private appService: AppService, private activeRoute: ActivatedRoute, 
              private location: Location, public authService: AuthService) { }

  ngOnInit() {
    //this.appService.setMenuIdx(3);
    
    this.connection = this.appService.onMessage().subscribe(msg => {
      if(msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'datafile') {
        console.log(msg.data);
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get datafile';
          return;
        }
        
        this.prevStr = msg.data.result.meta.previous;
        this.nextStr = msg.data.result.meta.next;
        this.totalItems = msg.data.result.meta.total_count;
        this.numPages = Math.floor((this.totalItems -1) / msg.data.result.meta.limit) + 1;
        
        const objects = msg.data.result.objects;
        if(objects) {
          this.datafiles = new Array();
          objects.forEach((entry) => {
            let datafile = new Datafile();
            datafile.id = entry.id;
            datafile.filename = entry.filename;
            datafile.mimetype = entry.mimetype;
            this.datafiles.push(datafile);
          });
        }
      }
      else if (msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'dataset_detail') {
        console.log(msg.data);
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get dataset detail';
          return;
        }
        let result = msg.data.result;
        this.dataset = new Dataset();
        this.dataset.id = result.id;
        this.dataset.description = result.description;
      }
      else if (msg.action === 'processmytardis' && msg.data.task === 'get_json' && msg.data.datatype === 'datafile_detail') {
        console.log(msg.data);
        if(msg.data.status === 'error') {
          this.errMsg = 'Cannot get dataset detail';
          return;
        }
        let result = msg.data.result;
        this.detailStr = '[size: ' + result.size + 'B, mimetype: ' + result.mimetype + ']';
      }
    });
    
    const mytardis = localStorage.getItem('currentMytardis');
    if(mytardis) {
      let info = JSON.parse(mytardis);
      console.log(info);
      const id = this.activeRoute.snapshot.params["id"];
      //get experiment detail
      let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'dataset_detail', 
                        host: info.host, path: '/api/v1/dataset/' + id + '/?format=json', apikey: info.apiKey} };
      console.log(msg);
      this.appService.sendMsg(msg);
      
      //get datasets
      msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'datafile', 
                        host: info.host, path: '/api/v1/dataset_file/?dataset__id=' + id + '&format=json', apikey: info.apiKey} };
      console.log(msg);
      this.appService.sendMsg(msg);
    }
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
  
  onBackClick($event) {
    $event.preventDefault();
    this.location.back();
  }
  
  onDetailClick($event, id) {
    $event.preventDefault();
    console.log(id);
    this.errMsg = '';
    this.detailId = id;
    this.detailStr = "Loading..."
  
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'datafile_detail', 
                        host: info.host, path: '/api/v1/dataset_file/' + id + '/?format=json', apikey: info.apiKey} };
    console.log(msg);
    this.appService.sendMsg(msg);
  }
  
  onRunClick($event, id, filename) {
    $event.preventDefault();
    
    this.errMsg = '';
    let dataType = localStorage.getItem('currentDatatype');
    let settings = JSON.parse(localStorage.getItem('settings'));
    
    //check filename
    let fileext = filename.split('.').pop().toLowerCase();
    if(dataType === 'volume') {
      if (fileext !== 'zip' && fileext !== 'tif' && fileext !== 'tiff') {
        this.errMsg = "Volume requires zip or tiff file!";
        return;
      }
    }
    else if (dataType === 'mesh') {
      if (fileext !== 'zip') {
        this.errMsg = "Volume requires zip file!";
        return;
      }
    }
    else if (dataType === 'point') {
      if (fileext !== 'las' && fileext !== 'laz' && fileext !== 'ptx' && fileext !== 'ply' && fileext !== 'xyz' && fileext !== 'txt' && fileext !== 'zip' ) {
        this.errMsg = "Pointcloud requies las/laz, ptx, ply, xyz/txt, or zip file";
        return;
      }
    }
    else if (dataType == "image") {
      if (fileext !== 'tif' && fileext !== 'tiff' && fileext !== 'jpg' && fileext !== 'png' && fileext !== 'zip') {
        this.errMsg = "Image(s) requies .tif, .png, .jpg, or .zip file";
        return;
      }
    }
    else {
      this.errMsg = "invalid dataType";
      return;
    }
    
    console.log(id);
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    console.log(dataType);
    this.appService.sendMsg({action: 'processupload', data: {task: "process", datatype: dataType, uploadtype: 'mytardis', 
                             fileid: id, filename: filename, auth: info,
                             userId: this.authService.userDetails.uid, userEmail: this.authService.userDetails.email, settings: settings } });
                             
    let x = document.querySelector("#processing_anchor");
    if (x){
        x.scrollIntoView();
    }
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'datafile', 
                        host: info.host, path: this.prevStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = localStorage.getItem('currentMytardis');
    let info = JSON.parse(mytardis);
    let msg = {action: 'processmytardis', 
                data: { task: 'get_json', datatype: 'datafile', 
                        host: info.host, path: this.nextStr, apikey: info.apiKey} };
    this.appService.sendMsg(msg);
    this.pageIdx = this.pageIdx + 1;
  }
  
}
