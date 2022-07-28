import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { authenticatedSocketIoConfig, publicSocketIoConfig } from "./socket.config";

@Injectable()
export class AuthenticatedSocket extends Socket {
  constructor() {
    super(authenticatedSocketIoConfig);
  }
}
