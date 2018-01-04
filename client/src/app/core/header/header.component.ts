import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private appService: AppService) { }

  ngOnInit() {
  }

  onMenuClick(id) {
    this.appService.setMenuIdx(id);
  }

  getColor(id) {
    if(id == this.appService.getMenuIdx())
      return 'accent';
    return 'primary';
  }
  
  getClass(id) {
    if(id == this.appService.getMenuIdx())
      return 'menu-item-active';
    return 'menu-item';
  }

}
