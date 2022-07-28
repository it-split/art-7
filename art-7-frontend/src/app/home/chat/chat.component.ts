import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { IChatMessage, SocketService } from "../../shared/websocket/socket.service";
import { AuthService } from "../../auth/auth.service";
import { FormControl, Validators } from "@angular/forms";
import { IAccount } from "../../auth/account.model";
import { SettingsService } from "../settings/settings.service";
import { ServerSettingsService } from "../settings/server-settings.service";
import { IServerSettings } from "../settings/settings.interface";
import { map, Observable, shareReplay } from "rxjs";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { environment } from "../../../environments/environment";
import { UsersBottomSheetComponent } from "../dialog/users-bottom-sheet/users-bottom-sheet.component";
import { MatBottomSheet } from "@angular/material/bottom-sheet";

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  @ViewChild('messagesContainer', { static: false })
  messagesContainer?: ElementRef;

  recentChatMessages: IChatMessage[] = [];
  chatMessages: IChatMessage[] = [];
  account?: IAccount | null;
  chatForm: FormControl = new FormControl({value: '', disabled: !this.account}, [Validators.max(5)])
  showChat = false;
  serverSettings?: IServerSettings | null;

  isHovering = false;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  bringToFront = false;
  defocusChatTimeout?: number;

  constructor(
    public authService: AuthService,
    public socketService: SocketService,
    public settingsService: SettingsService,
    public serverSettingsService: ServerSettingsService,
    private breakpointObserver: BreakpointObserver,
    private changeDetectorRef: ChangeDetectorRef,
    public bottomSheet: MatBottomSheet
  ) {}

  ngOnInit(): void {
    this.socketService.receiveChat().subscribe((data) => {
      // Clear all chat messages when chat is disabled
      if (!data.username && data.msg === 'Chat has been disabled') {
        this.chatMessages = [];
      }
      this.chatMessages.unshift(data);
      this.recentChatMessages.unshift(data);
      setTimeout(() => this.recentChatMessages.pop(), environment.chat.recentChatMessageHideDelay ?? 15000);
    })
    this.socketService.receiveServerMessage().subscribe(data => {
      console.log(data);
      this.chatMessages.unshift(data)
      this.recentChatMessages.unshift(data);
      setTimeout(() => this.recentChatMessages.pop(), environment.chat.recentChatMessageHideDelay ?? 15000);
    })
    this.settingsService.settingsState.subscribe((settings) => {
      this.showChat = settings.showChat;
      (this.account && this.showChat && this.serverSettings?.chatEnabled) ? this.chatForm.enable() : this.chatForm.disable();
    })
    this.serverSettingsService.serverSettingsState.subscribe((serverSettings) => {
      this.serverSettings = serverSettings;
      (this.account && this.showChat && this.serverSettings?.chatEnabled) ? this.chatForm.enable() : this.chatForm.disable();
    })
    this.authService.authenticationState.subscribe((account) => {
      this.account = account;
      (account && this.showChat) ? this.chatForm.enable() : this.chatForm.disable();
    })
  }

  sendMessage() {
    const message: string = this.chatForm.value?.trim();
    if (message) {
      this.socketService.sendChat(message);
    }
    this.chatForm.patchValue('');
  }

  onMouseEnter() {
    // Reset the chat focus timeout
    if (this.defocusChatTimeout) {
      clearTimeout(this.defocusChatTimeout);
    }
    this.isHovering = true;
    this.changeDetectorRef.detectChanges();
    // Scroll to bottom of chat
    if (this.messagesContainer?.nativeElement != null) {
      this.messagesContainer!.nativeElement.scrollTop = 0;
    }
  }

  onMouseLeave() {
    // Set a timeout so the expanded chat disappears with a delay
    this.defocusChatTimeout = setTimeout(() => {
      this.isHovering = false;
      clearTimeout(this.defocusChatTimeout);
    }, environment.chat.chatBoxLoseFocusDelay ?? 5000)
  }

  openUsersBottomSheet() {
    this.bottomSheet.open(UsersBottomSheetComponent);
  }
}
