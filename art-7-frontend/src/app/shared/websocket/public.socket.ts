import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { publicSocketIoConfig } from "./socket.config";

@Injectable()
export class PublicSocket extends Socket {
  constructor() {
    super(publicSocketIoConfig);
  }
}
