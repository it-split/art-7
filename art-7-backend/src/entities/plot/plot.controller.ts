import { BadRequestException, Body, Controller, Get, Logger, Param, Post, Request, UseGuards } from '@nestjs/common';
import { PlotService } from "./plot.service";
import { AuthenticatedGuard } from "../../auth/authenticated.guard";
import { IPlot } from "./plot.entity";
import { PlotsDto } from "./plots.dto";
import { UserService } from "../user/user.service";
import { IUser } from "../user/user.entity";
import { PublicGateway } from "../../shared/websocket/public.gateway";
import { SettingsService } from "../../admin/settings/settings.service";
import { AdminGuard } from "../../auth/admin.guard";
import { WHITE_PLOT_DATA } from "../../shared/constants";

@Controller('plot')
export class PlotController {
    private readonly logger = new Logger(PlotController.name);

    constructor(
        private readonly plotService: PlotService,
        private readonly userService: UserService,
    ) {}

    @UseGuards(AuthenticatedGuard)
    @Post('/claim')
    public async claimPlot(
        @Request() request,
        @Body() coordinates: Coordinates
    ): Promise<IPlot> {
        if (!SettingsService.settings.plotClaimingEnabled) {
            throw new BadRequestException('error.plotClaimingDisabled')
        }
        this.logger.log(`Claiming plot x: ${coordinates.x}, y: ${coordinates.y}`);
        const plot = await this.plotService.claimPlot(coordinates, request.user.id);
        const user = await this.userService.setUserPlot(request.user.id, plot.id);
        request.logIn(user, (err) => {
            if (err) {
                this.logger.error(`Error updating user in session: ${err}`)
            } else {
                this.logger.log(`Successfully updated user in session`)
            }
        })
        PublicGateway.server.emit('plotClaimed', { msg: `${request.user.username} has claimed a plot!` })
        return plot;
    }

    @Get('/all')
    public async getAllPlots(): Promise<PlotsDto> {
        this.logger.log(`Retrieving all plots`);
        return this.plotService.findAllAsDto();
    }

    @Get(':id/coords')
    public async getCoordsForPlot(
        @Param('id') plotId: number
    ): Promise<any> {
        this.logger.log(`Retrieving coords for plot ${plotId}`);
        return this.plotService.findCoordsForPlot(plotId);
    }

    @Get(':id/owner')
    public async getPlotOwner(
        @Param('id') plotId: number
    ): Promise<IUser> {
        this.logger.log(`Retrieving owner for plot ${plotId}`);
        const user = await this.userService.findOneByPlotId(plotId);
        return {
            id: user.id,
            username: user.displayName,
            isVerified: user.isVerified,
            plotId: user.plotId,
            isAdmin: user.isAdmin,
        }
    }

    @UseGuards(AdminGuard)
    @Get(':id/wipe')
    public async wipePlotData(
        @Param('id') plotId: number
    ): Promise<any> {
        this.logger.warn(`Wiping plot data for plot ${plotId}`);
        await this.plotService.updatePlotData(plotId, WHITE_PLOT_DATA);
        PublicGateway.server.emit('plotUpdate', { plotId: plotId, imageData: WHITE_PLOT_DATA })
    }

    @UseGuards(AdminGuard)
    @Get(':id/ban')
    public async wipePlotDataAndBanUser(
        @Param('id') plotId: number
    ): Promise<any> {
        this.logger.warn(`Deleting plot ${plotId} and banning user`);
        const plotOwner = await this.userService.findOneByPlotId(plotId);
        if (plotOwner.isAdmin) {
            this.logger.warn(`Skipping banning, ${[plotOwner.username]} is an admin`);
            return;
        }
        await this.plotService.deletePlot(plotId);
        await this.userService.deleteUser(plotOwner.id);
        PublicGateway.server.emit('userBanned', { userId: plotOwner.id })
    }
}

export interface Coordinates {
    x: number;
    y: number;
}