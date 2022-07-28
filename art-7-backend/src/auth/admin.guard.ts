import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
    private readonly logger = new Logger(AdminGuard.name);

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        if (!request.isAuthenticated()) { return false; }
        const user = request.user;
        this.logger.warn(`Admin request from user ${user.username} (${user.id})`)
        if (!user) { return false; }
        return user.isAdmin;
    }
}