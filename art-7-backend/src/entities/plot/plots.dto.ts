import { IPlot } from "./plot.entity";

export interface PlotsDto {
    xOffset: number;
    yOffset: number;
    plots: IPlot[][];
}