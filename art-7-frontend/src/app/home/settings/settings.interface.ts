export interface IServerSettings {
  registrationEnabled: boolean;
  plotClaimingEnabled: boolean;
  drawingEnabled: boolean;
  chatEnabled: boolean;
}

export interface ISettings {
  showChat: boolean;
  showClaimablePlots: boolean;
  musicSettings: IMusicSettings;
}

export interface IMusicSettings {
  muted: boolean,
  volume: number,
}
