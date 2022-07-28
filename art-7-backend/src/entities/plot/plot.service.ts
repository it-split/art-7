import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Plot } from "./plot.entity";
import { Coordinates } from "./plot.controller";
import { PlotsDto } from "./plots.dto";
import { PlotHistory } from "./plot-history.entity";

@Injectable()
export class PlotService {
    @InjectRepository(Plot)
    private readonly repository: Repository<Plot>;

    @InjectRepository(PlotHistory)
    private readonly plotHistoryRepository: Repository<PlotHistory>;

    constructor() {}

    async findAll(): Promise<Plot[]> {
        return this.repository.find();
    }

    async findAllAsDto(): Promise<PlotsDto> {
        const plots = await this.findAll();
        if (!plots.length) {
            return { xOffset: 0, yOffset: 0, plots: [] }
        }
        // Minimum values of X and Y, used to off   set the position index if they go into the negatives
        const xMin = plots.reduce((a, b) => a.x < b.x ? a : b).x;
        const yMin = plots.reduce((a, b) => a.y < b.y ? a : b).y;

        // Always offset by 1 so we allow for new plots to be claimed in the negative direction
        const xOffset = Math.abs(xMin) + 1;
        const yOffset = Math.abs(yMin) + 1;

        const plots2dArray: Plot[][] = [];
        plots.map((plot) => {
            if (!plots2dArray[plot.x + xOffset]) {
                plots2dArray[plot.x + xOffset] = [];
            }
            plots2dArray[plot.x + xOffset][plot.y + yOffset] = plot;
        });
        return {
            xOffset,
            yOffset,
            plots: plots2dArray
        };
    }

    async updatePlotData(plotId: number, plotData: string) {
        await this.repository.update(plotId, { data: plotData });
        await this.plotHistoryRepository.insert({
            plotId: plotId,
            data: plotData
        })
    }

    async findCoordsForPlot(plotId: number) {
        return this.repository.findOne({
            select: ['x', 'y'],
            where: { id: plotId }
        })
    }

    async claimPlot(coordinates: Coordinates, userId: number): Promise<Plot> {
        // Check the user hasn't already claimed a plot
        const ownedPlot = await this.repository.findOne({
            where: {
                ownerId: userId,
            }
        });
        if (ownedPlot) {
            throw new NotAcceptableException('error.plotLimitReached')
        }
        // Check that plot isn't already taken
        const existingPlot = await this.repository.findOne({
            where: {
                x: coordinates.x,
                y: coordinates.y
            }
        });
        if (existingPlot) {
            throw new NotAcceptableException('error.plotClaimed')
        }
        // Skip adjacency check for the first plot
        if (!(coordinates.x === 0 && coordinates.y === 0) ) {
            const countOfAdjacentPlots = await this.repository.count({
                where: [
                    { x: Between(coordinates.x - 1, coordinates.x + 1) },
                    { y: Between(coordinates.y - 1, coordinates.y + 1) }
                ]
            });
            if (countOfAdjacentPlots < 1) {
                throw new NotAcceptableException('error.noAdjacentPlot')
            }
        }

        // Check that plot has an adjacent plot on at least 1 side
        return this.repository.save({
            x: coordinates.x,
            y: coordinates.y,
            ownerId: userId
        });
    }

    async deletePlot(plotId: number) {
        return this.repository.softDelete(plotId)
    }
}
