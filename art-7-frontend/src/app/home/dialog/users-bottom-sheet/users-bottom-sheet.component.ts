import { Component, OnInit } from "@angular/core";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { IUsersDto } from "./users.dto";
import { UsersService } from "./users.service";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { PlotService } from "../../canvas/plot/plot.service";
import { CanvasStateService } from "../../canvas/state/canvas-state.service";

@Component({
  selector: 'users-bottom-sheet',
  templateUrl: './users-bottom-sheet.component.html',
  styleUrls: ['./users-bottom-sheet.component.scss']
})
export class UsersBottomSheetComponent implements OnInit {
  users?: IUsersDto;
  isLoading = false;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<UsersBottomSheetComponent>,
    private usersService: UsersService,
    private snackbar: MatSnackBar,
    private plotService: PlotService,
    private canvasStateService: CanvasStateService,
  ) {}

  ngOnInit(): void {
    this.bottomSheetRef.afterOpened().subscribe(() => {
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService.getUsersList().subscribe({
      next: (res) => {
          this.users = res.body ?? undefined;
      },
      error: (err: HttpErrorResponse) => {
        console.error(`error retrieving users: ${err.message}`);
        this.snackbar.open(`☠️ Error retrieving users`);
      }
    }).add(() => {
      this.isLoading = false;
    });
  }

  jumpToPlot(plotId?: number) {
    if (plotId) {
      this.isLoading = true;
      this.plotService.getPlotCoords(plotId).subscribe({
        next: (coords) => {
          if (coords.body) {
            this.canvasStateService.jumpToCoords.next(coords.body);
            this.bottomSheetRef.dismiss()
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('error retrieving plot coords', error);
          this.snackbar.open('☠️ Error jumping to plot')
        }
      }).add(() => this.isLoading = false);
    }
  }
}
