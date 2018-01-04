import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent }      from './home/home.component';
import { UploadComponent }      from './upload/upload.component';
import { ReviewComponent }      from './review/review.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'review', component: ReviewComponent },
  { path: '404', component: HomeComponent }
  //{ path: '**', redirectTo: '/404' }
  //{ path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
