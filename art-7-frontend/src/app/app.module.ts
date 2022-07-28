import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material/snack-bar";
import { AddCredentialsInterceptor } from "./auth/add-credentials.interceptor";
import { SharedModule } from "./shared/shared.module";
import { HandleErrorInterceptor } from "./auth/handle-error.interceptor";
import { AuthService } from "./auth/auth.service";
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from "@angular/material/tooltip";
import { PublicSocket } from "./shared/websocket/public.socket";
import { AuthenticatedSocket } from "./shared/websocket/authenticated.socket";
import { HomeModule } from "./home/home.module";
import { HomeComponent } from "./home/home.component";
import { CookieService } from "ngx-cookie-service";
import { MAT_BOTTOM_SHEET_DEFAULT_OPTIONS } from "@angular/material/bottom-sheet";

@NgModule({
  declarations: [
    AppComponent, HomeComponent
  ],
  imports: [
    HomeModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
  ],
  providers: [
    PublicSocket,
    CookieService,
    AuthenticatedSocket,
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 2500,
      }
    },
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: {
        position: 'above'
      }
    },
    {
      provide: MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
      useValue: {
        panelClass: ['bottom-sheet'],
        hasBackdrop: true
      }
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AddCredentialsInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HandleErrorInterceptor,
      multi: true,
      deps: [AuthService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

