import { Global, Module } from "@nestjs/common";
import { PublicGateway } from "./public.gateway";
import { AuthenticatedGateway } from "./authenticated.gateway";

@Global()
@Module({
    providers: [PublicGateway, AuthenticatedGateway]
})
export class WebsocketModule {}