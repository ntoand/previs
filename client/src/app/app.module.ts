import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
import { UploadComponent } from './upload/upload.component';
import { UploadfileComponent } from './upload/uploadfile/uploadfile.component';
import { UploadlinkComponent } from './upload/uploadlink/uploadlink.component';
import { ReviewComponent } from './review/review.component';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { FlexLayoutModule } from "@angular/flex-layout";
import { ProfileComponent } from './profile/profile.component';

import { MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule, 
         MatCardModule, MatRadioModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule,
         MatDialogModule, MatTooltipModule, MatCheckboxModule, MatMenuModule } from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppService } from './core/app.service';
import { MytardisComponent } from './upload/mytardis/mytardis.component';
import { ExperimentListComponent } from './upload/mytardis/experiment-list/experiment-list.component';
import { ExperimentDetailComponent } from './upload/mytardis/experiment-detail/experiment-detail.component';
import { DatasetDetailComponent } from './upload/mytardis/dataset-detail/dataset-detail.component';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';
import { LoginComponent } from './login/login.component';
import { AuthService } from './core/auth.service';
import { ConfirmdialogComponent } from './core/confirmdialog/confirmdialog.component';
import { TagDetailComponent } from './review/tag-detail/tag-detail.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    UploadComponent,
    UploadfileComponent,
    UploadlinkComponent,
    ReviewComponent,
    MytardisComponent,
    ExperimentListComponent,
    ExperimentDetailComponent,
    DatasetDetailComponent,
    LoginComponent,
    ConfirmdialogComponent,
    TagDetailComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatRadioModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatMenuModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule // imports firebase/auth, only needed for auth features,
  ],
  providers: [AppService, AuthService],
  bootstrap: [AppComponent],
  entryComponents: [ConfirmdialogComponent]
})
export class AppModule { }
