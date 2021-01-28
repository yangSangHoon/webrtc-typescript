export default class Signaling {
    private io: any;
    private sockets: any = {};

    private readonly port: number = 0;

    constructor(port: number) {
        this.port = port;
    }

    public setSocketIO(server: any): void {
        this.io = require('socket.io').listen(server);
        this.setIOEvent()
    }

    private setIOEvent(): void {
        this.io.sockets.on('connection', this.setSocket.bind(this));
    }

    private setSocket(socket: any): void {
        const socketId = socket.id;
        this.sockets[socketId] = socket;

        socket.on('disconnect', () => {
            delete this.sockets[socketId]
        });

        socket.on('join', () => {
            for (const key in this.sockets) {
                this.sockets[key].emit('addPeer', {'peer_id': socketId, 'should_create_offer': false});
                socket.emit('addPeer', {'peer_id': key, 'should_create_offer': true});
            }
        });

        socket.on('relayICECandidate', (config: any) => {
            const peer_id = config.peer_id;
            const ice_candidate = config.ice_candidate;
            console.log('[' + socket.id + '] relaying ICE candidate to [' + peer_id + '] ', ice_candidate);

            if (peer_id in this.sockets) {
                this.sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
            }
        });

        socket.on('relaySessionDescription', (config: any) => {
            var peer_id = config.peer_id;
            var session_description = config.session_description;
            console.log('[' + socket.id + '] relaying session description to [' + peer_id + '] ', session_description);

            if (peer_id in this.sockets) {
                this.sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
            }
        });
    }
}
