import { Injectable } from '@angular/core';
import { Router } from "@angular/router";

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Observable } from 'rxjs';

@Injectable()
export class AuthService {
  user: Observable<firebase.User>;
  public userDetails: firebase.User = null;
  public loaded = false;

  constructor(private firebaseAuth: AngularFireAuth, private router: Router) {
    this.user = firebaseAuth.authState;
    var scope = this;
    scope.user.subscribe(
        (user) => {
          if (user) {
            scope.userDetails = user;
            //console.log(scope.userDetails);
          }
          else {
            scope.userDetails = null;
          }
          scope.loaded = true;
        }
     );
  }
  
  // login with google account
  signInWithGoogle() {
    return this.firebaseAuth.auth.signInWithPopup(
      new firebase.auth.GoogleAuthProvider()
    )
  }
  
  getUserDetails() {
    return this.userDetails;
  }
  
  isLoggedIn() {
    if (this.userDetails == null ) {
      return false;
    } else {
      return true;
    }
  }
  
  isLoaded() {
    return this.loaded;
  }

  signOut() {
    this.firebaseAuth
      .auth
      .signOut().then((res) => this.router.navigate(['/']));;
  }

}