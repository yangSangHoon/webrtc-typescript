class PeerConnectSocket {
    /** You should probably use a different stun server doing commercial stuff **/
    /** Also see: https://gist.github.com/zziuni/3741933 **/
    private ICE_SERVERS: Array<RTCIceServer> = [
        {urls: 'stun:stun.l.google.com:19302'}
    ];
    private signalingSocket: any;

    private peers: Array<any> = [];
    private mediaElements: Array<any> = [];
    private userMediaStream: any = null;

    constructor() {
        this.getUserMedia();
    }

    private getUserMedia(): void {
        navigator.getUserMedia({audio: true}, (mediaStream: MediaStream) => {
            this.userMediaStream = mediaStream;
            this.init();
        }, () => {
        });
    }

    private init(): void {
        this.signalingSocket = (window as any).io('ws://localhost:3000');
        this.signalingSocket.on('connect', () => {
            console.log('client connect');

            this.signalingSocket.emit('join');
        });

        this.signalingSocket.on('addPeer', (config: any) => {
            console.log('addPeer', config)
            const peerId = config.peer_id;

            if (peerId in this.peers) {
                /* This could happen if the user joins multiple channels where the other peer is also in. */
                console.log('Already connected to peer ', peerId);
                return;
            }

            const peerConnection: RTCPeerConnection = new RTCPeerConnection({iceServers: this.ICE_SERVERS});
            this.peers[peerId] = peerConnection;

            (peerConnection as any).addStream(this.userMediaStream);

            peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
                if (event.candidate) {
                    this.signalingSocket.emit('relayICECandidate', {
                        'peer_id': peerId,
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    });
                }
            };



            /*this.userMediaStream.getTracks().forEach((track: any) => {
                peerConnection.addTrack(track);
            });*/

            peerConnection.ontrack = (event) => {
                console.log('!!!!!!!!!ontrack', event);
                const elem = document.createElement('audio');
                elem.srcObject = event.streams[0];
                elem.play();
            };

            console.log('config.should_create_offer', config.should_create_offer)
            if (config.should_create_offer) {
                peerConnection.createOffer().then((localDescription: any) => {

                    localDescription.sdp = localDescription.sdp.replace('minptime=10', 'minptime=10; maxaveragebitrate=7000');

                    console.log('localDescription', localDescription)
                    peerConnection.setLocalDescription(localDescription, () => {
                        this.signalingSocket.emit(
                            'relaySessionDescription',
                            {'peer_id': peerId, 'session_description': localDescription}
                        )
                    }, (error) => {
                        console.log('Error sending offer: ', error);
                    });
                })
            }

        });

        this.signalingSocket.on('sessionDescription', (config: any) => {
            const peerId = config.peer_id;
            const peer = this.peers[peerId];
            const remoteDescription = config.session_description;

            const desc = new RTCSessionDescription(remoteDescription);

            peer.setRemoteDescription(desc, () => {

                if (remoteDescription.type == 'offer') {

                    console.log('Creating answer');
                    peer.createAnswer(
                        (localDescription: any) => {
                            console.log('Answer description is: ', localDescription);
                            peer.setLocalDescription(localDescription,
                                () => {
                                    this.signalingSocket.emit('relaySessionDescription',
                                        {'peer_id': peerId, 'session_description': localDescription});
                                    console.log('Answer setLocalDescription succeeded');
                                },
                                () => {
                                    console.log('Answer setLocalDescription failed!')
                                }
                            );
                        },
                        (error: any) => {
                            console.log('Error creating answer: ', error);
                            console.log(peer);
                        });

                }
            }, (error: any) => {
                console.log('setRemoteDescription error: ', error);
            })
        });

        this.signalingSocket.on('iceCandidate', (config: any) => {
            console.log('Remote iceCandidate received: ', config);
            const peer = this.peers[config.peer_id];
            const ice_candidate = config.ice_candidate;
            peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
        });

        this.signalingSocket.on('removePeer', (config: any) => {
            const peerId = config.peer_id;
            if (peerId in this.mediaElements) {
                this.mediaElements[peerId].remove();
            }
            if (peerId in this.peers) {
                this.peers[peerId].close();
            }

            delete this.peers[peerId];
            delete this.mediaElements[peerId];
        })
    }
}

new PeerConnectSocket();
