import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { SettingsService } from "../settings.service";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ServerSettingsService } from "../server-settings.service";
import { IServerSettings } from "../settings.interface";
import { IAccount } from "../../../auth/account.model";
import { AuthService } from "../../../auth/auth.service";

@Component({
  selector: 'settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {
  showChat = true;
  showClaimablePlots = true;
  account?: IAccount | null;

  serverSettings?: IServerSettings;

  constructor(
    public dialogRef: MatDialogRef<SettingsDialogComponent>,
    public settingsService: SettingsService,
    public serverSettingsService: ServerSettingsService,
    public authService: AuthService,
  ) {
  }

  ngOnInit(): void {
    this.settingsService.settingsState.subscribe((settings) => {
      this.showChat = settings.showChat;
      this.showClaimablePlots = settings.showClaimablePlots;
    })
    this.serverSettingsService.serverSettingsState.subscribe((settings) => {
      console.log(`Got server settings: ${JSON.stringify(settings)}`)
      this.serverSettings = settings;
    });
    this.authService.authenticationState.subscribe((account) => {
      this.account = account;
    })
  }

  handleShowChatChange($event: MatCheckboxChange) {
    this.settingsService.setShowChat($event.checked);
  }

  handleShowClaimablePlotsChange($event: MatCheckboxChange) {
    this.settingsService.setShowClaimablePlots($event.checked);
  }

  registrationEnabledChange($event: MatCheckboxChange) {
    this.serverSettingsService.setRegistrationEnabled($event.checked);
  }

  plotClaimingEnabledChange($event: MatCheckboxChange) {
    this.serverSettingsService.setPlotClaimingEnabled($event.checked);
  }

  drawingEnabledChange($event: MatCheckboxChange) {
    this.serverSettingsService.setDrawingEnabled($event.checked);
  }

  chatEnabledChange($event: MatCheckboxChange) {
    this.serverSettingsService.setChatEnabled($event.checked);
  }
}
