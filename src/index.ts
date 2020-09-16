import { player, messageUpdate, serverPlayer, messageMapRequest, messageMapChunk } from './messageTypes';

const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);
import SimplexNoise from 'simplex-noise';

const PORT = process.env.PORT || 80;

const seed = "0000000000"; //Math.floor(Math.random() * 10000000000);
const simplex = new SimplexNoise(seed.toString());

Http.listen(PORT, () => {
    console.info('██████████████████████████████████████████');
    console.info(`API is running at http://localhost:${PORT}`);
    console.info(`Server seed is ${seed}`);
});

var players: { [key: string]: player } = {};
var metadata: { [key: string]: serverPlayer } = {};

var requestify = require('requestify');
upkeep(process.env.UPKEEP_URL || "http://localhost:80/", 10000);

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
    } while (Object.keys(players).includes(id.toString()));

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
                objects: [],
            };
            socket.emit('mapChunk', response);
        });
    });
});

async function generateChunk(chunkX: number, chunkY: number) {
    let chunkData: number[][] = [];

    for (let x = 0; x < 16; x++) {
        chunkData[x] = [];
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
    const WATER_SCALE = 0.004;
    const BIOME_SCALE = 0.0008;
    const FORREST_SCALE = 0.005;

    const river = simplex.noise3D(x * WATER_SCALE, y * WATER_SCALE, 0);
    const biome =
        (simplex.noise2D(x * BIOME_SCALE, y * BIOME_SCALE + 200) + simplex.noise2D(x * 0.02, y * 0.02 + 400) * 0.2) /
        1.2;
    const forrest = simplex.noise2D(x * FORREST_SCALE, y * FORREST_SCALE + 100);

    /*
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
    */

    if (biome < -0.3) {
        // Ocean (water)
        if (forrest < -0.6 && river < -0.5) {
            // Island
            return 1;
        }
        return 2;
    }

    if (forrest < -0.7) {
        // Lake (water)
        return 2;
    }
    return 1; // Grass
}

async function upkeep(upkeepURL: string, interval: number) {
    setInterval(() => {
        requestify.get(upkeepURL).then(() => {});
    }, interval); 
}