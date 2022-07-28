import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, Observable, of, throwError } from "rxjs";
import { AuthService } from "./auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Injectable()
export class HandleErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private snackbar: MatSnackBar) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true
    });

    return next.handle(request).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: any) {
    if (error.status === 403) {
      this.snackbar.open('☠️ Something went wrong, signing out');
      this.authService.logout();
      return of(error.message);
    }
    return throwError(error);
  }
}
