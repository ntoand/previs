import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './/app-routing.module';
import { HomeComponent } from './components/home/home.component';
import { UploadComponent } from './components/upload/upload.component';
import { ReviewComponent } from './components/review/review.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { FlexLayoutModule } from "@angular/flex-layout";

import { MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule, 
         MatCardModule, MatRadioModule, MatProgressBarModule, MatProgressSpinnerModule } from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppService } from './services/app.service';
import { WebsocketService } from './services/websocket.service';

import { TitleCasePipe } from './pipes/title-case.pipe';
import { UploadfileComponent } from './components/uploadfile/uploadfile.component';
import { UploadlinkComponent } from './components/uploadlink/uploadlink.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    UploadComponent,
    ReviewComponent,
    HeaderComponent,
    FooterComponent,
    TitleCasePipe,
    UploadfileComponent,
    UploadlinkComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatRadioModule,
    HttpClientModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  providers: [AppService, WebsocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
