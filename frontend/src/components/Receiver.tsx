import { useEffect, useRef } from "react";

export const Receiver = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            console.log('WebSocket connection established');
            socket.send(JSON.stringify({ type: 'receiver' }));
        };
        startReceiving(socket);
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
            console.log('Track received:', event.streams[0]);
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
            }
            
        };
        

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);

            if (message.type === 'createOffer') {
                try {
                    await pc.setRemoteDescription(message.sdp);
                    console.log('Remote description set');
                    
                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            console.log('Sending ICE candidate');
                            socket.send(JSON.stringify({
                                type: 'iceCandidate',
                                candidate: event.candidate
                            }));
                        }
                    };

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    console.log('Answer created and set as local description');

                    socket.send(JSON.stringify({
                        type: 'createAnswer',
                        sdp: pc.localDescription
                    }));
                } catch (error) {
                    console.error('Error handling offer:', error);
                }
            } else if (message.type === 'iceCandidate') {
                try {
                    await pc.addIceCandidate(message.candidate);
                    console.log('ICE candidate added');
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        };
    }

    return (
        <div>
            <div>Receiver</div>
            <video ref={videoRef} muted autoPlay></video>
        </div>
    );
};
