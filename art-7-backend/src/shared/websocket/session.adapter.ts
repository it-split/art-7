import { IoAdapter } from "@nestjs/platform-socket.io";
import { INestApplicationContext } from "@nestjs/common/interfaces";
import { Server, ServerOptions } from 'socket.io';
import * as passport from "passport";
import { RequestHandler } from "express";

export class SessionAdapter extends IoAdapter {
    private readonly sessionMiddleware: RequestHandler;

    constructor(session: RequestHandler, app: INestApplicationContext) {
        super(app)
        this.sessionMiddleware = session;
    }

    create(port: number, options?: ServerOptions & { namespace?: string; server?: any }): Server {
        const server: Server = super.create(port, options);

        const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

        server.use(wrap(this.sessionMiddleware));
        server.use(wrap(passport.initialize()));
        server.use(wrap(passport.session()));

        return server;
    }
}