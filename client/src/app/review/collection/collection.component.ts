import { Component, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AppService } from '../../core/app.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent {

  connection; 
  message = { type: "", content: "" };

  collectionValue = ''; // to add new
  collections = [];
  editCollectionID = ''; // to check if the item is in edit mode
  editStr = '';  // to store edit string

  needReloadCollections = new EventEmitter();

  constructor(private appService: AppService, public authService: AuthService, 
              public dialogRef: MatDialogRef<CollectionComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { 
    this.collections = data;
  }

  isComponentMessage(action) {
    if(action === 'adminaddcollection' || action === 'adminupdatecollection' || action === 'admindeletecollection')
      return true;
    return false;
  }

  getErrorMessage(action) {
    if(action === 'adminaddcollection') return 'failed to add collection';
    if(action === 'adminupdatecollection') return 'failed to update collection';
    if(action === 'admindeletecollection') return 'failed to delete collection';
  }

  ngOnInit() {
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

      if(msg.action === 'adminaddcollection') {
        scope.collections.push(msg.data.result);
        scope.message.type = 'success';
        scope.message.content = 'Collection added';
      }

      else if (msg.action === 'adminupdatecollection') {
        for(var i=0; i < scope.collections.length; i++) {
          if(scope.collections[i].id === msg.data.result.id) {
            scope.collections[i].name = msg.data.result.name;
          }
        }
        scope.message.type = 'success';
        scope.message.content = 'Collection updated';
      }

      else if(msg.action === 'admindeletecollection') {
        var ind = 0;
        for(var i=0; i < scope.collections.length; i++) {
          if(scope.collections[i].id === msg.data.result.id) {
            ind = i;
            break;
          }
        }
        scope.collections.splice(ind, 1);
        scope.message.type = 'success';
        scope.message.content = 'Collection deleted';
      }

    });
  }

  onAddNewCollection(data) {
    if(this.collectionValue === '') return;
    console.log(data);
    this.editCollectionID = '';
    const collection = {
      name: this.collectionValue,
      numtags: 0,
      userId: this.authService.userDetails.uid,
      userEmail: this.authService.userDetails.email 
    }
    this.appService.sendMsg({action: 'adminaddcollection', data: {data: collection}});
    this.needReloadCollections.emit({});
  }

  onEditClick(data) {
    if(this.editCollectionID === '') {
      this.editCollectionID = data.id;
      this.editStr = data.name;
    }
  }

  onItemEditGo(data) {
    console.log('onItemEditGo', data);
    if(data.name !== this.editStr) {
      // update collection name
      const collection = {
        id: data.id,
        name: this.editStr,
      }
      this.appService.sendMsg({action: 'adminupdatecollection', data: {data: collection}});
      this.needReloadCollections.emit({});
    }
    this.editCollectionID = '';
    this.editStr = '';
    this.collectionValue = '';
  }

  onItemEditCancel() {
    this.editCollectionID = '';
    this.editStr = '';
  }

  onDeleteClick(collection) {
    this.appService.sendMsg({action: 'admindeletecollection', data: {data: collection}});
    this.needReloadCollections.emit({});
  }

}
