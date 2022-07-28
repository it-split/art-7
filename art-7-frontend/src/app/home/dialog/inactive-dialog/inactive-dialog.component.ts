import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: 'inactive-dialog',
  templateUrl: './inactive-dialog.component.html',
  styleUrls: ['./inactive-dialog.component.scss']
})
export class InactiveDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<InactiveDialogComponent>,
  ) {}

  refreshPage() {
    window.location.reload();
  }
}
