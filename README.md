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
> client.ts와 myMedia.ts 함수 정리중에 있습니다.


## 주요 api 정리
| 항목 | api | 참고사이트 | 비고 |
| - | - | - | - |
| 본인 미디어(음성,영상) 정보 가져오기 | `navigator.mediaDevices.getUserMedia` | https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia | |
| stream의 주파수 정보 얻기	| `audioContext.createAnalyser()` | https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createAnalyser |
| 본인 미디어 정보 리스트 조회 | `navigator.mediaDevices.enumerateDevices` | https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices	
| 마이크 변경 | `navigator.mediaDevices.getUserMedia`의 `constraints`값의 `deviceId`변경 | https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia | 
| 에코&공명제거	| `navigator.mediaDevices.getUserMedia`의 `constraints`값의 `echoCancellation`,`noiseSuppression`변경 | |
| 스피커 변경 | `HTMLMediaElement.setSinkId` | https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId |	
| 볼륨 변경	| `audioContext.createGain()` | https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain | 본인 마이크 볼륨 변경 방법 https://stackoverflow.com/questions/38873061/how-to-increase-mic-gain-in-webrtc |
| 새로운 스트림 생성 | `audioContext.createMediaStreamDestination()` | https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamDestination	|
| tts(text-to-speach) | `const synth = window.speechSynthesis; const utterThis = new SpeechSynthesisUtterance(text); synth.speak(utterThis); `| https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| webRtc peer 연결&통신	| `RTCPeerConnection` | https://developer.mozilla.org/ko/docs/Web/API/RTCPeerConnection | 
| peer간 통신시 bps(bits per second) 변경 | `peerConnection.setLocalDescription` 에 전달할 전문 변경 | | d`escription.sdp.replace("minptime=10", "minptime=10; maxaveragebitrate=7000");` |
| 오디오 변조 & 생성 | `AudioWorklet` | https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet	 | 
| 오디오 방출 | `audiocontext.createOscillator()` | https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createOscillator |
| peer의 연결된 track 변경 | `peerConnection.getSenders()` | https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/replaceTrack | 	마이크, 스피커등의 변경으로 stream , track 변경해야할때 |
