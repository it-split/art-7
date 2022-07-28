import { Injectable } from "@angular/core";
import { ReplaySubject, Subject } from "rxjs";
import { ICanvasState } from "./canvas-state.interface";
import { BrushSize, Tools } from "../canvas.component";

@Injectable({ providedIn: 'root' })
export class CanvasStateService {
  // Default music settings
  private state: ICanvasState = {
    selectedTool: Tools.Pan,
    selectedBrushSize: BrushSize.Medium,
    selectedColour: '#000000'
  }
  public canvasState = new ReplaySubject<ICanvasState>(1);
  public jumpToCoords = new Subject<{x: number, y: number}>();

  constructor() {
    this.state.selectedTool = JSON.parse(localStorage.getItem('selectedTool') ?? `"${Tools.Pan}"`);
    this.state.selectedBrushSize = JSON.parse(localStorage.getItem('selectedBrushSize') ?? `${BrushSize.Small}`);
    this.state.selectedColour = JSON.parse(localStorage.getItem('selectedColour') ?? '"#000000"');
    this.setCanvasState();
  }

  public setSelectedTool(val: Tools) {
    this.state.selectedTool = val;
    localStorage.setItem('selectedTool', JSON.stringify(val));
    this.setCanvasState();
  }

  public setSelectedBrushSize(val: BrushSize) {
    this.state.selectedBrushSize = val;
    localStorage.setItem('selectedBrushSize', JSON.stringify(val));
    this.setCanvasState();
  }

  public setSelectedColour(val: string) {
    this.state.selectedColour = val;
    localStorage.setItem('selectedColour', JSON.stringify(val));
    this.setCanvasState();
  }

  private setCanvasState(): void {
    this.canvasState.next(this.state);
  }
}
