import { Component, OnInit, Input } from '@angular/core';
import { Router } from "@angular/router";

import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(public authService: AuthService, private router: Router) { }
  
  @Input() navPath: string = "";
  
  ngOnInit() {
  }

  signIn() {
    this.authService.signInWithGoogle().then((res) => { 
      console.log("/" + this.navPath);
      this.router.navigate(["/" + this.navPath])
    })
    .catch((err) => console.log(err));;
  }

  signOut($event) {
    $event.preventDefault();
    this.authService.signOut();
  }

}
