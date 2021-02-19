import MyMedia from "./myMedia";

class PeerConnectSocket {
    /** You should probably use a different stun server doing commercial stuff **/
    /** Also see: https://gist.github.com/zziuni/3741933 **/
    private ICE_SERVERS: Array<RTCIceServer> = [
        {urls: 'stun:stun.l.google.com:19302'}
    ];
    private signalingSocket: any;

    private peers: Array<any> = [];
    private mediaElements: Array<any> = [];
    private userMediaStream: MediaStream = null;
    private audioElement: HTMLAudioElement = null;
    private remotePeerConnection: RTCPeerConnection = null;

    private isEchoCancellation: boolean = true;
    private isNoiseSuppression: boolean = true;

    private myMedia: MyMedia = new MyMedia;

    constructor() {
        this.getUserMedia();
    }

    public speakerVolumeChange(value: number): void {
        this.audioElement.volume = value;
    }

    public muteMic(value: boolean): void {
        this.userMediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
            track.enabled = !value;
        });
    }

    public muteSpeaker(value: boolean): void {
        value ? this.audioElement.pause() : this.audioElement.play();
    }

    public cancelNoise(value: boolean): void {
        this.myMedia.cancelNoise(value)
    }

    public cancelEcho(value: boolean): void {
        this.myMedia.cancelEcho(value)
    }

    public changeMyStream() {
        this.myMedia.changeMyStream()
    }

    private async getUserMedia() {
        this.userMediaStream = await this.myMedia.getMediaStream();
        this.init();
    }

    private init(): void {
        this.signalingSocket = (window as any).io('ws://localhost:3000');
        this.signalingSocket.on('connect', () => {
            this.signalingSocket.emit('join');
        });

        this.signalingSocket.on('addPeer', (config: any) => {
            const peerId = config.peer_id;

            if (peerId in this.peers) {
                /* This could happen if the user joins multiple channels where the other peer is also in. */
                console.log('Already connected to peer ', peerId);
                return;
            }

            this.remotePeerConnection = new RTCPeerConnection({iceServers: this.ICE_SERVERS});
            this.peers[peerId] = this.remotePeerConnection;

            (this.remotePeerConnection as any).addStream(this.userMediaStream);

            this.remotePeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
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

            this.remotePeerConnection.ontrack = (event) => {
                if(!this.audioElement){
                    this.audioElement = document.createElement('audio');
                }
                this.audioElement.srcObject = event.streams[0];
                this.audioElement.play();
            };

            if (config.should_create_offer) {
                this.remotePeerConnection.createOffer().then((localDescription: any) => {

                    localDescription.sdp = localDescription.sdp.replace('minptime=10', 'minptime=10; maxaveragebitrate=7000');

                    this.remotePeerConnection.setLocalDescription(localDescription, () => {
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

const client = new PeerConnectSocket();
