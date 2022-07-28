import { Component } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { AuthService } from "../../../auth/auth.service";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss']
})
export class RegisterDialogComponent {
  isRegistering = false;
  isLoggingIn = false;

  registerForm: FormGroup = this.fb.group({
    username: [null, [Validators.required, Validators.min(1), Validators.max(32)]],
    password: [null, [Validators.required, Validators.minLength(5)]],
    confirmPassword: [null, [Validators.required, Validators.minLength(5)]]
  }, {validators: passwordMatchingValidator})

  constructor(
    private dialogRef: MatDialogRef<RegisterDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
  }

  tryRegister(): void {
    console.info('Attempting registration')
    if (this.registerForm.status !== 'VALID') {
      return;
    }
    this.isRegistering = true;

    const username = this.registerForm.get(['username'])!.value;
    const password = this.registerForm.get(['password'])!.value;

    this.authService.register(username, password, (success: boolean) => {
      if (success) {
        this.tryLogin(username, password);
      }
    }).add(() => {
      this.isRegistering = false;
    })
  }

  private tryLogin(username: string, password: string): void {
    console.info('Attempting login')
    this.isLoggingIn = true;
    this.authService.login({
      username,
      password
    }, (success: boolean) => {
      if (success) {
        this.dialogRef.close();
      }
    }).add(() => {
      this.isLoggingIn = false;
    })
  }
}

export const passwordMatchingValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!confirmPassword?.value) { return null; }
  return password?.value === confirmPassword?.value ? null : {notMatched: true};
};
