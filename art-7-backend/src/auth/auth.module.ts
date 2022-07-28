import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./local.strategy";
import { AuthController } from "./auth.controller";
import { UserModule } from "../entities/user/user.module";
import { SessionSerializer } from "./session.serializer";

@Module({
  imports: [UserModule, PassportModule.register({
    session: true,
  })],
  providers: [AuthService, LocalStrategy, SessionSerializer],
  controllers: [AuthController]
})
export class AuthModule {
}
