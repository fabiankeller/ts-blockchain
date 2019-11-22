import Blockchain from "../blockchain/blockchain";
import TransactionPool from "../wallet/transaction-pool";
import Wallet from "../wallet/wallet";
import Peer2PeerServer from "./p2p-server";
import Block from "../blockchain/block";
import Transaction from "../wallet/transaction";

export default class Miner {

    constructor(
        private blockchain: Blockchain,
        private transactionPool: TransactionPool,
        private wallet: Wallet,
        private p2pServer: Peer2PeerServer) { }

    mine(): Block {
        const validTransactions = this.transactionPool.validTransactions();
        validTransactions.push(Transaction.newRewardTransaction(this.wallet, Wallet.getBlockchainWallet()));
        const block = this.blockchain.addBlock(validTransactions);
        this.p2pServer.syncChains();
        this.transactionPool.clear();
        this.p2pServer.broadcastClearTx();
        return block;

    }
}