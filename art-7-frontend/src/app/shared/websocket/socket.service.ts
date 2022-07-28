import { Injectable } from "@angular/core";
import { PublicSocket } from "./public.socket";
import { AuthenticatedSocket } from "./authenticated.socket";
import { Observable, Subscription } from "rxjs";
import { IServerSettings } from "../../home/settings/settings.interface";
import { IAccount } from "../../auth/account.model";

@Injectable({ providedIn: 'root' })
export class SocketService {
  constructor(
    private publicSocket: PublicSocket,
    private authenticatedSocket: AuthenticatedSocket,
  ) {
  }

  sendCanvasToServer(plotId: number, canvasData: string): void {
    if (!this.authenticatedSocket.ioSocket.connected) {
      console.error('Authenticated socket not connected');
      throw new Error('error.authenticatedSocketDisconnected')
    }
    this.authenticatedSocket.emit('plotUpdate', {
      plotId: plotId,
      imageData: canvasData
    });
  }

  receivePlotUpdate() {
    return this.publicSocket.fromEvent<IPlotUpdatePacket>('plotUpdate')
  }

  receivePlotClaimed() {
    return this.publicSocket.fromEvent<{ msg: string }>('plotClaimed')
  }

  receiveUserBanned() {
    return this.publicSocket.fromEvent<{ userId: number }>('userBanned')
  }

  receiveServerSettingsUpdate() {
    return this.publicSocket.fromEvent<{ settings: IServerSettings }>('serverSettingsChange');
  }

  receiveServerMessage(): Observable<IChatMessage> {
    return this.publicSocket.fromEvent<{ msg: string }>('serverMessage')
  }

  receiveChat(): Observable<IChatMessage> {
    return this.publicSocket.fromEvent<IChatMessage>('chat')
  }

  receiveAuthenticatedError(): Observable<ISocketError> {
    return this.authenticatedSocket.fromEvent<ISocketError>('exception')
  }

  receivePublicError(): Observable<ISocketError> {
    return this.publicSocket.fromEvent<ISocketError>('exception')
  }

  public disconnectFromAll(): void {
    this.authenticatedSocket.removeAllListeners()
    this.publicSocket.removeAllListeners()
    this.authenticatedSocket.disconnect()
    this.publicSocket.disconnect()
  }

  sendChat(message: string) {
    this.authenticatedSocket.emit('sendChat', { msg: message });
  }

  // Disconnect and reconnect to establish new user id
  handleLogin() {
    this.publicSocket.disconnect();
    this.authenticatedSocket.disconnect();
    this.publicSocket.connect();
    this.authenticatedSocket.connect();
    this.authenticatedSocket.emit('join');
  }

  // Disconnect and reconnect to establish new user id
  handleLogout() {
    this.authenticatedSocket.disconnect();
    this.publicSocket.disconnect();
    this.publicSocket.connect();
  }
}

export interface IChatMessage {
  username?: string,
  msg: string
}

export interface IPlotUpdatePacket {
  plotId: number;
  imageData: string;
}

export interface ISocketError {
  status?: string;
  message?: string;
}
