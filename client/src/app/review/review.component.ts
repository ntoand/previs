import { Component, OnInit, ViewChild } from '@angular/core';
import { AppService } from '../core/app.service';
import { Dataset } from '../shared/dataset.model';
import { Collection } from '../shared/collection.model';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';
import { TagDetailComponent } from './tag-detail/tag-detail.component';
import { CollectionComponent } from './collection/collection.component';

import { MatDialog } from '@angular/material';

import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { addListener } from 'cluste, eventNamesr';

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
  collectionId = 'my';
  showOptions = false;
  needReloadCollections = false;

  listView = true;
  displayedColumns: string[] = ['tag', 'type', 'dateStr', 'size', 'collection', 'hasPassword', 'note'];
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
    this.appService.sendMsg({action: 'admingetdatabundle', data: {userEmail: this.authService.userDetails.email, collection: 'my'}});
  }

  findCollectionName(id) {
    for(var i=0; i < this.collections.length; i++) {
      if(this.collections[i].id === id) {
        let name = this.collections[i].name;
        return (name.length>20)? name.slice(0, 20)+'..' : (name)
      } 
    }
    return '';
  }

  isComponentMessage(action) {
    if(action === 'admingetdatabundle' || action === 'admingettags' || action === 'admingetcollections' 
    || action === 'admindeletetags' || action === 'adminupdatetag' || action === 'adminupdatetagcollection')
      return true;
    return false;
  }

  getErrorMessage(action) {
    if(action === 'admingetdatabundle') return 'failed to get data bundle';
    if(action === 'admingettags') return 'faied to get tags';
    if(action === 'admingetcollections') return 'failed to get collections';
    if(action === 'admindeletetags') return 'failed to delete tag(s)';
    if(action === 'adminupdatetag' || action === 'adminupdatetagcollection') return 'failed to update tag';
    return '';
  }
  
  ngOnInit() {
    this.appService.setMenuIdx(2);
    
    this.resetCollections();

    var scope = this;

    this.connection = this.appService.onMessage().subscribe(msg => {

      if(!scope.isComponentMessage(msg.action)) return;

      console.log(msg.data);
      scope.message.type = '';
      scope.message.content = '';
      if(msg.data.status === 'error') {
        scope.message.type = 'error';
        scope.message.content = scope.getErrorMessage(msg.action);
        return;
      }

      if(msg.action === 'admingetdatabundle') {
        var tags = msg.data.result.tags;
        if(tags.length > 0) {
          scope.message.type = 'success';
          scope.message.content = 'Found ' + tags.length + ' tag(s)';
        }
        else {
          scope.message.type = 'warning';
          scope.message.content = 'No tags found!';
        }
        
        scope.datasets = [];
        for(var i=0; i < tags.length; i++) {
          var d = new Dataset();
          d.parseResultData(tags[i].data);
          scope.datasets.push(d);
        }
        scope.dataSource.data = scope.datasets;

        // tempt collections
        var collections = msg.data.result.collections;
        scope.resetCollections();
        for(var i=0; i < collections.length; i++) {
          var c = new Collection();
          c.parseResultData(collections[i].data);
          scope.collections.push(c);
        }
      }

      else if(msg.action === 'admingettags') {
        var tags = msg.data.result;
        if(tags.length > 0) {
          scope.message.type = 'success';
          scope.message.content = 'Found ' + tags.length + ' tag(s)';
        }
        else {
          scope.message.type = 'warning';
          scope.message.content = 'No tags found!';
        }
        
        scope.datasets = [];
        for(var i=0; i < tags.length; i++) {
          var d = new Dataset();
          d.parseResultData(tags[i].data);
          scope.datasets.push(d);
        }
        scope.dataSource.data = scope.datasets;
      }

      else if(msg.action === 'admingetcollections') {
        // tempt collections
        var collections = msg.data.result;
        scope.resetCollections();
        for(var i=0; i < collections.length; i++) {
          var c = new Collection();
          c.parseResultData(collections[i].data);
          scope.collections.push(c);
        }
        scope.message.type = 'success';
        scope.message.content = 'collections reloaded';
      }
      
      else if(msg.action === 'admindeletetags') {
        scope.loadData();
      }
      
      else if(msg.action === 'adminupdatetag' || msg.action === 'adminupdatetagcollection') {
        const tag = msg.data.result.tag;
        const note = msg.data.result.data.note || '';
        const password = msg.data.result.data.password || ''; 
        const collection = msg.data.result.data.collection || ''; 
        scope.message.type = 'success';
        scope.message.content = 'Updated tag ' + tag;
        scope.updateTagNote(tag, msg.data.type, note, password, collection);
      }
      
    });
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
  
  onLoadTags($event) {
    $event.preventDefault();
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
    else if($event.type === 'collection') {
      this.appService.sendMsg({action: 'adminupdatetagcollection', data: {tag: $event.tag, type: 'collection', collectionPrev: $event.collectionPrev, data: {collection: $event.collection}}});
    }
  }

  updateTagNote(tag, type, note, password, collection = '') {
    for(var i=0; i < this.datasets.length; i++) {
      if(this.datasets[i].tag === tag) {
        if(type === 'note') {
          this.datasets[i].note = note
        } 
        else if (type === 'password') {
          this.datasets[i].password = password;
          this.datasets[i].hasPassword = password !== '' ? 'yes' : 'no';
        }
        else if (type === 'collection') {
          this.datasets[i].collection = collection;
        }
        break;
      }
    }
  }
  
  resetCollections() {
    this.collections = [];
    this.collections.push(new Collection('my', '-- my tags --'));
    this.collections.push(new Collection('shared', '-- shared tags --'));
    this.collectionId = 'my';
  }

  toogleViewType() {
    this.listView = !this.listView;
  }

  onCollectionEdit() {
    var scope = this;
    var clone = this.collections.slice(0); clone.splice(0, 2);
    const dialogRef = this.dialog.open(CollectionComponent, {
      width: '600px',
      data: clone
    });

    dialogRef.componentInstance.needReloadCollections.subscribe((data) => {
      console.log('needReloadCollections.subscribe');
      scope.needReloadCollections = true;
    });

    dialogRef.afterClosed().subscribe( result => {
      if(scope.needReloadCollections) {
        scope.needReloadCollections = false;
        scope.appService.sendMsg({action: 'admingetcollections', data: {userEmail: scope.authService.userDetails.email}});
      }
    });
  }

  onDatasetClick(dataset) {
    var scope = this;
    var clone = this.collections.slice(0); clone.splice(0, 2);
    const dialogRef = this.dialog.open(TagDetailComponent, {
      width: '800px',
      data: {dataset: dataset, collections: clone}
    });

    dialogRef.componentInstance.onUpdateTag.subscribe((data) => {
      // do something
      console.log('Update tag', data);
      scope.updateTag(data);
    });

    dialogRef.componentInstance.needReloadCollections.subscribe((data) => {
      console.log('needReloadCollections.subscribe');
      scope.needReloadCollections = true;
    });
    
    dialogRef.afterClosed().subscribe(result => {
      console.log(result);
      if(result !== undefined && result.type === 'delete') {
        scope.deleteTag(result);
      }
      if(scope.needReloadCollections) {
        scope.needReloadCollections = false;
        scope.appService.sendMsg({action: 'admingetcollections', data: {userEmail: scope.authService.userDetails.email}});
      }
    });
  }

  onCollectionChange() {
    //console.log('onCollectionChange', this.collectionId);
    this.appService.sendMsg({action: 'admingettags', data: {userEmail: this.authService.userDetails.email, collection: this.collectionId}});
  }

}
