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
import { COMMA, ENTER } from '@angular/cdk/keycodes';

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

  listView = false;
  displayedColumns: string[] = ['tag', 'type', 'dateStr', 'size', 'collection', 'hasPassword', 'note'];
  dataSource = new MatTableDataSource(this.datasets);

  //sharing
  canShareCollection = false;
  showSharing = false;
  shareEmails = [];
  notifyPeople = false;
  addOnBlur = true;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

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
    || action === 'admindeletetags' || action === 'adminupdatetag' || action === 'adminupdatetagcollection'
    || action === 'adminupdateshareemail')
      return true;
    return false;
  }

  getErrorMessage(action) {
    if(action === 'admingetdatabundle') return 'failed to get data bundle';
    if(action === 'admingettags') return 'faied to get tags';
    if(action === 'admingetcollections') return 'failed to get collections';
    if(action === 'admindeletetags') return 'failed to delete tag(s)';
    if(action === 'adminupdatetag' || action === 'adminupdatetagcollection') return 'failed to update tag';
    if(action === 'adminupdateshareemail') return 'failed to update share email';
    return '';
  }
  
  ngOnInit() {
    this.appService.setMenuIdx(2);
    
    this.resetCollections();

    var scope = this;

    this.connection = this.appService.onMessage().subscribe(msg => {

      if(!scope.isComponentMessage(msg.action)) return;

      console.log(msg);
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
          d.parseResultData(tags[i].data, scope.authService.userDetails.email);
          scope.datasets.push(d);
        }
        scope.dataSource.data = scope.datasets;

        // tempt collections
        var collections = msg.data.result.collections;
        scope.resetCollections();
        for(var i=0; i < collections.length; i++) {
          var c = new Collection();
          c.parseResultData(collections[i].data, scope.authService.userDetails.email);
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
          d.parseResultData(tags[i].data, scope.authService.userDetails.email);
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
          c.parseResultData(collections[i].data, scope.authService.userDetails.email);
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

      else if(msg.action === 'adminupdateshareemail') {
        scope.message.type = 'success';
        scope.message.content = 'Updated share email';
        let d = msg.data.result;
        if(d.for === 'tag') {
          for(var i=0; i < scope.datasets.length; i++) {
            if(scope.datasets[i].tag === d.id) {
              if(!scope.datasets[i].share) scope.datasets[i].share = {};
              scope.datasets[i].share[d.email] = d.action === 'add' ? 1 : 0;
              break;
            }
          }
        }
        else {
          for(var i=0; i < scope.collections.length; i++) {
            if(scope.collections[i].id === d.id) {
              if(!scope.collections[i].share) scope.collections[i].share = {};
              scope.collections[i].share[d.email] = d.action === 'add' ? 1 : 0;
              break;
            }
          }
        } // else
      } // if
      
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
    const collection = $event.collection;
    
    console.log('delete ' + tag);
    this.appService.sendMsg({action: 'admindeletetags', data: {tags: [{tag:tag, dir: dir, collection: collection, userId: this.authService.userDetails.uid}]}});
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
    this.showSharing = false;
    this.canShareCollection = false;
  }

  toogleViewType() {
    this.listView = !this.listView;
  }

  getMyCollections() {
    var scope = this;
    var myCollections = [];
    for(var i=0; i < scope.collections.length; i++) {
      if(scope.collections[i].owner === 'yes') {
        myCollections.push(scope.collections[i]);
      }
    }
    return myCollections;
  }

  onCollectionEdit() {
    var scope = this;
    const dialogRef = this.dialog.open(CollectionComponent, {
      width: '600px',
      data: scope.getMyCollections()
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
    var clone = this.collections.slice(0); clone.slice(0, 2);
    const dialogRef = this.dialog.open(TagDetailComponent, {
      width: '800px',
      data: {dataset: dataset, collections: clone}
    });

    dialogRef.componentInstance.onUpdateTag.subscribe((data) => {
      console.log('Update tag', data);
      scope.updateTag(data);
    });
    
    dialogRef.componentInstance.onRemoveTagCollection.subscribe((data) => {
      console.log('Update tag collection', data);
      scope.appService.sendMsg({action: 'adminupdatetagcollection', data: {tag: data.tag, type: 'collection', collectionPrev: data.collectionPrev, data: {collection: ''}}});
      scope.needReloadCollections = true;
    });

    dialogRef.componentInstance.needReloadCollections.subscribe((data) => {
      scope.needReloadCollections = true;
    });

    dialogRef.componentInstance.updateShareEmail.subscribe((data) => {
      scope.appService.sendMsg({action: 'adminupdateshareemail', data: {data: data}});
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

  getShareEmails(share) {
    console.log('getSharedEmails', share);
    var shareEmails = [];
    if(share) {
      var keys = Object.keys(share);
      console.log(keys);
      for(var i=0; i<keys.length; i++) {
        if(share[keys[i]] > 0) {
          shareEmails.push(keys[i]);
        }
      }
    }
    return shareEmails;
  }

  onCollectionChange() {
    console.log('onCollectionChange', this.collectionId);
    var scope = this;
    for(var i=0; i < scope.collections.length; i++) {
      if(scope.collections[i].id === scope.collectionId) {
        if(scope.collections[i].owner === 'yes') {
          scope.canShareCollection = true;
          scope.shareEmails = scope.getShareEmails(scope.collections[i].share);
        }
        else {
          scope.canShareCollection = false;
          scope.showSharing = false;
          scope.shareEmails = [];
        }
        break;
      }
    }
    // get tags
    scope.appService.sendMsg({action: 'admingettags', data: {userEmail: scope.authService.userDetails.email, collection: scope.collectionId}});
  }

  toogleCollectionSharing() {
    this.showSharing = !this.showSharing;
  }

  onRemoveShareEmail(email) {
    console.log('onRemoveShareEmail');
    var cn = confirm('Do you want to remove ' + email + ' from sharing?');
    var scope = this;
    if(cn){
      let data = {for: 'collection', action: 'remove', id: scope.collectionId, 
                  email: email, notify: false, 
                  author: scope.authService.userDetails.displayName};
      scope.appService.sendMsg({action: 'adminupdateshareemail', data: {data: data}});
      const index = scope.shareEmails.indexOf(email);
      if (index >= 0) {
        scope.shareEmails.splice(index, 1);
      }
    }
  }

  onAddShareEmail(event) {
    console.log('onAddShareEmail', this.shareEmails);
    var scope = this;
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      scope.message.type = '';
      scope.message.content = '';

      if(value.includes('@') && (value.includes('monash.edu') || value.includes('gmail.com'))) {
        // update share email
        var cn = confirm('Do you want this collection with ' + value + '?');
        if(cn) {
          let data = {for: 'collection', action: 'add', id: scope.collectionId, 
                      email: value.trim(), notify: scope.notifyPeople, 
                      author: this.authService.userDetails.displayName};
          scope.appService.sendMsg({action: 'adminupdateshareemail', data: {data: data}});
          scope.shareEmails.push(value.trim());
        }
      }
      else {
        scope.message.type = 'error';
        scope.message.content = 'support only monash/gmail';
      }
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

}
