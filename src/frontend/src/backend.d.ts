import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CoordEntry {
    id: bigint;
    username: string;
    coord: string;
    timestamp: bigint;
}
export interface backendInterface {
    addEntry(timestamp: bigint, coord: string, username: string): Promise<bigint>;
    addMultipleEntries(inputEntries: Array<[bigint, string, string]>): Promise<bigint>;
    getAllEntries(): Promise<Array<CoordEntry>>;
    removeEntry(id: bigint): Promise<void>;
}
