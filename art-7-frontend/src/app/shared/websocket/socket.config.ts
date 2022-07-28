import { SocketIoConfig } from "ngx-socket-io";
import { environment } from "../../../environments/environment";

export const publicSocketIoConfig: SocketIoConfig = {
  url: `${environment.websocketUrl}/public`,
  options: {
    transports: ['websocket']
  }
}

export const authenticatedSocketIoConfig: SocketIoConfig = {
  url: `${environment.websocketUrl}/authenticated`,
  options: {
    transports: ['websocket'],
    autoConnect: false
  }
}
