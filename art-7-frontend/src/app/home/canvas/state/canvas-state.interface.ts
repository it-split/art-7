import { BrushSize, Tools } from "../canvas.component";

export interface ICanvasState {
  selectedTool: Tools;
  selectedBrushSize: BrushSize;
  selectedColour: string;
}
