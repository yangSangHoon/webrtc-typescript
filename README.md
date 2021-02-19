## 소개
typescript로 제작된 signaling server를 활용한 webrtc, RTCPeerconnection 연동

## 실행
npm run serve

yarn serve
 
## classes

### PeerConnectSocket (client.ts)
- RTCPeerConnection으로 SDP전문과 candidate생성하여 signaling서버와 통신하는 역활
- onTrack으로 받아온 상대방의 음성스트림을 관리

### MyMedia (myMedia.ts)
- getUserMedia로 생성한 내 음성스트림을 관리하는 역할
- 내 pc의 마이크/스피커 디바이스 조회 및 변경
- 내 마이크의 볼륨 조절

### Signaling (signaling.ts)
- nodejs로 만든 signaling server
- 클라이언트간 sdp전문 candidate를 교환할 수 있도록 해준다

## methods
| method | params | return | 설명 |
| - | - | - | - |
| getListModelListOfMyDevices | null | {micDevices, audioDevices} | pc에 연결된 마이크/스피커의 리스트를 반환 |
| changeSpeaker | deviceId | void | 스피커의 id를 통한 사용할 스피커 변경 |
| changeMic | deviceId | void | 마이크의 id를 통한 사용할 마이크 변경 |
| muteMic | true/false | void | 마이크 온오프 |
| muteSpeaker | true/false | void | 스피커 온오프 |
| cancelNoise | true/false | void | 잡음제거 온오프 |
| cancelEcho | true/false | void | 에코제거 온오프 |
| speakerVolumeChange | volume | void | 스피커 볼륨조절 |
| micVolumeChange | volume | void | 마이크 볼륨조절 |


#### client.ts와 myMedia.ts 함수 정리중에 있습니다.

