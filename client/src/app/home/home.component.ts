import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  constructor(private appService: AppService) { }
  examples = {
    url1: environment.ws_url + '/sharevol/?tag=000000_galaxy',
    url2: environment.ws_url + '/sharevol/?tag=000000_arteries_brain',
    url3: environment.ws_url + '/meshviewer/?tag=000000_mesh_heart',
    url4: environment.ws_url + '/meshviewer/?tag=000000_mesh_baybridge',
    url5: environment.ws_url + '/pointviewer/?tag=000000_hoyoverde',
    url6: environment.ws_url + '/imageviewer/?tag=000000_image_cmu1'
  };

  ngOnInit() {
    this.appService.setMenuIdx(0);
  }

}
