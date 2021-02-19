import {DeviceInfo} from './model/DeviceInfo';

export default class MyMedia {

    private micId: string = '';
    private speakerId: string = '';
    private isEchoCancellation: boolean = false;
    private isNoiseSuppression: boolean = false;
    private audio: any;
    private myStream: MediaStream = null;

    private privateAudioContext: AudioContext = null;
    private myGainNode: GainNode = null;

    private mumbleClient: any = null;
    private audioElement: HTMLMediaElement = null;
    private remotePeerConnection: RTCPeerConnection = null;

    public set peer(rTCPeerConnection: RTCPeerConnection){
        this.remotePeerConnection = rTCPeerConnection;
    }

    public async getListModelListOfMyDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            alert('navigator.mediaDevices none!!');
            return;
        }

        try {
            const deviceInfos: Array<MediaDeviceInfo> = await navigator.mediaDevices.enumerateDevices();
            return {
                micDevices: this.getListModel(deviceInfos, 'audioinput', this.micId),
                audioDevices: this.getListModel(deviceInfos, 'audiooutput', this.speakerId)
            };
        } catch (error) {
            alert('enumerateDevices error : ' + error);
        }
    }

    public changeSpeaker(deviceId: string): void {
        if (deviceId) {
            this.speakerId = deviceId;

            if (this.audio) {
                // @ts-ignore
                this.audio.setSinkId(deviceId)
                    .then(() => {
                        console.log(`Success, audio output device attached: ${deviceId}`);
                    })
                    .catch((error: any) => {
                        console.error('attachSinkId', error);
                    });
            }
        }
    }

    public changeMic(deviceId: string): void {
        this.micId = deviceId;
        this.changeMyStream();
    }

    public cancelNoise(value: boolean): void {
        this.isNoiseSuppression = value;
        this.changeMyStream();
    }

    public cancelEcho(value: boolean): void {
        this.isEchoCancellation = value;
        this.changeMyStream();
    }

    public async changeMyStream() {
        const audioTrack = this.myStream.getAudioTracks()[0];
        const audioSender = this.remotePeerConnection.getSenders().find((sender: RTCRtpSender) => sender.track.kind === audioTrack.kind);

        this.myStream = await this.getMyMedia();
        this.modifyGain();

        const newTrack = this.myStream.getAudioTracks()[0];
        audioSender.replaceTrack(newTrack);
    }

    public micVolumeChange(value: number): void {
        this.myGainNode.gain.value = value;
    }

    public async getMediaStream() {
        this.myStream = await this.getMyMedia();
        return this.myStream
    }

    private modifyGain(): void {
        this.myGainNode = this.audioContext.createGain();

        const oldTrack = this.myStream.getAudioTracks()[0];
        const mediaSource = this.audioContext.createMediaStreamSource(this.myStream);
        const destination = this.audioContext.createMediaStreamDestination();
        this.myGainNode.gain.value = 0.5; //defaut 0.25

        mediaSource.connect(this.myGainNode).connect(destination);
        this.myStream.removeTrack(oldTrack);

        const myMic = destination.stream.getAudioTracks()[0];
        this.myStream.addTrack(myMic);
    }

    private get audioContext(): AudioContext {
        if (!this.privateAudioContext) {
            this.privateAudioContext = new AudioContext();
        }
        return this.privateAudioContext
    }

    private getListModel(deviceDataList: Array<MediaDeviceInfo>, kind: string, currentDeviceId: string): Array<DeviceInfo> {
        return deviceDataList
            .filter((deviceInfo: MediaDeviceInfo) => deviceInfo.kind === kind)
            .map((deviceInfo) => this.deviceMapping(deviceInfo, currentDeviceId));
    }

    private deviceMapping(deviceInfo: MediaDeviceInfo, currentDeviceId: string): DeviceInfo {
        return {
            name: deviceInfo.label,
            value: deviceInfo,
            selected: this.isCurrentDevice(deviceInfo, currentDeviceId),
        }
    }

    private isCurrentDevice(deviceInfo: MediaDeviceInfo, currentDeviceId: string): boolean {
        return currentDeviceId ? deviceInfo.deviceId === currentDeviceId : deviceInfo.deviceId === 'default';
    }

    private async getMyMedia() {
        const constraints = {
            audio: {
                deviceId: this.micId,
                echoCancellation: this.isEchoCancellation,
                noiseSuppression: this.isNoiseSuppression
            },
            video: false
        };
        return navigator.mediaDevices.getUserMedia(constraints);
    }

}
