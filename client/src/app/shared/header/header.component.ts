import { Component, OnInit } from '@angular/core';
import { AppService } from '@app/core/services/app.service';

import { AuthService } from '@app/core/services/auth.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(public appService: AppService, public authService: AuthService, private router: Router) { }

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
