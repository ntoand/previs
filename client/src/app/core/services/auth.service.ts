import { Injectable } from '@angular/core';
import { Router } from "@angular/router";

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Observable } from 'rxjs';

import { Store, select } from '@ngrx/store';
import { IAppState } from '@app/core/store/state/app.state';
import { SocketioService } from './socketio.service';
import { GetOrCreateUserDone } from "@app/core/store/actions/user.actions";;

@Injectable()
export class AuthService {
  user: Observable<firebase.User>;
  public userDetails: firebase.User = null;
  public loaded = false;

  constructor(private store: Store<IAppState>, private socket: SocketioService, 
              private firebaseAuth: AngularFireAuth, private router: Router) {
    this.user = firebaseAuth.authState;
    var scope = this;
    scope.user.subscribe(
        (user) => {
          if (user) {
            scope.userDetails = user;
            const data = {id: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL};
            this.socket.sendMessage("admingetorcreateuser", {data: data});
          }
          else {
            scope.userDetails = null;
          }
          scope.loaded = true;
        }
    );

    scope.socket.getOrCreateUserReceived$.subscribe((m: any)=>{
      scope.store.dispatch(new GetOrCreateUserDone(m));
    });
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