import Blockchain from '../blockchain/blockchain';
import * as WebSocket from 'ws';
import TransactionPool from '../wallet/transaction-pool';
import Transaction from '../wallet/transaction';

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
    server: WebSocket.Server;

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
            webSocket.on('error', () => {
                // do nothing
            });
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

    messageHandler(socket: WebSocket): void {
        socket.on('message', message => {
            const messageData = JSON.parse(message.toString());

            switch (messageData.type) {
                case MESSAGE_TYPES.chain:
                    this.blockchain.replaceChain(messageData.chain);
                    break;
                case MESSAGE_TYPES.transaction:
                    console.log('Received new transaction.');
                    this.transactionPool.updateOrAddTransaction(messageData.transaction);
                    break;
                case MESSAGE_TYPES.clear_transaction:
                    console.log('Received message to clear transactions.')
                    this.transactionPool.clear();
                    break;
                default:
                    throw new Error('undefined message type: ' + messageData.type);
            }
        });
    }

    broadcastClearTx(): void {
        this.webSockets.forEach(webSocket => webSocket.send(JSON.stringify({
            type: MESSAGE_TYPES.clear_transaction
        })));
    }

    broadcastTx(transaction: Transaction): void {
        this.webSockets.forEach(webSocket => this.sendTransaction(webSocket, transaction));
    }

    sendTransaction(webSocket: WebSocket, transaction: Transaction): void {
        webSocket.send(JSON.stringify({
            type: MESSAGE_TYPES.transaction,
            transaction
        }));
    }

    syncChains(): void {
        this.webSockets.forEach(webSocket => this.sendChain(webSocket));
    }

    sendChain(websocket: WebSocket): void {
        websocket.send(JSON.stringify({
            type: MESSAGE_TYPES.chain,
            chain: this.blockchain.chain
        }));
    }
}