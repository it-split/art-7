import { IUser } from "./user.entity";

export interface IUsersDto {
  onlineUsers: IUser[],
  offlineUsers: IUser[]
}
