import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './entities/user/user.module';
import { getEnvPath } from '../../vetspoke/apps/api/src/app/environment/env.helper';
import { TypeormConfigService } from './shared/typeorm-config.service';
import { PlotModule } from './entities/plot/plot.module';
import { WebsocketModule } from './shared/websocket/websocket.module';
import { SettingsModule } from './admin/settings/settings.module';

const envFilePath: string = getEnvPath(`${__dirname}/common/environment`);

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath, isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: TypeormConfigService }),
    AuthModule,
    UserModule,
    PlotModule,
    WebsocketModule,
    SettingsModule,
  ],
})
export class AppModule {}
