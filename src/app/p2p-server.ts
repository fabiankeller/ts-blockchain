import Blockchain from '../blockchain/blockchain';
import * as WebSocket from 'ws';
import TransactionPool from '../wallet/transaction-pool';

const P2P_PORT: string = process.env.P2P_PORT || '5001';

enum MESSAGE_TYPES {
    /** Replace current blockchain with a new blockchain.*/
    chain = 'CHAIN',
    /** Update or add a new transaction in the transaction pool.*/
    transaction = 'TRANSACTION',
    /** Clear the transaction pool. */
    clear_transaction = 'CLEAR_TRANSACTIONS'
};

//list of peers will be comma separated with the following format:
//ws://localhost:5001,ws://localhost:5002,ws://localhost:5003
const peers: string[] = process.env.PEERS ? process.env.PEERS.split(',') : [];

export default class Peer2PeerServer {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    webSockets: WebSocket[] = [];
    readonly server: WebSocket.Server;

    constructor(blockchain: Blockchain, transactionPool: TransactionPool) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.server = new WebSocket.Server({
            port: Number.parseInt(P2P_PORT)
        });
    }

    listen(): void {
        this.server.on('connection', webSocket => this.connectSocket(webSocket));
        this.connectPeers();

        console.log('listening for P2P connections on ' + P2P_PORT);
    }

    connectPeers(): void {
        peers.forEach(peerUrl => {
            const webSocket: WebSocket = new WebSocket(peerUrl);
            webSocket.on('open', () => {
                this.connectSocket(webSocket);
            })
        })
    }

    connectSocket(webSocket: WebSocket): void {
        this.webSockets.push(webSocket);
        console.log('socket connected');

        // Register on websocket to handle messages send from this websocket.
        this.messageHandler(webSocket);
        // When new connection is established - send current blockchain to peer.
        this.sendChain(webSocket);
    }

    sendChain(websocket: WebSocket): void {
        websocket.send(JSON.stringify({
            type: MESSAGE_TYPES.chain,
            chain: this.blockchain.chain
        }));
    }


    messageHandler(socket: WebSocket): void {
        socket.on('message', message => {
            const messageData = JSON.parse(message.toString());

            switch (messageData.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(messageData.chain);
                    break;
                case MESSAGE_TYPES.transaction:
                    this.transactionPool.updateOrAddTransaction(messageData.transaction);
                    break;
                case MESSAGE_TYPES.clear_transaction:
                    this.transactionPool.clear();
                    break;
                default:
                    throw new Error('undefined message type: ' + messageData.type);
            }
        });
    }
}