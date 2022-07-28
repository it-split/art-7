import { AfterLoad, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Plot } from "./plot.entity";

@Entity()
export class PlotHistory {
    @AfterLoad()
    bufferToString() {
        if (Buffer.isBuffer(this.data)) {
            this.data = this.data.toString();
        }
    }

    @PrimaryGeneratedColumn()
    id?: number;

    @ManyToOne(() => Plot, { nullable: false })
    plot?: Plot;

    @Column({ type: "number" })
    plotId?: number;

    @Column({ type: "blob" })
    data: string;

    @CreateDateColumn()
    createdAt: Date;
}