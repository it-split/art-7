import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
    @Inject(ConfigService)
    private readonly config: ConfigService;

    public createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'mariadb',
            host: this.config.get<string>('DATABASE_HOST'),
            port: +this.config.get<number>('DATABASE_PORT'),
            database: this.config.get<string>('DATABASE_NAME'),
            username: this.config.get<string>('DATABASE_USER'),
            password: this.config.get<string>('DATABASE_PASSWORD'),
            entities: ['dist/**/*.entity.{ts,js}'],
            migrations: ['dist/migrations/*.{ts,js}'],
            migrationsTableName: 'typeorm_migrations',
            synchronize: this.config.get<boolean>('SYNC_DATABASE'),
            keepConnectionAlive: true,
        };
    }
}