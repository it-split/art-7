import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { ILogin } from "./login.interface";
import { SERVER_API_URL } from "../app.constants";
import { IAccount } from "./account.model";
import { ReplaySubject, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SocketService } from "../shared/websocket/socket.service";
import { CookieService } from "ngx-cookie-service";

@Injectable({providedIn: 'root'})
export class AuthService {
  private identity: IAccount | null = null;
  public authenticationState = new ReplaySubject<IAccount | null>(1);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private socketService: SocketService,
    private cookieService: CookieService,
  ) {
    const hasSessionCookie = cookieService.check('art7.session');
    if (!hasSessionCookie) {
      console.warn('Session cookie not found, clearing identity');
      localStorage.removeItem('identity');
      this.identity = null;
    }

    const storedIdentity = localStorage.getItem('identity');
    if (storedIdentity?.length) {
      try {
        this.identity = JSON.parse(storedIdentity);
      } catch (e) {
        console.error('Error parsing identity');
        localStorage.removeItem('identity');
        cookieService.delete('art7.session');
        this.identity = null;
      }
    }
    this.authenticationState.next(this.identity);
  }

  public login(login: ILogin, callback: (success: boolean) => void): Subscription {
    return this.http.post<IAccount>(`${SERVER_API_URL}/auth/login`, login, {observe: 'response'})
      .subscribe(
        {
          next: (result: HttpResponse<IAccount>) => {
            if (result.body) {
              console.log(result)
              console.info('Login success')
              this.identity = result.body;
              localStorage.setItem('identity', JSON.stringify(this.identity));
              this.authenticationState.next(this.identity);
              this.snackBar.open(`✨ Logged in`);
            }
            callback(true);
          },
          error: (error: HttpErrorResponse) => {
            switch (error.error?.message) {
              case 'error.userNotFound':
                this.snackBar.open(`⚠️ Username not found`);
                break;
              case 'Unauthorized':
                this.snackBar.open(`⚠️ Wrong username/password`);
                break;
              default:
                this.snackBar.open(`⚠️ Error signing in: ${error.error?.message}`);
            }
            callback(false);
          }
        })
  }

  public register(username: string, password: string, callback: (success: boolean) => void): Subscription {
    return this.http.post<IAccount>(`${SERVER_API_URL}/auth/register`,
      {
        username,
        password
      },
      {observe: 'response'}
    )
      .subscribe(
        {
          next: (result: HttpResponse<IAccount>) => {
            if (result.body) {
              console.info('Registration success');
              this.snackBar.open(`✨ Welcome to Art 7`);
            }
            callback(true);
          },
          error: (error: HttpErrorResponse) => {
            switch (error.error?.message) {
              case 'error.duplicateUser':
                this.snackBar.open(`⚠️ Username already taken? Message split if your name was stolen`);
                break;
              case 'error.unknown':
                this.snackBar.open(`⚠️ Unknown error occurred, try messaging split`);
                break;
              case 'Unauthorized':
                this.snackBar.open(`⚠️ Ran into an authorization issue, try signing out/in`);
                break;
              default:
                this.snackBar.open(`⚠️ Error registering: ${error.error?.message}`);
            }
            callback(false);
          }
        })
  }

  public logout(): void {
    return this.http.get(`${SERVER_API_URL}/auth/logout`).subscribe({
      next: () => {
        console.info('Logged out')
      },
      error: (error: HttpErrorResponse) => {
        console.error(`Error logging out`, error.message);
      }
    }).add(() => {
      localStorage.removeItem('identity');
      this.cookieService.delete('art7.session')
      this.socketService.handleLogout();
      this.identity = null;
      this.authenticationState.next(null);
    })
  }

  setOwnedPlot(id: number | undefined) {
    console.log(`setting owned plot to ${id}`)
    if (this.identity) {
      this.identity.plotId = id;
      localStorage.setItem('identity', JSON.stringify(this.identity));
    }
    this.authenticationState.next(this.identity);
  }
}
