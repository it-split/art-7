import { Global, Injectable, NotImplementedException } from '@nestjs/common';
import { IUser, User } from "./user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcryptjs from 'bcryptjs';
import { IUsersDto } from "./users.dto";
import { AuthenticatedGateway } from "../../shared/websocket/authenticated.gateway";

@Injectable()
export class UserService {
    @InjectRepository(User)
    private readonly repository: Repository<User>;

    constructor(
        private readonly config: ConfigService
    ) {}

    async registerUser(username: string, password: string): Promise<User> {
        const saltOrRounds: number = +this.config.get<number>('BCRYPT_SALT_OR_ROUNDS');
        const hashedPassword = await bcryptjs.hash(password, saltOrRounds);
        return this.repository.save({
            username: username.toLowerCase(),
            displayName: username,
            password: hashedPassword
        });
    }

    async findOne(username: string): Promise<User> {
        return this.repository.findOne({
                where: {
                    username: username.toLowerCase()
                }
            }
        )
    }

    async setUserPlot(userId: number, plotId: number): Promise<IUser> {
        await this.repository.update(userId, { plotId: plotId })
        const updatedUser = await this.repository.findOne(userId);

        return {
            id: updatedUser.id,
            username: updatedUser.displayName,
            isVerified: updatedUser.isVerified,
            plotId: updatedUser.plotId,
            isAdmin: updatedUser.isAdmin
        }
    }

    async findOneByPlotId(plotId: number): Promise<User> {
        return this.repository.findOne({
            where: {
                plotId: plotId
            }
        });
    }

    async deleteUser(plotOwner: number) {
        return this.repository.softDelete(plotOwner)
    }

    async getUsersFromIds(userIds: number[]): Promise<IUser[]> {
        const users = await this.repository.findByIds(userIds);
        console.log('users', JSON.stringify(users.map((user: User) => {
            return {
                id: user.id,
                username: user.displayName,
                isVerified: user.isVerified,
                plotId: user.plotId,
                isAdmin: user.isAdmin,
            }
        })));
        return users.map((user: User) => {
            return {
                id: user.id,
                username: user.displayName,
                isVerified: user.isVerified,
                plotId: user.plotId,
                isAdmin: user.isAdmin,
            }
        })
    }

    async findAllAsDto(): Promise<IUsersDto> {
        const users = await this.repository.find();
        const dto = {
            onlineUsers: [],
            offlineUsers: []
        }
        users.map((user) => {
            if (AuthenticatedGateway.userIdToClientIds.get(user.id)?.length) {
                dto.onlineUsers.push(user);
            } else {
                dto.offlineUsers.push(user);
            }
        })
        return dto;
    }
}
