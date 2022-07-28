import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Settings {
    @PrimaryColumn()
    id: number;

    @Column({ type: "boolean", default: false, nullable: false })
    registrationEnabled: boolean;

    @Column({ type: "boolean", default: false, nullable: false })
    plotClaimingEnabled: boolean;

    @Column({ type: "boolean", default: false, nullable: false })
    drawingEnabled: boolean;

    @Column({ type: "boolean", default: false, nullable: false })
    chatEnabled: boolean;

    @UpdateDateColumn()
    updatedAt?: Date;
}