import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../core/app.service';
import { Dataset } from '../shared/dataset.model';
import { Collection } from '../shared/collection.model';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';
import { TagDetailComponent } from './tag-detail/tag-detail.component';

import { MatDialog } from '@angular/material';
import { ConfirmdialogComponent } from '../core/confirmdialog/confirmdialog.component';

import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { addListener } from 'cluster';

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
  collections: Collection[] = [];
  currCollection = new Collection('--all--', '-- all --');
  showOptions = false;

  listView = true;
  displayedColumns: string[] = ['tag', 'type', 'dateStr', 'size', 'hasPassword', 'note'];
  dataSource = new MatTableDataSource(this.datasets);

  private sort: MatSort;
  
  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.dataSource.sort = this.sort;
  }

  loadData() {
    this.datasets = [];
    this.message.type = 'working';
    this.message.content = 'Loading tags...';
    this.appService.sendMsg({action: 'processtag', data: {userEmail: this.authService.userDetails.email}});
  }
  
  ngOnInit() {
    this.appService.setMenuIdx(2);
    
    this.resetCollections();

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
        this.dataSource.data = this.datasets;

        // tempt collections
        this.resetCollections();
        this.collections.push(new Collection('aaaaaa', 'collection 1'));
        this.collections.push(new Collection('bbbbbb', 'collection 2'));
        console.log(this.collections);
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
        this.loadData();
      }
      
      else if(msg.action === 'adminupdatetag') {
        console.log(msg.data);
        this.message.type = '';
        this.message.content = '';
        if(msg.data.status === 'error') {
          this.message.type = 'error';
          this.message.content = 'failed to update tag';
          return;
        }
        const tag = msg.data.result.tag;
        const note = msg.data.result.data.note || '';
        const password = msg.data.result.data.password || ''; 
        this.message.type = 'success';
        this.message.content = 'Updated tag ' + tag;
        this.updateTagNote(tag, msg.data.type, note, password);
      }
      
    });
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
  
  onLoadTags($event) {
    $event.preventDefault();
    console.log('load my tags clicked');
    this.loadData();
    this.showOptions = true;
  }
  
  deleteTag($event) {
    const tag = $event.tag;
    const dir = $event.dir;
    
    console.log('delete ' + tag);
    this.appService.sendMsg({action: 'admindeletetags', data: {tags: [{tag:tag, dir: dir, userId: this.authService.userDetails.uid}]}});
  }
  
  updateTag($event) {
    if($event.type === 'note') {
      this.appService.sendMsg({action: 'adminupdatetag', data: {tag: $event.tag, type: 'note', data: {note: $event.noteStr}}});
    }
    else if($event.type === 'password') {
      this.appService.sendMsg({action: 'adminupdatetag', data: {tag: $event.tag, type: 'password', data: {password: $event.passwordStr}}});
    }
  }

  updateTagNote(tag, type, note, password) {
    for(var i=0; i < this.datasets.length; i++) {
      if(this.datasets[i].tag === tag) {
        if(type === 'note') {
          this.datasets[i].note = note
        } 
        else if (type == 'password') {
          this.datasets[i].password = password;
          this.datasets[i].hasPassword = password !== '' ? 'yes' : 'no';
        }
        break;
      }
    }
  }
  
  resetCollections() {
    this.collections = [];
    this.collections.push(new Collection('--all--', '-- all --'));
    this.collections.push(new Collection('--sharedtags--', '-- shared tags --'));
    this.currCollection = this.collections[0];
  }

  toogleViewType() {
    this.listView = !this.listView;
  }

  onCollectionMenuClick(collection) {
    this.currCollection = collection;
  }

  onDatasetClick(dataset) {
    console.log('onDatasetClick', dataset);
    const dialogRef = this.dialog.open(TagDetailComponent, {
      width: '800px',
      data: dataset
    });
    const sub = dialogRef.componentInstance.onUpdateTag.subscribe((data) => {
      // do something
      console.log('Update tag', data);
      this.updateTag(data);
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      if(result !== undefined && result.type === 'delete') {
        this.deleteTag(result);
      }
    });
  }

}
