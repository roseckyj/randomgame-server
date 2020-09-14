import { player, messageUpdate, serverPlayer, messageMapRequest, messageMapChunk } from './messageTypes';

const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);
import SimplexNoise from 'simplex-noise';

const PORT = process.env.PORT || 80;

const simplex = new SimplexNoise()

Http.listen(PORT, () => {
    console.info('██████████████████████████████████████████');
    console.info(`API is running at http://localhost:${PORT}`);
});

var players: { [key: string]: player } = {};
var metadata: { [key: string]: serverPlayer } = {};

setInterval(() => {
    Object.keys(players).forEach((key) => {
        if (Math.abs((metadata[key].timeout as number) - ((new Date() as any) as number)) > 2000) {
            delete players[key];
            console.log('Disconnected user due to inactivity: id = ', key);
        }
    });

    Socketio.emit('players', players);
}, 100);

Socketio.on('connection', (socket: SocketIO.Socket) => {
    let id = 0;
    do {
        id = Math.floor(Math.random() * 1000000);
    } while(Object.keys(players).includes(id.toString()));

    let idStr = id.toString();
    console.log('Connected new user: id = ', idStr);

    const newPlayer: player = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
    players[idStr] = newPlayer;
    metadata[idStr] = { timeout: new Date() };

    socket.emit('id', idStr);
    socket.emit('players', players);

    socket.on('update', (data: messageUpdate) => {
        players[data.id] = data.content;
        if (!Object.keys(metadata).includes(data.id)) {
            metadata[data.id] = { timeout: new Date() };
        }
        metadata[data.id].timeout = new Date();
    });

    socket.on('mapRequest', (data: messageMapRequest) => {
        generateChunk(data.x, data.y).then((floor) => {
            const response: messageMapChunk = {
                x: data.x,
                y: data.y,
                ground: floor,
                objects: []
            }
            socket.emit('mapChunk', response);
        });
    });
});

async function generateChunk(chunkX: number, chunkY: number) {
    let chunkData:number[][] = [];

    for (let x = 0; x < 16; x++) {
        chunkData[x] = []
    }

    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
            chunkData[x].push(getTerrain(chunkX * 16 + x, chunkY * 16 + y));
        }
    }

    //chunkData.forEach((row) => console.log(row.join("")));

    return chunkData;
}

function getTerrain(x: number, y: number): number {
    const NOISE_SCALE = 0.02;

    const water = simplex.noise2D(x * NOISE_SCALE, y * NOISE_SCALE);
    const forrest = simplex.noise2D(x * NOISE_SCALE, y * NOISE_SCALE + 200);

    if (water > 0.7) {
        return 2; // Lake (water)
    }
    if (water > 0.6 && forrest < -0.3) {
        return 4; // Sand
    }
    if (forrest > 0.4) {
        return 3; // Forrest
    }
    return 1; // Grass
}