import {DeviceInfo} from './model/DeviceInfo';

export default class MyMedia {

    private micId: string = '';
    private speakerId: string = '';
    private isEchoCancellation: boolean = false;
    private isNoiseSuppression: boolean = false;

    constructor() {
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
