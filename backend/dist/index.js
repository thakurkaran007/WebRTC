"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let recieveSocket = null;
wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'sender':
                senderSocket = ws;
                console.log('sender connected');
                break;
            case 'receiver':
                recieveSocket = ws;
                console.log('receiver connected');
            case 'createOffer':
                if (ws !== senderSocket) {
                    return;
                }
                recieveSocket === null || recieveSocket === void 0 ? void 0 : recieveSocket.send(JSON.stringify({ type: 'createOffer', sdp: message.sdp }));
                console.log('sender offered to reciver');
                break;
            case 'createAnswer':
                if (ws !== recieveSocket) {
                    return;
                }
                senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: 'createAnswer', sdp: message.sdp }));
                console.log('offer acccepted and answer created by user');
                break;
            case 'iceCandidate':
                if (ws === senderSocket) {
                    console.log('iced reciver');
                    recieveSocket === null || recieveSocket === void 0 ? void 0 : recieveSocket.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
                }
                else if (ws === recieveSocket) {
                    console.log('iced sender');
                    senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: 'iceCandidate', candidate: message.candidate }));
                }
                break;
            default:
                break;
        }
    });
});
