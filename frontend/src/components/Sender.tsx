import { useEffect, useRef, useState } from "react";

export const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    //@ts-ignore
    const [pc, setPC] = useState<RTCPeerConnection | null>(null);
    const videoref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'sender'
            }));
        }
    }, []);

    const MakeConnection = async () => {
        if (!socket) {
            alert("Socket not found");
            return;
        }

        const pc = new RTCPeerConnection();
        setPC(pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate
                }));
            }
        };

        pc.onnegotiationneeded = async () => {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.send(JSON.stringify({
                type: 'createOffer',
                sdp: pc.localDescription
            }));
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'createAnswer') {
                await pc.setRemoteDescription(message.sdp);
            } else if (message.type === 'iceCandidate') {
                pc.addIceCandidate(message.candidate);
            }
        };

        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            if(videoref.current) {
                videoref.current.srcObject = stream;
            }
            stream.getTracks().forEach((track) => {
                console.log('Sender track:', track);
                pc?.addTrack(track, stream);
            });
        });
    };

    return (
        <div>
            Sender
            <video ref={videoref} muted autoPlay></video>
            <button onClick={MakeConnection}>Send data</button>
        </div>
    );
};
