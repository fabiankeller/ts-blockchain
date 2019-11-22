import Transaction from "./transaction";

export default class TransactionPool {
    transactions: Transaction[];

    constructor() {
        this.transactions = [];
    }

    clear(): void {
        this.transactions = [];
    }

    updateOrAddTransaction(transaction: Transaction): void {
        const existingTx = this.transactions.find(tx => tx.id === transaction.id);

        if (existingTx) {
            // transaction already exists so it need to be replaced.
            this.transactions[this.transactions.indexOf(existingTx)] = transaction;
        } else {
            // transaction doesn't exist, so will be added.
            this.transactions.push(transaction);
        }
    }
}