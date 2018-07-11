import { Injectable } from '@angular/core';
import { Router } from "@angular/router";

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Observable } from 'rxjs';

@Injectable()
export class AuthService {
  user: Observable<firebase.User>;
  public userDetails: firebase.User = null;

  constructor(private firebaseAuth: AngularFireAuth, private router: Router) {
    this.user = firebaseAuth.authState;
    this.user.subscribe(
        (user) => {
          if (user) {
            this.userDetails = user;
            console.log(this.userDetails);
          }
          else {
            this.userDetails = null;
          }
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

  signOut() {
    this.firebaseAuth
      .auth
      .signOut().then((res) => this.router.navigate(['/']));;
  }

}