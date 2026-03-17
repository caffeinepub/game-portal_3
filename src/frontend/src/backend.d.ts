import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Score {
    score: bigint;
    timestamp: Time;
    playerName: string;
}
export type Time = bigint;
export interface backendInterface {
    clearScores(): Promise<void>;
    getAllGameScores(): Promise<Array<[string, Array<Score>]>>;
    getTopScores(game: string): Promise<Array<Score>>;
    submitScore(game: string, playerName: string, score: bigint): Promise<void>;
}
