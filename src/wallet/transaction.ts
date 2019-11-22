import TransactionOutput from './transaction-output';
import TransactionInput from './transaction-input';
import ChainUtil from '../chain-util';
import * as config from '../config';
import Wallet from './wallet';

export default class Transaction {
    id: string;
    txInput: TransactionInput;
    txOutputs: TransactionOutput[];

    constructor() {
        this.id = ChainUtil.genID();
        this.txOutputs = [];
    }

        /**
     * Used by sender - signs transaction and generates a TransactionInput object.
     * The signature is based on the hash of the TransactionOutput array.
     */
    static signTransaction(transaction: Transaction, senderWallet: Wallet): void {
        transaction.txInput = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.generateHash(transaction.txOutputs))
        }
    }

    static verifyTransaction(transaction: Transaction): boolean {
        return ChainUtil.verifySignature(
            transaction.txInput.address,
            transaction.txInput.signature,
            ChainUtil.generateHash(transaction.txOutputs));
    }

    static newTransaction(senderWallet: Wallet, recipient: string, amountToSend: number):Transaction {
        if(amountToSend > senderWallet.balance) {
            throw new RangeError("Amount " + amountToSend + " exceeds balance.");
        }

        let txOutputs: TransactionOutput [] = [
            { amount: senderWallet.balance - amountToSend, address: senderWallet.publicKey },
            { amount: amountToSend,                        address: recipient              }
        ];

        return Transaction.transactionWithOutput(senderWallet, txOutputs);
    }

    static newRewardTransaction(minerWallet: Wallet, blockchainWallet: Wallet): Transaction {
        const txOutputs: TransactionOutput[] = [
            { amount: 9_999_999, address: config.BLOCKCHAIN_WALLET_ADDRESS },
            { amount: config.MINING_REWARD, address: minerWallet.publicKey },
        ];
        return Transaction.transactionWithOutput(blockchainWallet, txOutputs);
    };

    static transactionWithOutput(senderWallet: Wallet, txOutputs: TransactionOutput[]): Transaction {
        const transaction: Transaction = new Transaction();
        transaction.txOutputs.push(...txOutputs);

        Transaction.signTransaction(transaction, senderWallet);
        return transaction;
    }

    update(senderWallet: Wallet, recipient: string, amountToTx: number): Transaction {
        // find the TransactionOutput we need to update
        const senderTxOutput: TransactionOutput | undefined = this.txOutputs.find(txOutput => txOutput.address === senderWallet.publicKey);

        if (!senderTxOutput) {
            throw new Error('No transaction found for recipient: ' + recipient);
        }

        if (amountToTx > senderTxOutput.amount) {
            throw new RangeError('Amount ' + amountToTx + ' exceeds balance.');
        }

        // reduce the senders balance by the amount being transferred
        senderTxOutput.amount -= amountToTx;

        // add additional TransactionOutput objet to list
        this.txOutputs.push(new TransactionOutput(amountToTx, recipient));
        Transaction.signTransaction(this, senderWallet);
        return this;
    }
}