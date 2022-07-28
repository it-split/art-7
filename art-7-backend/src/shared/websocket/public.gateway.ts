import { OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway(80, { namespace: 'public' })
export class PublicGateway implements OnGatewayInit {

    private readonly logger = new Logger(PublicGateway.name);
    public static server?: Server;

    constructor() {}

    afterInit(server: Server): any {
        this.logger.log('Initialised PublicServer')
        PublicGateway.server = server;
    }
}