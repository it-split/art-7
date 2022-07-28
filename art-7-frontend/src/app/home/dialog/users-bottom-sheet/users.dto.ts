import { IAccount } from "../../../auth/account.model";

export interface IUsersDto {
  onlineUsers: IAccount[],
  offlineUsers: IAccount[]
}
