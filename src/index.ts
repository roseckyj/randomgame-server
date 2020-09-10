import { player, messageUpdate } from './messageTypes';

const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);

const PORT = process.env.PORT || 80;

Http.listen(PORT, () => {
    console.info('██████████████████████████████████████████');
    console.info(`API is running at http://localhost:${PORT}`);
    // Note: usefull in future> displayRoutes(app);
});

var players: { [key: string]: player } = {};

setInterval(() => {
    Socketio.emit('players', players);
}, 100);

Socketio.on('connection', (socket: SocketIO.Socket) => {
    let id = 0;
    for (let i = Math.random(); Object.keys(players).includes(id.toString()); i = Math.random()) {
        id = i;
    }

    let idStr = id.toString();

    const newPlayer: player = { x: 0, y: 0, velocityX: 0, velocityY: 0 };
    players[idStr] = newPlayer;

    socket.emit('id', idStr);
    socket.emit('players', players);

    socket.on('update', (data: messageUpdate) => {
        players[data.id] = data.content;
    });
});
