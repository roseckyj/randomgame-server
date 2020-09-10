export interface player {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
}

export interface messageUpdate {
    id: number;
    content: player;
}
