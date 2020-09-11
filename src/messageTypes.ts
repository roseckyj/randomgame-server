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

export interface messageMapRequest {
    x: number;
    y: number;
}

export interface messageMapChunk {
    x: number;
    y: number;
    ground: number[][];
    objects: gameObject[];
}

export interface gameObject {
    x: number;
    y: number;
    type: number;
    data: any;
}
