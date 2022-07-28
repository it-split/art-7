import { Controller, Get, Logger } from "@nestjs/common";
import { IUsersDto } from "./users.dto";
import { PlotService } from "../plot/plot.service";
import { UserService } from "./user.service";

@Controller('users')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(
        private readonly plotService: PlotService,
        private readonly userService: UserService,
    ) {}

    @Get()
    public async getUsers(): Promise<IUsersDto> {
        this.logger.log(`Retrieving all plots`);
        return this.userService.findAllAsDto();
    }
}