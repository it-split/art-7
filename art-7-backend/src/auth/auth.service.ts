import { Injectable, NotAcceptableException } from '@nestjs/common';
import { UserService } from "../entities/user/user.service";
import * as bcryptjs from 'bcryptjs';
import { IUser } from "../entities/user/user.entity";

@Injectable()
export class AuthService {
    constructor(private usersService: UserService) {}

    async validateUser(username: string, password: string): Promise<IUser | null> {
        const user = await this.usersService.findOne(username);
        if (!user) {
            throw new NotAcceptableException('error.userNotFound');
        }

        const passwordValid = await bcryptjs.compare(password, user.password);
        if (passwordValid) {
            return {
                id: user.id,
                username: user.displayName,
                isVerified: user.isVerified,
                plotId: user.plotId,
                isAdmin: user.isAdmin
            }
        }
        return null;
    }
}
