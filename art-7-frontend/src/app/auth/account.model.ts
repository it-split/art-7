export interface IAccount {
  id: number;
  username: string;
  isVerified: boolean;
  plotId?: number;
  isAdmin?: boolean;
}
