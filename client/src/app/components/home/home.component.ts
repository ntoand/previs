import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  constructor(private appService: AppService) { }
  examples = {
    url1: environment.ws_url + '/sharevol/index.html?data=data/example/galaxy/vol_web.json&reset',
    url2: environment.ws_url + '/sharevol/index.html?data=data/example/arteries-brain/vol.json&reset',
    url3: environment.ws_url + '/viewer/index.html?tag=data/example/mesh-heart',
    url4: environment.ws_url + '/viewer/index.html?tag=data/example/baybridge',
    url5: environment.ws_url + '/data/example/hoyoverde/potree.html',
    url6: environment.ws_url + '/data/example/hoyoverde/potree.html'
  };

  ngOnInit() {
    this.appService.setMenuIdx(0);
  }

}
