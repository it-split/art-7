import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { IServerSettings, ISettings } from "./settings.interface";
import { HttpClient } from "@angular/common/http";
import { SERVER_API_URL } from "../../app.constants";
import { SocketService } from "../../shared/websocket/socket.service";

@Injectable({ providedIn: 'root' })
export class ServerSettingsService {
  // Default server settings
  private settings: IServerSettings = {
    registrationEnabled: false,
    plotClaimingEnabled: false,
    drawingEnabled: false,
    chatEnabled: false,
  }
  public serverSettingsState = new ReplaySubject<IServerSettings>(1);

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.settings = JSON.parse(localStorage.getItem('serverSettings') ?? JSON.stringify(this.settings));
    console.log(`Loading server settings`)
    this.http.get<IServerSettings>(`${SERVER_API_URL}/admin/settings`).subscribe((settings) => {
      console.log(`Loaded server settings, ${JSON.stringify(settings)}`)
      this.settings = settings;
      this.setServerSettings();
    });
    this.socketService.receiveServerSettingsUpdate().subscribe((newSettings) => {
      this.settings = newSettings.settings;
      this.setServerSettings();
    })
  }

  setRegistrationEnabled(val: boolean) {
    this.http.post<IServerSettings>(`${SERVER_API_URL}/admin/settings/registration-enabled`, { val: val }).subscribe(
      (result) => {
        this.settings = result;
        this.setServerSettings();
      }
    )
  }

  setPlotClaimingEnabled(val: boolean) {
    this.http.post<IServerSettings>(`${SERVER_API_URL}/admin/settings/plot-claiming-enabled`, { val: val }).subscribe(
      (result) => {
        this.settings = result;
        this.setServerSettings();
      }
    )
  }

  setDrawingEnabled(val: boolean) {
    this.http.post<IServerSettings>(`${SERVER_API_URL}/admin/settings/drawing-enabled`, { val: val }).subscribe(
      (result) => {
        this.settings = result;
        this.setServerSettings();
      }
    )
  }

  setChatEnabled(val: boolean) {
    this.http.post<IServerSettings>(`${SERVER_API_URL}/admin/settings/chat-enabled`, { val: val }).subscribe(
      (result) => {
        this.settings = result;
        this.setServerSettings();
      }
    )
  }

  setServerSettings(): void {
    localStorage.setItem('serverSettings', JSON.stringify(this.settings));
    this.serverSettingsState.next(this.settings);
  }
}
