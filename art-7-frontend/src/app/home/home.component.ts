import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { LoginDialogComponent } from "./dialog/login-dialog/login-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { AuthService } from "../auth/auth.service";
import { RegisterDialogComponent } from "./dialog/register-dialog/register-dialog.component";
import { InfoDialogComponent } from "./dialog/info-dialog/info-dialog.component";
import { Subject } from "rxjs";
import { SocketService } from "../shared/websocket/socket.service";
import { InactiveDialogComponent } from "./dialog/inactive-dialog/inactive-dialog.component";
import { IAccount } from "../auth/account.model";
import { SettingsDialogComponent } from "./settings/settings-dialog/settings-dialog.component";
import { SettingsService } from "./settings/settings.service";
import { ErrorDialogComponent } from "./dialog/error-dialog/error-dialog.component";
import { IMusicSettings, IServerSettings } from "./settings/settings.interface";
import { ServerSettingsService } from "./settings/server-settings.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public socketService: SocketService,
    public settingsService: SettingsService,
    public serverSettingsService: ServerSettingsService
  ) { }

  inactivityTime = 5 * 60 * 1000;
  userActivityTimeout?: any;
  userInactive: Subject<any> = new Subject<any>();
  account?: IAccount | null;

  serverSettings?: IServerSettings | null;

  musicSettings?: IMusicSettings;
  musicStarted = false
  @ViewChild('audioElement')
  audio?: ElementRef;

  showRegistrationDisabledChip = true;
  showDrawingDisabledChip = true;
  shrinkElements = false;

  ngOnInit(): void {
    this.createInactivityTimer();
    this.userInactive.subscribe(() => {
      this.dialog.open(InactiveDialogComponent, {
        disableClose: true,
      });
      this.socketService.disconnectFromAll();
    });
    this.socketService.receiveAuthenticatedError().subscribe(
      (error) => {
        console.error(`authenticated socket error\n${error.status} : ${error.message}`)
        const dialogRef = this.dialog.open(ErrorDialogComponent, { disableClose: true });
        if (error.status?.toLowerCase().trim() === 'authenticated socket error') {
            this.authService.logout()
        }
        // this.socketService.handleLogin();
        setTimeout(() => dialogRef.close(), 2000);
      }
    );
    this.socketService.receivePublicError().subscribe(
      (error) => {
        console.error(`public socket error\n${error.status} : ${error.message}`)
        this.dialog.open(ErrorDialogComponent, { disableClose: true });
      }
    );
    this.authService.authenticationState.subscribe((account) => {
      this.account = account;
      if (this.account) {
        this.socketService.handleLogin();
      }
    });
    this.settingsService.settingsState.subscribe((settings) => {
      this.updateMusicSettings(settings.musicSettings);
    });
    this.serverSettingsService.serverSettingsState.subscribe((serverSettings) => {
      this.serverSettings = serverSettings;
    });
  }

  createInactivityTimer() {
    this.userActivityTimeout = setTimeout(() => this.userInactive.next(undefined), this.inactivityTime)
  }

  openLoginDialog() {
    this.dialog.open(LoginDialogComponent);
  }

  openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent);
  }

  openInfoDialog() {
    this.dialog.open(InfoDialogComponent);
  }

  openSettingsDialog() {
    this.dialog.open(SettingsDialogComponent);
  }

  logout() {
    this.authService.logout();
  }

  @HostListener('document:mousedown')
  onUserMouseDown() {
    this.refreshUserState();
    if (!this.musicStarted) {
      if (this.audio?.nativeElement.readyState >= 3) {
        this.startMusic();
        this.musicStarted = true;
      }
    }
  }

  @HostListener('window:mousemove')
  refreshUserState() {
    clearTimeout(this.userActivityTimeout);
    this.createInactivityTimer();
  }

  toggleMute(muted: boolean) {
    this.settingsService.setIsMusicMuted(muted);
  }

  setVolume(volume: number) {
    this.settingsService.setMusicVolume(volume);
  }

  private updateMusicSettings(musicSettings: IMusicSettings) {
    this.musicSettings = musicSettings;
    if (this.audio) {
      this.audio.nativeElement.muted = this.musicSettings.muted;
      this.audio.nativeElement.volume = this.musicSettings.volume;
    }
  }

  startMusic() {
    if (this.audio) {
      if (this.musicSettings?.muted) {
        this.audio.nativeElement.muted = true;
      }
      this.audio.nativeElement.load();
      this.audio.nativeElement.play();
    }
  }
}
