export interface playerMetadata {
    timeout: Date;
}
export interface player {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
}

export interface messageUpdate {
    id: string;
    content: player;
}
