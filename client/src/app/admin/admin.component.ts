import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';
import { SocketioService } from '@app/core/services/socketio.service';
import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { selectUser } from '@app/core/store/selectors/user.selector';
import { map } from 'rxjs/operators';
import { AppService } from '../core/services/app.service';
import * as moment from 'moment';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
// for date picket
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  subHandles: any[] = [];
  message = { type: "", content: "" };
  // store
  appstate$: Observable<IAppState>;
  user = null;

  // data
  dpStart = new FormControl(new Date());
  dpEnd = new FormControl(new Date());
  loaded = false;
  admin = false;
  allTags = [];
  users = [];
  stats = {disk: 0, tag: 0};
  startDate = null;
  endDate =  moment();
  diskVSMonth = [];
  tagVSMonth = [];
  dataType = [{name: 'volume', value: 0}, {name: 'mesh', value: 0}, {name: 'point', value: 0}, {name: 'image', value: 0}];
  uploadType = [{name: 'local', value: 0}, {name: 'link', value: 0}, {name: 'mytardis', value: 0}];

  // bar chart
  view: any[] = [700, 400];
  // options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  xAxisLabel = 'Time';
  showYAxisLabel = true;
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
  // custom
  yAxisLabelDiskVSMonth = 'Disk (MB)';
  yAxisLabelTagVSMonth = 'Number of tags';
  showPieLegend = true;
  // table view
  displayedColumns: string[] = ['email', 'tag', 'disk', 'start', 'end', 'note'];
  dataSource = new MatTableDataSource(this.users);
  private sort: MatSort;

  constructor(private store: Store<IAppState>, public appService: AppService,
    private socket: SocketioService, public authService: AuthService) { }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    var scope = this;
    scope.appstate$ = this.store;

    // user
    var h1 = scope.appstate$.pipe(
      select(selectUser),
      map(user => user)
    ).subscribe(user =>{
      scope.user = user;
      if(scope.user && scope.user.loaded) {
        scope.admin = scope.user.item.admin;
        if(scope.admin === true) {
          scope.socket.sendMessage("getdataforstats", {}); 
        }
        else {
          scope.loaded = true;
        }
      }
    });
    this.subHandles.push(h1);

    var h2 = scope.socket.getDataForStatsReceived$.subscribe((data: any)=>{
      scope.message.type = '';
      scope.message.content = '';
      if(data.status === 'error') {
        scope.message.type = 'error';
        scope.message.content = 'failed to get api key';
        return;
      }
      scope.allTags = data.result.tags;
      scope.initDate();
      scope.processStatsData();
    });
    this.subHandles.push(h2);
  }

  ngOnDestroy() {
    for(var i=0; i < this.subHandles.length; i++) {
      this.subHandles[i].unsubscribe();
    }
  }

  initDate() {
    var scope = this;
    let tags = scope.allTags;
    if(tags.length === 0) {
      scope.startDate = scope.endDate;
      return;
    }
    scope.startDate = moment(new Date(scope.allTags[0].date));
    for(var i=1; i < tags.length; i++) {
      const date = moment(new Date(tags[i].date));
      if(scope.startDate > date) scope.startDate = date;
    }

    scope.dpStart = new FormControl(scope.startDate.toDate());
    scope.dpEnd = new FormControl(scope.endDate.toDate());
  }

  onStartDateChange($event) {
    console.log('onStartDateChange', $event);
    this.startDate = moment($event.value);
    this.processStatsData();
  }

  onEndDateChange($event) {
    console.log('onEndDateChange', $event);
    this.endDate = moment($event.value);
    this.processStatsData();
  }

  processStatsData() {
    var scope = this;
    console.log('processStatsData', scope.allTags[0]);
    const tags = scope.allTags.filter(item => moment(item.date)>=scope.startDate && moment(item.date)<=scope.endDate);

    // get users
    var userDict = {};
    scope.stats.disk = 0;
    scope.stats.tag = tags.length;
    for(var i=0; i < tags.length; i++) {
      // stats
      scope.stats.disk += tags[i].disk ? tags[i].disk : 0;

      // datatype
      let type = tags[i].type;
      if(type === 'volume') scope.dataType[0].value += 1;
      else if(type === 'mesh') scope.dataType[1].value += 1;
      else if(type === 'point') scope.dataType[2].value += 1;
      else if(type === 'image') scope.dataType[3].value += 1;

      // upload type
      let source = tags[i].source;
      if(source === 'localupload' || source === 'local') scope.uploadType[0].value += 1;
      else if(source === 'link') scope.uploadType[1].value += 1;
      else if(source === 'mytardis') scope.uploadType[2].value += 1;

      // users
      const email = tags[i].userEmail;
      const date = moment(new Date(tags[i].date));
      if(!userDict[email]) {
        userDict[email] = {
          disk: tags[i].disk ? tags[i].disk : 0,
          tag: 1,
          start: date.clone(),
          end: date.clone()
        };
      }
      else {
        userDict[email].disk += tags[i].disk ? tags[i].disk : 0;
        userDict[email].tag += 1;
        if(userDict[email].start > date) userDict[email].start = date.clone();
        if(userDict[email].end < date) userDict[email].end = date.clone();
      }
    }
    
    scope.users = [];
    Object.keys(userDict).forEach(function(key,index) {
      const start = userDict[key].start.format('MM/DD/YYYY');
      const end = userDict[key].end.format('MM/DD/YYYY');
      scope.users.push({
        email: key,
        disk: userDict[key].disk,
        tag: userDict[key].tag,
        start: start,
        end: end,
        note: start === end ? '1-day user' : ''
      });
    });
    //sort users
    scope.users.sort(function(a, b){
        if(a.tag >  b.tag) return -1;
        if(a.tag <  b.tag) return 1;
        return 0;
    });
    scope.dataSource.data = scope.users;

    // stats vs month
    var date = scope.startDate.clone();
    var dict = {};
    while(date.format('YY-MM') <= scope.endDate.format('YY-MM')) {
      dict[date.format('YY-MM')] = {tag: 0, disk: 0};
      date = date.add(1, 'months');
    }
    
    for(var i=0; i < tags.length; i++) {
      const date = moment(new Date(tags[i].date));
      dict[date.format('YY-MM')].tag += 1;
      dict[date.format('YY-MM')].disk += tags[i].disk;
    }

    scope.diskVSMonth = [];
    scope.tagVSMonth = [];
    Object.keys(dict).forEach(function(key,index) {
      scope.diskVSMonth.push({name: key, value: dict[key].disk});
      scope.tagVSMonth.push({name: key, value: dict[key].tag});
    });
    
    // done
    scope.loaded = true;
  }

  onSelect($event) {

  }


}
