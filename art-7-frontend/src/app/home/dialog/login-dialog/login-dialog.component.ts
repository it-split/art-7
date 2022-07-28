import { Component } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { AuthService } from "../../../auth/auth.service";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.scss']
})
export class LoginDialogComponent {
  isLoggingIn = false;
  loginForm: FormGroup = this.fb.group({
    username: [null, [Validators.required, Validators.min(1), Validators.max(32)]],
    password: [null, [Validators.required]]
  })

  constructor(
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  tryLogin(): void {
    console.info('Attempting login')
    if (this.loginForm.status !== 'VALID') {
      return;
    }
    this.isLoggingIn = true;
    this.authService.login({
      username: this.loginForm.get(['username'])!.value,
      password: this.loginForm.get(['password'])!.value
    }, (success: boolean) => {
      if (success) {
        this.dialogRef.close();
      }
    }).add(() => { this.isLoggingIn = false; })
  }
}
