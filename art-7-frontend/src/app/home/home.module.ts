import { NgModule } from "@angular/core";
import { LoginDialogComponent } from "./dialog/login-dialog/login-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CanvasComponent } from "./canvas/canvas.component";
import { PlotComponent } from "./canvas/plot/plot.component";
import { RegisterDialogComponent } from "./dialog/register-dialog/register-dialog.component";
import { InfoDialogComponent } from "./dialog/info-dialog/info-dialog.component";
import { InactiveDialogComponent } from "./dialog/inactive-dialog/inactive-dialog.component";
import { ChatComponent } from "./chat/chat.component";
import { SettingsDialogComponent } from "./settings/settings-dialog/settings-dialog.component";
import { ErrorDialogComponent } from "./dialog/error-dialog/error-dialog.component";
import { UsersBottomSheetComponent } from "./dialog/users-bottom-sheet/users-bottom-sheet.component";

@NgModule({
  imports: [SharedModule],
  declarations: [
    CanvasComponent,
    PlotComponent,
    LoginDialogComponent,
    RegisterDialogComponent,
    InfoDialogComponent,
    InactiveDialogComponent,
    ChatComponent,
    SettingsDialogComponent,
    ErrorDialogComponent,
    UsersBottomSheetComponent,
  ],
  exports: [
    CanvasComponent,
    ChatComponent
  ]
})
export class HomeModule {}
