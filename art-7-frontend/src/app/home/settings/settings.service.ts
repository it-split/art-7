import { Injectable } from "@angular/core";
import { ReplaySubject } from "rxjs";
import { ISettings } from "./settings.interface";

@Injectable({ providedIn: 'root' })
export class SettingsService {
  // Default music settings
  private settings: ISettings = {
    showChat: true,
    showClaimablePlots: true,
    musicSettings: {
      muted: true,
      volume: 0.5
    }
  }
  public settingsState = new ReplaySubject<ISettings>(1);

  constructor() {
    this.settings.showChat = JSON.parse(localStorage.getItem('showChat') ?? 'true');
    this.settings.showClaimablePlots = JSON.parse(localStorage.getItem('showClaimablePlots') ?? 'true');
    this.settings.musicSettings = {
      muted: JSON.parse(localStorage.getItem('isMusicMuted') ?? 'false'),
      volume: +JSON.parse(localStorage.getItem('musicVolume') ?? '0.5'),
    }
    this.setSettings();
  }

  setShowChat(val: boolean) {
    this.settings.showChat = val;
    localStorage.setItem('showChat', JSON.stringify(val));
    this.setSettings();
  }

  setShowClaimablePlots(val: boolean) {
    this.settings.showClaimablePlots = val;
    localStorage.setItem('showClaimablePlots', JSON.stringify(val));
    this.setSettings();
  }

  setIsMusicMuted(val: boolean) {
    this.settings.musicSettings.muted = val;
    localStorage.setItem('isMusicMuted', JSON.stringify(val));
    this.setSettings();
  }

  setMusicVolume(val: number) {
    this.settings.musicSettings.volume = val;
    localStorage.setItem('musicVolume', JSON.stringify(val));
    this.setSettings();
  }

  setSettings(): void {
    this.settingsState.next(this.settings);
  }
}
