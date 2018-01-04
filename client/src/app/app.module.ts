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

import { MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule, 
         MatCardModule, MatRadioModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule } from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppService } from './core/app.service';
import { WebsocketService } from './core/websocket.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    UploadComponent,
    UploadfileComponent,
    UploadlinkComponent,
    ReviewComponent
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
    MatSelectModule
  ],
  providers: [AppService, WebsocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
