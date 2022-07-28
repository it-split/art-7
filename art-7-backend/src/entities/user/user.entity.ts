import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn
} from "typeorm";
import { IPlot, Plot } from "../plot/plot.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn()
    @Column({ type: "varchar", length: 32, nullable: false, unique: true })
    username: string;

    @OneToOne(() => Plot, { nullable: true })
    plot?: Plot | IPlot;

    @Column({ nullable: true })
    plotId?: number;

    @Column({ type: "varchar", length: 32, nullable: false })
    displayName: string;

    @Column({ type: "boolean", default: false, nullable: false })
    isVerified: boolean;

    @Column({ type: "boolean", default: false, nullable: false })
    isAdmin: boolean;

    @Column({ type: "boolean", default: true, nullable: false })
    canDraw: boolean;

    @Column({ type: "boolean", default: true, nullable: false })
    canChat: boolean;

    @Column({ nullable: false })
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

export interface IUser {
    id: number;
    username: string;
    isVerified: boolean;
    plotId?: number;
    isAdmin: boolean;
}