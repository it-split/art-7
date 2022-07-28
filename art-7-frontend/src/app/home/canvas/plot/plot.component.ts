import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import { IPlot } from "./plot.model";
import { AuthService } from "../../../auth/auth.service";
import { IAccount } from "../../../auth/account.model";
import { PlotService } from "./plot.service";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { BrushSize, Tools } from "../canvas.component";
import { IPaintStroke } from "./paint-stroke.interface";
import { IPlotUpdatePacket, SocketService } from "../../../shared/websocket/socket.service";
import { environment } from "../../../../environments/environment";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SettingsService } from "../../settings/settings.service";
import { CanvasHelpers } from "../../../shared/canvas.helpers";

@Component({
  selector: 'canvas-plot',
  templateUrl: './plot.component.html',
  styleUrls: ['./plot.component.scss']
})
export class PlotComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas')
  public canvasRef!: ElementRef;
  public canvas: HTMLCanvasElement = <HTMLCanvasElement>{};
  private context?: CanvasRenderingContext2D | null = null;

  @Input() plot?: IPlot;
  @Input() scale!: number;
  @Input() selectedBrushSize!: BrushSize;
  @Input() selectedColor!: string;
  @Input() selectedTool!: Tools;

  @Input() canvasPositionX!: number;
  @Input() canvasPositionY!: number;

  @Input() drawingEnabled!: boolean;

  @Output() onClaim: EventEmitter<any> = new EventEmitter<any>();
  // Output the colour currently being hovered over
  @Output() hoverColour: EventEmitter<string> = new EventEmitter<string>();

  @Output() onWipePlotDrawing: EventEmitter<any> = new EventEmitter<any>();
  // Emits userId
  @Output() onBanAndDeletePlot: EventEmitter<number> = new EventEmitter<number>();

  currentUser?: IAccount | null;
  owner?: IAccount;
  ownedByCurrentUser = false;

  isPainting = false;
  isHovering = false;

  private sendDataCooldown = false;
  showClaimablePlots = true;

  constructor(
    private plotService: PlotService,
    private authService: AuthService,
    private socketService: SocketService,
    private snackbar: MatSnackBar,
    private settingsService: SettingsService,
  ) {
  }

  ngAfterViewInit(): void {
    if (this.plot?.id) {
      this.canvas = <HTMLCanvasElement>this.canvasRef.nativeElement;
      this.context = this.canvas.getContext('2d');
      // Fill with white by default
      if (this.context) {
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, 100, 100);
      }
      if (this.plot?.data) {
        const img = new Image();
        img.onload = () => this.context?.drawImage(img, 0, 0);
        img.src = this.plot.data;
      }
    }
  }

  ngOnInit(): void {
    this.settingsService.settingsState.subscribe((settings) => {
      this.showClaimablePlots = settings.showClaimablePlots;
    })
    this.authService.authenticationState.subscribe((account) => {
      this.currentUser = account;
      if (!account) {
        this.ownedByCurrentUser = false;
      } else {
        this.ownedByCurrentUser = account.id === this.owner?.id
      }
    })
    if (this.plot?.id) {
      this.plotService.getPlotOwner(this.plot?.id).subscribe({
        next: (res: HttpResponse<IAccount>) => {
          if (res.body) {
            this.owner = res.body;
            if (this.owner?.id === this.currentUser?.id) {
              this.ownedByCurrentUser = true;
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error(`Error fetching owner of plot ${this.plot?.id}: ${error.message}`);
        }
      })
    }
  }

  updateWithData(update: IPlotUpdatePacket) {
    if (this.isHovering && this.ownedByCurrentUser) {
      return;
    }
    const img = new Image();
    img.onload = () => this.context?.drawImage(img, 0, 0);
    img.src = update.imageData;
  }

  tryClaimPlot() {
    if (this.currentUser && !this.currentUser.plotId) {
      this.onClaim.emit();
    }
  }

  tryWipePlotDrawing() {
    if (this.plot?.id) {
      this.onWipePlotDrawing.emit();
    }
  }

  tryBanUserAndDeletePlot() {
    if (this.plot?.id || this.plot?.ownerId) {
      this.onBanAndDeletePlot.emit();
    }
  }

  getPlotClass(): string {
    if (this.plot?.claimable) {
      if (this.currentUser && !this.currentUser.plotId) {
        return 'claimable-plot'
      } else {
        return 'unclaimable-plot'
      }
    } else {
      // 🍝🍝🍝🍝🍝
      let plotClasses;
      if (this.ownedByCurrentUser) {
        plotClasses = 'current-users-plot';
      } else {
        plotClasses = 'claimed-plot'
      }
      if (this.selectedTool === 'INFO' || this.selectedTool === 'ADMIN') {
        plotClasses += ' plot-info';
      }
      return plotClasses;
    }
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  private onPressDown(event: MouseEvent | TouchEvent) {
    if (this.selectedTool === Tools.Paint && this.ownedByCurrentUser) {
      if (this.drawingEnabled) {
        this.isPainting = true;
        // Draw stroke on start location
        this.drawStrokeFromEvent(event);
      } else {
        this.snackbar.open('⚠️ Drawing is disabled!');
      }
    }
  }

  @HostListener('touchmove', ['$event'])
  @HostListener('mousemove', ['$event'])
  private onMove(event: MouseEvent | TouchEvent) {
    if (this.selectedTool === Tools.ColourPicker && !this.plot?.claimable) {
      const adjustedCoords = this.getRelativeCoords(CanvasHelpers.getEventCoords(event));
      const pixelData = this.context!.getImageData(adjustedCoords.x, adjustedCoords.y, 1, 1).data;
      this.hoverColour.emit(CanvasHelpers.pixelDataToHex(pixelData));
      return;
    }
    if (!this.isPainting || this.selectedTool !== Tools.Paint || !this.ownedByCurrentUser) {
      return;
    }
    event.preventDefault();
    if (!this.drawingEnabled) { return; }

    this.drawStrokeFromEvent(event);
  }

  @HostListener('touchend')
  @HostListener('mouseup')
  private onReleaseUp() {
    if (!this.drawingEnabled) { return; }

    this.sendCanvasDataToServer(true);
    this.isPainting = false;
  }

  getCanvasData(): string {
    return this.canvas?.toDataURL();
  }

  private getRelativeCoords(coords: { x: number, y: number }): { x: number, y: number } {
    const offsets = this.canvas.getBoundingClientRect();

    coords.x -= (offsets.left);
    coords.y -= (offsets.top);

    coords.x = Math.floor(coords.x / this.scale);
    coords.y = Math.floor(coords.y / this.scale);

    return coords;
  }

  private drawStrokeFromEvent(event: TouchEvent | MouseEvent): void {
    let coords = CanvasHelpers.getEventCoords(event);
    coords = this.getRelativeCoords(coords);

    const stroke = <IPaintStroke>{
      x: coords.x,
      y: coords.y,
      color: this.selectedColor
    };
    this.drawStroke(stroke);
    this.sendCanvasDataToServer();
  }

  private sendCanvasDataToServer(overrideCooldown: boolean = false): void {
    if ((overrideCooldown || !this.sendDataCooldown) && this.ownedByCurrentUser) {
      try {
        this.socketService.sendCanvasToServer(this.plot?.id ?? -1, this.getCanvasData());
      } catch (e) {
        console.error(`Error sending data to server, ${e}`);
        this.snackbar.open('☠️ Error sending data to server, try refreshing the page');
      }
      this.sendDataCooldown = true;
      setTimeout(() => this.sendDataCooldown = false, environment.sendCanvasDataCooldown);
    }
  }

  private drawStroke(stroke: IPaintStroke): void {
    this.context!.beginPath();
    this.context!.fillStyle = stroke.color;
    this.context!.arc(stroke.x, stroke.y, (this.selectedBrushSize / 10), 0, 2 * Math.PI);
    this.context!.fill();
  }

  handleMouseEnter($event: MouseEvent) {
    this.isHovering = true
    if (!$event.buttons) {
      this.isPainting = false;
    }
  }
}
