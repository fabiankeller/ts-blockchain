import * as config from '../config';
import * as elliptic from 'elliptic';
import ChainUtil from '../chain-util';
import Blockchain from '../blockchain/blockchain';
import TransactionPool from './transaction-pool';
import Transaction from './transaction';
import Block from '../blockchain/block';

export default class Wallet {
    balance: number;
    keypair: elliptic.ec.KeyPair;
    publicKey: string;
    static blockchainWallet: Wallet;

    // for balance re-calculcation - need to know from where to start recalculating
    lastBlockTimestamp: number;
    lastBlockBalanceCalcTimestamp: number;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode('hex', false);
        this.lastBlockTimestamp = 0;
        this.lastBlockBalanceCalcTimestamp = 0;
    }

    static getBlockchainWallet(): Wallet {
        if (!Wallet.blockchainWallet) {
            Wallet.blockchainWallet = new Wallet();
            Wallet.blockchainWallet.publicKey = 'blockchain-wallet-address';
        }
        return Wallet.blockchainWallet;
    }

    sign(dataHash: string): elliptic.ec.Signature {
        return this.keypair.sign(dataHash);
    }

    calculcateBalance(blockchain: Blockchain): number {
        this.lastBlockTimestamp = blockchain.chain[blockchain.chain.length - 1].timestamp;
        let balance = this.balance;
        const newTransactions: Transaction[] = [];

        // balance already up to date, no need for recalculation
        if (this.lastBlockBalanceCalcTimestamp === this.lastBlockTimestamp
            && this.lastBlockBalanceCalcTimestamp > 0) { // balance already calculated at least once
            return balance;
        }

        // start from end of blockchain to find where to start recalculating from
        // as blockchain grows, won't waste time rechecking old blocks
        let startBlockIndex = 0;
        let blocks: Block[] = blockchain.chain;
        for (let index = blocks.length - 1; index >= 0; index--) {
            if (blocks[index].timestamp === this.lastBlockBalanceCalcTimestamp) {
                // calculation should start from 1 block AFTER the last block used to calculate balance
                startBlockIndex = index + 1;
                break;
            }
        }
        // only add transactions from new blocks mined since last time calcucated balance
        for (let index = startBlockIndex; index < blocks.length; index++) {
            let blockTransactions: Transaction[] = blocks[index].data;
            blockTransactions.forEach(tx => newTransactions.push(tx));
        }
        // find all of this wallets input transactions - i.e. withdrawals to other wallets
        const thisWalletWithdrawalTxs = newTransactions.filter(tx => tx.txInput.address === this.publicKey);
        // find all of this wallet's output transactions - i.e. deposits from other wallets
        const thisWalletDepositTxs = newTransactions.filter(tx => {
            //start from index 1 for TransactionOutputs because index 0 holds temporary balance
            for (let i = 1; i < tx.txOutputs.length; i++) {
                if (tx.txOutputs[i].address === this.publicKey &&
                    tx.txInput.address !== this.publicKey) return true;
            }
            return false;
        });
        // substract all new withdrawal from this wallet.
        thisWalletWithdrawalTxs.forEach(withdrawalTx => {
            // start from index 1 for TransactionOutputs because index 0 holds temporary balance
            withdrawalTx.txOutputs.slice(1).forEach(outputTx => balance -= outputTx.amount);
        })

        // add all new deposits to this wallet
        thisWalletDepositTxs.forEach(depositTx => {
            // start form index 1 for TransactionOutputs because index 0 holds temporary balance
            depositTx.txOutputs.filter(outputTx => outputTx.address === this.publicKey)
                .forEach(outputTx => balance += outputTx.amount);
        });

        // set values for next time, that we don't have to recheck any block if blockchain unchanged
        this.lastBlockBalanceCalcTimestamp = this.lastBlockTimestamp
        this.balance = balance;
        return balance;
    }

    createOrUpdateTransaction(recipient: string, sendAmount: number, blockchain: Blockchain, transactionPool: TransactionPool): Transaction {
        this.balance = this.calculcateBalance(blockchain);

        if (sendAmount > this.balance) {
            throw new RangeError("Amount " + sendAmount + " exceeds current balance: " + this.balance);
        }

        // check if transaction exists
        let existingTx: Transaction = transactionPool.findTransaction(this.publicKey);

        if (existingTx) {
            existingTx.update(this, recipient, sendAmount);
        } else {
            existingTx = Transaction.newTransaction(this, recipient, sendAmount);
            transactionPool.updateOrAddTransaction(existingTx);
        }
        return existingTx;
    }

    toString(): string {
        return `Wallet -
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}
        `;
    }
};