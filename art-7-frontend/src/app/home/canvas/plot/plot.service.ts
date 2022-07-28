import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { IPlot, PlotsDto } from "./plot.model";
import { SERVER_API_URL } from "../../../app.constants";
import { Observable } from "rxjs";
import { IAccount } from "../../../auth/account.model";

@Injectable({ providedIn: 'root' })
export class PlotService {
  constructor(private http: HttpClient) {}

  public findAll(): Observable<HttpResponse<PlotsDto>> {
    return this.http.get<PlotsDto>(`${SERVER_API_URL}/plot/all`, { observe: 'response' })
  }

  claimPlot(x: number, y: number): Observable<HttpResponse<IPlot>> {
    return this.http.post<IPlot>(
      `${SERVER_API_URL}/plot/claim`,
      { x, y },
      { observe: 'response' }
    );
  }

  getPlotOwner(plotId: number): Observable<HttpResponse<IAccount>> {
    return this.http.get<IAccount>(`${SERVER_API_URL}/plot/${plotId}/owner`, { observe: 'response' })
  }

  getPlotCoords(plotId: number): Observable<HttpResponse<{ x: number, y: number }>> {
    return this.http.get<{x: number, y: number}>(`${SERVER_API_URL}/plot/${plotId}/coords`, { observe: 'response'})
  }

  wipePlotDrawing(plotId: number, ownerId: number) {
    console.warn(`Wiping user ${ownerId}'s plot ${plotId}`);
    return this.http.get<any>(`${SERVER_API_URL}/plot/${plotId}/wipe`);
  }

  banUserAndDeletePlot(plotId: number, ownerId: number) {
    console.warn(`Banning user ${ownerId} and wiping plot ${plotId}`);
    return this.http.get<any>(`${SERVER_API_URL}/plot/${plotId}/ban`);
  }
}
