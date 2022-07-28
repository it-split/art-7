import { BadRequestException, Body, Controller, Get, Logger, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from "./auth.service";
import { UserService } from "../entities/user/user.service";
import { LocalAuthGuard } from "./local.auth.guard";
import { IUser, User } from "../entities/user/user.entity";
import { SettingsService } from "../admin/settings/settings.service";

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
    ) {}

    @UseGuards(LocalAuthGuard)
    @Post('/login')
    public async login(
        @Request() request
    ): Promise<IUser> {
        this.logger.log(`User ${request.user?.username} logged in with session ID ${request.sessionID}`)
        return request.user;
    }

    @Post('/register')
    public async register(
        @Body('username') username: string,
        @Body('password') password: string,
    ): Promise<User> {
        if (!SettingsService.settings?.registrationEnabled) {
            throw new BadRequestException('error.registrationDisabled');
        }
        if (!username?.trim().length) {
            throw new BadRequestException('error.usernameLength');
        }
        if (password?.length < 4) {
            throw new BadRequestException('error.passwordLength');
        }
        this.logger.log(`Registering user ${username}`)
        try {
            const savedUser = await this.userService.registerUser(username, password);
            return savedUser;
        } catch (e: any) {
            switch (e.driverError?.code) {
                case 'ER_DUP_ENTRY':
                    this.logger.warn(`Error creating user, duplicate username ${username}`)
                    throw new BadRequestException('error.duplicateUser');
                default:
                    throw new BadRequestException(`error.unknown`);
            }
        }
    }

    @Get('/logout')
    public async logout(
        @Request() request
    ): Promise<boolean> {
        this.logger.log(`Session ${request.sessionID} ended`)
        request.logout();
        request.session.destroy();
        return true;
    }
}
