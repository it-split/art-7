import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUsersDto } from "./users.dto";
import { SERVER_API_URL } from "../../../app.constants";

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {
  }

  public getUsersList(): Observable<HttpResponse<IUsersDto>> {
    return this.http.get<IUsersDto>(`${SERVER_API_URL}/users`, { observe: 'response'});
  }
}
