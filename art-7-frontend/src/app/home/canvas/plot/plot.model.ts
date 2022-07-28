export interface IPlot {
  id?: number;
  ownerId?: number;
  x: number;
  y: number;
  claimable?: boolean;
  data?: any;
}

export interface PlotsDto {
  xOffset: number;
  yOffset: number;
  plots: IPlot[][];
}
