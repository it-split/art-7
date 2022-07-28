import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Plot } from "./plot.entity";
import { PlotService } from "./plot.service";
import { PlotController } from "./plot.controller";
import { PlotHistory } from "./plot-history.entity";
import { WebsocketModule } from "../../shared/websocket/websocket.module";

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([Plot, PlotHistory]),
        WebsocketModule,
    ],
    providers: [PlotService],
    exports: [PlotService],
    controllers: [PlotController]
})
export class PlotModule {
}
