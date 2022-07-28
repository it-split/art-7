export class CanvasHelpers {
  public static getEventCoords(event: TouchEvent | MouseEvent): { x: number, y: number } {
    const isTouch = ['touchmove', 'touchstart', 'touchend'].includes(event.type);

    let x, y;
    if (isTouch) {
      event = <TouchEvent>event;
      x = event.touches[0].pageX;
      y = event.touches[0].pageY;
    } else {
      event = <MouseEvent>event;
      x = event.clientX;
      y = event.clientY;
    }
    return {x, y}
  }

  public static pixelDataToHex(pixelData: Uint8ClampedArray): string {
    const r = CanvasHelpers.rgbComponentToHex(pixelData[0]);
    const g = CanvasHelpers.rgbComponentToHex(pixelData[1]);
    const b = CanvasHelpers.rgbComponentToHex(pixelData[2]);
    return `#${r}${g}${b}`;
  }

  private static rgbComponentToHex(component: number): string {
    const hex = component.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

}
