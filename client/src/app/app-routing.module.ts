import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent }      from './home/home.component';
import { UploadComponent }      from './upload/upload.component';
import { ReviewComponent }      from './review/review.component';
import { MytardisComponent }      from './upload/mytardis/mytardis.component';
import { ExperimentListComponent }      from './upload/mytardis/experiment-list/experiment-list.component';
import { ExperimentDetailComponent } from './upload/mytardis/experiment-detail/experiment-detail.component';
import { DatasetDetailComponent } from './upload/mytardis/dataset-detail/dataset-detail.component';
import { LoginComponent }      from './login/login.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'upload', component: UploadComponent, children:[
      { path: 'experiment', component: ExperimentListComponent, outlet:'auxMytardis'},
      { path: 'experiment/:id', component: ExperimentDetailComponent, outlet:'auxMytardis'},
      { path: 'dataset/:id', component: DatasetDetailComponent, outlet:'auxMytardis'}
    ] 
  },
  { path: 'review', component: ReviewComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '404', component: HomeComponent }
  //{ path: '**', redirectTo: '/404' }
  //{ path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
