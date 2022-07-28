import {
    AfterLoad,
    Column,
    CreateDateColumn, DeleteDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { IUser, User } from "../user/user.entity";

@Entity()
export class Plot {
    @AfterLoad()
    bufferToString() {
        if (Buffer.isBuffer(this.data) && this.data) {
            this.data = this.data.toString();
        }
    }

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, { nullable: false })
    owner: User;

    @Column({ nullable: false })
    ownerId: number;

    @Column({ type: "int" })
    x: number;

    @Column({ type: "int" })
    y: number;

    @Column({ type: "blob", nullable: true })
    data?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}

export interface IPlot {
    id?: number;
    owner?: IUser | number;
    x?: number;
    y?: number;
    data?: string;
}