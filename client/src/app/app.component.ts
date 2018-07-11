import { Component } from '@angular/core';
import 'hammerjs';

import { environment } from '../environments/environment';
import { Router, NavigationEnd } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  
  constructor(private router: Router) {
    if (environment.production) {
      (<any>window).ga('create', 'UA-122143314-1', 'auto');
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          (<any>window).ga('set', 'page', event.urlAfterRedirects);
          (<any>window).ga('send', 'pageview');
        }
      }); 
    }
  }
}
