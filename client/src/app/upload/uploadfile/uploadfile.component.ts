import { Component, OnInit, Input, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppService } from '../../core/app.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-uploadfile',
  templateUrl: './uploadfile.component.html',
  styleUrls: ['./uploadfile.component.css']
})
export class UploadfileComponent implements OnInit {

  constructor(private http: HttpClient, private renderer: Renderer2, 
              private appService: AppService, public authService: AuthService ) { }
  
  uploadPercent = 0;
  selectedFile = '';
  errMsg = '';
  
  @Input() dataType: string;
  @Input() settings;
  
  ngOnInit() {
  }
  
  onUploadFileClick(event) {
    console.log(event);
    const element = this.renderer.selectRootElement('.uploadfile');
    element.click();
  }
  
  onDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
  
  onDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    
    var files = event.dataTransfer.files; // FileList object.
    console.log(files);
    if (!files) {
      return;
    }
    this.uploadFileToProcess(files);
  }

  fileChange(event) {
    
    let files = event.srcElement.files
    console.log(files);
    if (!files) {
      return;
    }
    this.uploadFileToProcess(files);
  }
  
  uploadFileToProcess(files) {
    let path = `${environment.ws_url}/localupload`
    //let headers = new HttpHeaders().set('content-type', 'multipart/form-data');
    
    const formData: FormData = new FormData();
    
    let file = files[0];
    let fileext = file.name.split('.').pop().toLowerCase();
    
    this.errMsg = "";
    if(this.dataType === 'volume') {
      if (fileext !== 'zip' && fileext !== 'tif' && fileext !== 'tiff') {
        this.errMsg = "Volume requires zip or tiff file!";
        this.renderer.selectRootElement('.uploadfile').value = '';
        return;
      }
    }
    else if (this.dataType === 'mesh') {
      if (fileext !== 'zip') {
        this.errMsg = "Mesh requires zip file!";
        this.renderer.selectRootElement('.uploadfile').value = '';
        return;
      }
    }
    else if (this.dataType == "point") {
      if (fileext !== 'las' && fileext !== 'laz' && fileext !== 'ptx' && fileext !== 'ply' && fileext !== 'xyz' && fileext !== 'txt' && fileext !== 'zip' ) {
        this.errMsg = "Pointcloud requies las/laz, ptx, ply, xyz/txt, or zip file";
        this.renderer.selectRootElement('.uploadfile').value = '';
        return;
      }
    }
    else if (this.dataType == "image") {
      if (fileext !== 'tif' && fileext !== 'tiff' && fileext !== 'jpg' && fileext !== 'png' && fileext !== 'zip') {
        this.errMsg = "Image(s) requies .tif, .png, .jpg, or .zip file";
        this.renderer.selectRootElement('.uploadfile').value = '';
        return;
      }
    }
    
    formData.append('uploads', file, file.name);

    this.uploadPercent = 0;
    this.selectedFile = file.name + ' (size: ' + file.size + ')';

    const req = new HttpRequest('POST', path, formData, { reportProgress: true });
    
    this.http.request(req).subscribe((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.Sent:
          console.log('Request sent!');
          break;
        case HttpEventType.ResponseHeader:
          console.log('Response header received!');
          break;
        case HttpEventType.UploadProgress:
          this.uploadPercent = event.loaded / event.total * 100;
          break;
        case HttpEventType.Response:
          console.log('Done!', event.body);
          let result = event.body;
          if (result.status === 'error') {
            this.errMsg = result.detail;
            return;
          }
          this.renderer.selectRootElement('.uploadfile').value = '';
          this.appService.sendMsg({action: 'processupload', data: {task: "process", file: result.file, datatype: this.dataType, uploadtype: 'local',
                                                                    userId: this.authService.userDetails.uid, userEmail: this.authService.userDetails.email,
                                                                    settings: this.settings } });
          
          let x = document.querySelector("#processing_anchor");
          if (x){
              x.scrollIntoView();
          }
      }
    });
    
  }

}
