import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

import { AuthService } from '../auth.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private appService: AppService, private authService: AuthService, private router: Router) { }

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
  
  signOut($event) {
    $event.preventDefault();
    this.authService.signOut();
    this.router.navigate(['/login'])
  }

}
