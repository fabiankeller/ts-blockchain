import * as express from 'express';
import Blockchain from '../blockchain/blockchain';
import Wallet from '../wallet/wallet';
import TransactionPool from '../wallet/transaction-pool';
import Peer2PeerServer from './p2p-server';

const app = express();
const blockchain: Blockchain = new Blockchain();
const wallet: Wallet = new Wallet();
const transactionPool: TransactionPool = new TransactionPool();
const p2pServer: Peer2PeerServer = new Peer2PeerServer(blockchain, transactionPool);

app.get('/balance', (_request, response) => {
    return response.json({balance: wallet})
});

app.get('/blocks', (_request, response) => {
    return response.json({blockchain: blockchain.chain});
});

app.get('/public-key', (_request, response) => {

})