import * as express from 'express';
import Blockchain from '../blockchain/blockchain';
import Wallet from '../wallet/wallet';
import TransactionPool from '../wallet/transaction-pool';
import Peer2PeerServer from './p2p-server';
import bodyParser = require('body-parser');
import Miner from './miner';

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain: Blockchain = new Blockchain();
const wallet: Wallet = new Wallet();
const transactionPool: TransactionPool = new TransactionPool();
const p2pServer: Peer2PeerServer = new Peer2PeerServer(blockchain, transactionPool);
const miner = new Miner(blockchain, transactionPool, wallet, p2pServer);

app.use(bodyParser.json());

app.get('/balance', (_request, response) => {
    return response.json({balance: wallet.calculcateBalance(blockchain)});
});

app.get('/blocks', (_request, response) => {
    return response.json({blockchain: blockchain.chain});
});

app.get('/public-key', (_request, response) => {
    response.json({publicKey: wallet.publicKey});
});

app.get('/transactions', (_request, response) => {
    response.json({transactions: transactionPool.transactions});
});

app.post('/transact', (request, response) => {
    const recipient: string = request.body.recipient;
    const amount: number = request.body.amount;
    const transaction = wallet.createOrUpdateTransaction(recipient, amount, blockchain, transactionPool);
    p2pServer.broadcastTx(transaction);
    response.redirect('/transactions');
});

app.get('/mine-transactions', (_request, response) => {
    const block = miner.mine();
    console.log('New block added: ' + block.toString());
    response.redirect('/blocks');
});

app.post('/mine', (request, response) => {
    const block = blockchain.addBlock(request.body.data);
    console.log('New block added: ' + block.toString());

    // update other nodes as soon as new block mined
    p2pServer.syncChains();

    // show updated chain in new block
    response.redirect('/blocks');
});

app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
});

p2pServer.listen();