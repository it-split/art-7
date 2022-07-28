import { Component, HostListener, OnInit, QueryList, ViewChildren } from "@angular/core";
import { PlotService } from "./plot/plot.service";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { IPlot, PlotsDto } from "./plot/plot.model";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthService } from "../../auth/auth.service";
import { IPlotUpdatePacket, SocketService } from "../../shared/websocket/socket.service";
import { PlotComponent } from "./plot/plot.component";
import { IAccount } from "../../auth/account.model";
import { CanvasHelpers } from "../../shared/canvas.helpers";
import { CanvasStateService } from "./state/canvas-state.service";
import { IServerSettings } from "../settings/settings.interface";
import { ServerSettingsService } from "../settings/server-settings.service";

export const enum Tools {
  Pan = 'PAN',
  Paint = 'PAINT',
  Info = 'INFO',
  ColourPicker = 'COLOR_PICKER',
  Admin = 'ADMIN',
}

export const enum BrushSize {
  OnePx = 10,
  Tiny = 20,
  Small = 40,
  Medium = 70,
  Large = 100,
}


@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {
  @ViewChildren(PlotComponent)
  plotComponents!: QueryList<PlotComponent>

  account?: IAccount | null;
  serverSettings?: IServerSettings | null;

  MIN_ZOOM: number = 0.8;
  MAX_ZOOM: number = 20;

  loadingPlots = true;
  reloadingPlots = false;
  creatingPlot = false;

  xOffset?: number;
  yOffset?: number;
  plots?: IPlot[][];

  scale = 1;
  plotSize = 100;

  originX = window.innerWidth / 2;
  originY = window.innerHeight / 2;

  originXScaleOffset = 0;
  originYScaleOffset = 0;

  originXPanOffset = 0;
  originYPanOffset = 0;

  lastLocation?: MouseEvent | TouchEvent;
  panning = false

  readonly panTool = Tools.Pan;
  readonly paintTool = Tools.Paint;
  readonly infoTool = Tools.Info;
  readonly colourPickerTool = Tools.ColourPicker;
  readonly adminTool = Tools.Admin;
  previousTool?: Tools;
  overridingTool?: Tools;

  selectedTool: Tools = Tools.Pan;
  selectedBrushSize: BrushSize = BrushSize.Small;

  selectedColour: string = '#000000';
  hoverColour: string = '#000000';

  disablePanning = false;
  showColourPicker = false;

  mouseX: number = 0;
  mouseY: number = 0;

  constructor(
    private plotService: PlotService,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private socketService: SocketService,
    private canvasStateService: CanvasStateService,
    private serverSettingsService: ServerSettingsService
  ) {
  }

  ngOnInit(): void {
    this.loadAllPlots();

    this.canvasStateService.canvasState.subscribe((canvasState) => {
      this.selectedTool = canvasState.selectedTool;
      this.selectedBrushSize = canvasState.selectedBrushSize;
      this.selectedColour = canvasState.selectedColour;
    });

    this.canvasStateService.jumpToCoords.subscribe((coords) => {
      // Yes x and y are reversed... don't ask me why i did it this way
      this.originYPanOffset = coords.x * -100;
      this.originXPanOffset = coords.y * -100;
      this.originXScaleOffset = (this.originXPanOffset * this.scale) - this.originXPanOffset;
      this.originYScaleOffset = (this.originYPanOffset * this.scale) - this.originYPanOffset;
      this.panning = false;
    });

    this.authService.authenticationState.subscribe((account) => {
      this.account = account;
    });

    this.serverSettingsService.serverSettingsState.subscribe((settings) => {
      this.serverSettings = settings;
    });

    this.socketService.receivePlotUpdate().subscribe((update: IPlotUpdatePacket) => {
      this.plotComponents.find((p) => p.plot?.id === update.plotId)?.updateWithData(
        update
      )
    })

    this.socketService.receivePlotClaimed().subscribe((data) => {
      this.snackbar.open(`🎉 ${data.msg}`);
      this.loadAllPlots();
    })

    this.socketService.receiveUserBanned().subscribe((data) => {
      if (this.account?.isAdmin) {
        this.snackbar.open(`🤕 User ID ${data.userId} banned`);
      }
      if (this.account?.id === data.userId) {
        this.authService.logout();
      }
      this.reloadingPlots = true;
      this.loadAllPlots();
    })
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent) {
    const factor = Math.round((event.deltaY / 500) * 100) / 100;
    this.scale = Math.round(Math.min(Math.max(this.scale - factor, this.MIN_ZOOM), this.MAX_ZOOM) * 100) / 100;

    this.setScale(this.scale);
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent | TouchEvent) {
    // Treat a middle click as pan tool override
    const isTouch = event.type === 'touchstart';
    if (!isTouch && (<MouseEvent>event).button === 1) {
      event.preventDefault();
      this.onPanToolOverrideKeyPress();
    }
    if (this.selectedTool === Tools.Pan && !this.disablePanning) {
      this.panning = true;
      console.debug('Pan started')
      this.lastLocation = event;
    }
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    // Hacky fix to allow for panning when body isnt focused
    if (event.type === 'touchmove' && !this.panning) {
      this.panning = true;
      this.lastLocation = event;
      return;
    }

    const coords = CanvasHelpers.getEventCoords(event);
    switch (this.selectedTool) {
      case Tools.Pan:
        if (this.panning) {
          const previousCoords = CanvasHelpers.getEventCoords(this.lastLocation!);
          const diffX = (coords.x - previousCoords.x) / (this.scale * this.scale);
          const diffY = (coords.y - previousCoords.y) / (this.scale * this.scale);
          this.originXPanOffset += (diffX * this.scale);
          this.originYPanOffset += (diffY * this.scale);
          this.originXScaleOffset = (this.originXPanOffset * this.scale) - this.originXPanOffset;
          this.originYScaleOffset = (this.originYPanOffset * this.scale) - this.originYPanOffset;

          this.lastLocation = event;
        }
        break;
      case Tools.Info:
      case Tools.Paint:
      case Tools.ColourPicker:
        this.mouseX = coords.x;
        this.mouseY = coords.y;
        break;
    }
  }

  @HostListener('touchend', ['$event'])
  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    switch (this.selectedTool) {
      case Tools.Pan:
        if (this.panning) {
          console.debug(`Panning ended`)
          this.lastLocation = event;
          this.panning = false;
        }
        break;
      case Tools.Paint:
        break;
      case Tools.Info:
        break;
      case Tools.ColourPicker:
        this.setSelectedColour(this.hoverColour);
        this.setSelectedTool(this.previousTool ?? Tools.Pan);
        break;
    }
    // Treat a middle click as pan tool override
    const isTouch = event.type === 'touchend';
    if (!isTouch && (<MouseEvent>event).button === 1) {
      event.preventDefault();
      this.onPanToolOverrideKeyRelease();
    }
  }

  @HostListener('document:keydown.control')
  onPanToolOverrideKeyPress() {
    if (!this.overridingTool) {
      this.overridingTool = this.selectedTool;
      this.selectedTool = Tools.Pan;
    }
  }

  @HostListener('document:keyup.control')
  onPanToolOverrideKeyRelease() {
    if (this.overridingTool) {
      this.selectedTool = this.overridingTool;
      this.overridingTool = undefined;
    }
  }

  private loadAllPlots(): void {
    this.loadingPlots = true;
    this.plotService.findAll().subscribe({
      next: (res: HttpResponse<PlotsDto>) => {
        if (res.body) {
          this.addClaimablePlots(res.body);
          this.xOffset = res.body?.xOffset;
          this.yOffset = res.body?.yOffset;
          this.plots = res.body?.plots ?? [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.snackbar.open(`⚠️ Error loading plots, try reloading the page`);
      }
    }).add(() => {
      this.loadingPlots = false;
      this.reloadingPlots = false;
    })
  }

  claimPlot(x: number, y: number) {
    this.creatingPlot = true;
    this.plotService.claimPlot(x, y).subscribe({
      next: (res: HttpResponse<IPlot>) => {
        this.snackbar.open(`💃 Plot claimed`);
        this.authService.setOwnedPlot(res?.body?.id)
        this.loadAllPlots();
      },
      error: (error: HttpErrorResponse) => {
        switch (error.error?.message) {
          case 'error.plotTaken':
            this.snackbar.open(`⚠️ This plot has been taken, try reloading`);
            break;
          case 'error.plotLimitReached':
            this.snackbar.open(`⚠️ You have already claimed your plot!`);
            break;
          case 'error.noAdjacentPlot':
            this.snackbar.open(`⚠️ A plot must have an adjacent plot`);
            break;
          default:
            this.snackbar.open(`⚠️ Error creating plot`);
        }
      }
    });
  }

  relativePlotSize(): number {
    return this.plotSize * this.scale;
  }

  private addClaimablePlots(plotsDto: PlotsDto) {
    const plots = plotsDto.plots;
    const plotsXOffset = plotsDto.xOffset;
    const plotsYOffset = plotsDto.yOffset;

    for (let plotRow of plots) {
      if (plotRow == null) {
        plotRow = []
      }
      for (let plot of plotRow) {
        if (!plot || plot?.claimable) {
          continue;
        }
        // Create rows above and below if they doesn't exist
        if (!plots[plot.x + plotsXOffset + 1]) {
          plots[plot.x + plotsXOffset + 1] = []
        }
        if (!plots[plot.x + plotsXOffset - 1]) {
          plots[plot.x + plotsXOffset - 1] = []
        }

        // if top of plot is empty, add claimable plot
        if (!plots[plot.x + plotsXOffset - 1][plot.y + plotsYOffset]) {
          plots[plot.x + plotsXOffset - 1][plot.y + plotsYOffset] = {x: plot.x - 1, y: plot.y, claimable: true}
        }

        // if bottom of plot is empty, add claimable plot
        if (!plots[plot.x + plotsXOffset + 1][plot.y + plotsYOffset]) {
          plots[plot.x + plotsXOffset + 1][plot.y + plotsYOffset] = {x: plot.x + 1, y: plot.y, claimable: true}
        }

        // if right of plot is empty, add claimable plot
        if (!plots[plot.x + plotsXOffset][plot.y + plotsYOffset + 1]) {
          plots[plot.x + plotsXOffset][plot.y + plotsYOffset + 1] = {x: plot.x, y: plot.y + 1, claimable: true}
        }

        // if left of plot is empty, add claimable plot
        if (!plots[plot.x + plotsXOffset][plot.y + plotsYOffset - 1]) {
          plots[plot.x + plotsXOffset][plot.y + plotsYOffset - 1] = {x: plot.x, y: plot.y - 1, claimable: true}
        }
      }
    }
  }

  resetScaleAndOrigin() {
    this.originX = window.innerWidth / 2;
    this.originY = window.innerHeight / 2;
    this.scale = 1;
    this.originXScaleOffset = 0;
    this.originYScaleOffset = 0;
    this.originXPanOffset = 0;
    this.originYPanOffset = 0;
  }

  changeHoverColor($event: string) {
    this.hoverColour = $event;
  }

  setSelectedTool(tool: Tools) {
    this.canvasStateService.setSelectedTool(tool);
  }

  setSelectedBrushSize(brushSize: BrushSize) {
    this.canvasStateService.setSelectedBrushSize(brushSize);
  }

  setSelectedColour(colour: string) {
    this.canvasStateService.setSelectedColour(colour);
  }

  wipePlotDrawing(plotId?: number, ownerId?: number) {
    if (!plotId && !ownerId) {
      console.error(`Plot ID and Owner must be specified to wipe a plot`);
      return;
    }
    this.plotService.wipePlotDrawing(plotId!, ownerId!).subscribe();
  }

  banUserAndDeletePlot(plotId?: number, ownerId?: number) {
    if (!plotId && !ownerId) {
      console.error(`Plot ID and Owner must be specified to delete a plot and ban the owner`);
      return;
    }
    this.plotService.banUserAndDeletePlot(plotId!, ownerId!).subscribe();
  }

  setScale(scale: number) {
    this.scale = scale;
    this.calculateScaleOffsets();
  }

  private calculateScaleOffsets() {
    this.originXScaleOffset = (this.originXPanOffset * this.scale) - this.originXPanOffset;
    this.originYScaleOffset = (this.originYPanOffset * this.scale) - this.originYPanOffset;
  }
}
