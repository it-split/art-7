import {
    ConnectedSocket,
    MessageBody, OnGatewayConnection, OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { forwardRef, Inject, Logger, UseGuards } from "@nestjs/common";
import { WsAuthenticatedGuard } from "../../auth/ws.authenticated.guard";
import { PlotService } from "../../entities/plot/plot.service";
import { IUser } from "../../entities/user/user.entity";
import { Server, Socket } from "socket.io";
import { PublicGateway } from "./public.gateway";
import { UserService } from "../../entities/user/user.service";
import { SettingsService } from "../../admin/settings/settings.service";

@WebSocketGateway(80, { namespace: 'authenticated' })
export class AuthenticatedGateway implements OnGatewayInit, OnGatewayDisconnect {

    @Inject()
    private readonly plotService: PlotService;

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService;

    private readonly logger = new Logger(AuthenticatedGateway.name);

    public static server?: Server;

    private clientIdToUser: Map<string, IUser> = new Map<string, IUser>();
    public static userIdToClientIds: Map<number, string[]> = new Map<number, string[]>();

    afterInit(server: Server): any {
        this.logger.log('Initialised AuthenticatedServer')
        AuthenticatedGateway.server = server;
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Authenticated Client disconnect: ${client.id}`)
        if (this.clientIdToUser.has(client.id)) {
            const clientUser = this.clientIdToUser.get(client.id);
            const uId = clientUser.id;
            this.logger.log(`> (${uId}) ${clientUser.username} left the chat`);
            PublicGateway.server.emit('serverMessage', { msg: `${clientUser.username} left the chat`})
            this.clientIdToUser.delete(client.id);
            if (AuthenticatedGateway.userIdToClientIds.has(uId)) {
                AuthenticatedGateway.userIdToClientIds.set(uId, AuthenticatedGateway.userIdToClientIds.get(uId).filter((s) => s != client.id));
            }
        }
    }

    @UseGuards(WsAuthenticatedGuard)
    @SubscribeMessage('join')
    async handleJoin(
        @ConnectedSocket() client: Socket
    ) {
        const user: IUser = <IUser>client.data;
        this.clientIdToUser.set(client.id, user);
        if (!AuthenticatedGateway.userIdToClientIds.has(user.id)) {
            AuthenticatedGateway.userIdToClientIds.set(user.id, [])
        }
        AuthenticatedGateway.userIdToClientIds.get(user.id).push(client.id);
        this.logger.log(`> ${user.username} joined the chat`);
        PublicGateway.server.emit('serverMessage', { msg: `> ${user.username} joined the chat` })
    }

    @UseGuards(WsAuthenticatedGuard)
    @SubscribeMessage('plotUpdate')
    async handleUpdatedCanvas(
        @ConnectedSocket() client: Socket,
        @MessageBody('plotId') plotId: number,
        @MessageBody('imageData') imageData: string
    ) {
        if (!SettingsService.settings.drawingEnabled) {
            this.logger.warn(`Attempted to draw when draw was disabled`);
            return;
        }
        const user: IUser = <IUser>client.data;
        if (plotId !== user.plotId) {
            this.logger.warn(`supplied plotId ${plotId} != user plotId ${user.plotId}`);
            // update user in session
            const userFromDb = await this.userService.findOneByPlotId(plotId);
            if (user.id !== userFromDb.id) {
                this.logger.error(`user ${user.id} is not the owner of plot ${plotId}, ${userFromDb.id} is`);
                return 'error.notOwnerOfPlot';
            }
        }
        await this.plotService.updatePlotData(plotId, imageData);
        PublicGateway.server.emit('plotUpdate', { plotId: plotId, imageData: imageData })
    }

    @UseGuards(WsAuthenticatedGuard)
    @SubscribeMessage('sendChat')
    async handleSendChat(
        @ConnectedSocket() client: Socket,
        @MessageBody('msg') msg: string,
    ) {
        if (!SettingsService.settings.chatEnabled) {
            this.logger.warn(`Attempted to chat when chat was disabled`);
            return;
        }
        const user: IUser = <IUser>client.data;
        if (msg.length > 128) {
            this.logger.warn(`User (${user.id}) ${user.username} sent a message of length ${msg.length}`);
            return;
        }
        this.logger.log(`> (${user.id}) ${user.username}: ${msg}`);
        PublicGateway.server.emit('chat', { username: user.username, msg: msg })
    }
}