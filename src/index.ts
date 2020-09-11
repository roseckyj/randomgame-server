import { player, messageUpdate, serverPlayer, messageMapRequest, messageMapChunk } from './messageTypes';

const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);

const PORT = process.env.PORT || 80;

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
        const basicFloor = new Array(16).fill(new Array(16).fill(1));

        const response: messageMapChunk = {
            x: data.x,
            y: data.y,
            ground: basicFloor,
            objects: []
        }
        socket.emit('mapChunk', response);
    });
});
