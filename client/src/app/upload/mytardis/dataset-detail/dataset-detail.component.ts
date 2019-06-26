import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Location } from '@angular/common';

import { AppService } from '@app/core/services/app.service';
import { Dataset, Datafile } from "../mytardis.model";
import { AuthService } from '@app/core/services/auth.service';
import { SocketioService } from '../../../core/services/socketio.service';

@Component({
  selector: 'app-dataset-detail',
  templateUrl: './dataset-detail.component.html',
  styleUrls: ['./dataset-detail.component.css']
})
export class DatasetDetailComponent implements OnInit {
  
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

  constructor(private socket: SocketioService, private appService: AppService, private activeRoute: ActivatedRoute, 
              private location: Location, public authService: AuthService) { }

  ngOnInit() {
    //this.appService.setMenuIdx(3);

    var scope = this;
    scope.socket.processMytardisReceived$.subscribe((data: any)=>{
      if(data.datatype === 'datafile' && data.task === 'get_json') {
        //console.log('DatasetDetailComponent processMytardisReceived$', data);
        if(data.status === 'error') {
          scope.errMsg = 'Cannot get datafile';
          return;
        }

        this.prevStr = data.result.meta.previous;
        this.nextStr = data.result.meta.next;
        this.totalItems = data.result.meta.total_count;
        this.numPages = Math.floor((this.totalItems -1) / data.result.meta.limit) + 1;
        
        const objects = data.result.objects;
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
      else if(data.datatype === 'dataset_detail' && data.task === 'get_json') {
        if(data.status === 'error') {
          this.errMsg = 'Cannot get dataset detail';
          return;
        }
        let result = data.result;
        this.dataset = new Dataset();
        this.dataset.id = result.id;
        this.dataset.description = result.description;
      }
      else if(data.datatype === 'datafile_detail' && data.task === 'get_json') {
        if(data.status === 'error') {
          this.errMsg = 'Cannot get dataset detail';
          return;
        }
        let result = data.result;
        this.detailStr = '[size: ' + result.size + 'B, mimetype: ' + result.mimetype + ']';
      }

    });
    
    const mytardis = this.appService.mytardis;
    if(mytardis) {
      const id = this.activeRoute.snapshot.params["id"];
      //get experiment detail
      let msg = { task: 'get_json', datatype: 'dataset_detail', 
                        host: mytardis.host, path: '/api/v1/dataset/' + id + '/?format=json', apikey: mytardis.apiKey};
      this.socket.sendMessage('processmytardis', msg);
      
      //get datasets
      msg = { task: 'get_json', datatype: 'datafile', 
                        host: mytardis.host, path: '/api/v1/dataset_file/?dataset__id=' + id + '&format=json', apikey: mytardis.apiKey};
      this.socket.sendMessage('processmytardis', msg);
    }
  }
  
  onBackClick($event) {
    $event.preventDefault();
    this.location.back();
  }
  
  onDetailClick($event, id) {
    $event.preventDefault();
    this.errMsg = '';
    this.detailId = id;
    this.detailStr = "Loading..."
  
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'datafile_detail', 
                        host: mytardis.host, path: '/api/v1/dataset_file/' + id + '/?format=json', apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
  }
  
  onRunClick($event, id, filename) {
    $event.preventDefault();
    
    this.errMsg = '';
    let dataType = this.appService.dataType;
    let settings = this.appService.settings;
    
    //check filename
    let fileext = filename.split('.').pop().toLowerCase();
    if(dataType === 'volume') {
      if (fileext !== 'zip' && fileext !== 'tif' && fileext !== 'tiff' && fileext !== 'xrw') {
        this.errMsg = "Volume requires zip, tiff or xrw file!";
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
    
    const mytardis = this.appService.mytardis;
    const userDetails = {
      uid: this.authService.userDetails.uid,
      email: this.authService.userDetails.email,
      displayName: this.authService.userDetails.displayName
    };
    this.socket.sendMessage('processupload', {task: "process", datatype: dataType, uploadtype: 'mytardis', 
                             fileid: id, filename: filename, auth: mytardis, userDetails: userDetails, settings: settings });
                             
    let x = document.querySelector("#processing_anchor");
    if (x){
        x.scrollIntoView();
    }
  }
  
  onPrevClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'datafile', 
                        host: mytardis.host, path: this.prevStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx - 1;
  }
  
  onNextClick($event) {
    $event.preventDefault();
    const mytardis = this.appService.mytardis;
    let msg = { task: 'get_json', datatype: 'datafile', 
                        host: mytardis.host, path: this.nextStr, apikey: mytardis.apiKey};
    this.socket.sendMessage('processmytardis', msg);
    this.pageIdx = this.pageIdx + 1;
  }
  
}
