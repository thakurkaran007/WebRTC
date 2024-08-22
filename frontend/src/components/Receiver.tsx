import { useEffect } from "react";

export const Receiver = () => {
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'receiver'
            }));
        };
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
       
        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            const video = document.createElement('video');
            document.body.appendChild(video);
            video.srcObject = new MediaStream([event.track]);
            video.play().catch((error) => console.log("Play failed: ", error));
        };
        
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createOffer') {
                await pc.setRemoteDescription(message.sdp);
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.send(JSON.stringify({
                            type: 'iceCandidate',
                            candidate: event.candidate
                        }));
                    }
                };
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(JSON.stringify({
                    type: 'createAnswer',
                    sdp: pc.localDescription
                }));
                console.log('Receiver created and sent an answer');
            } else if (message.type === 'iceCandidate') {
                // The receiver received an ICE candidate
                console.log('Receiver added ICE candidate');
                pc.addIceCandidate(message.candidate);
            }
        };
    }

    return <div>Receiver</div>;
};
