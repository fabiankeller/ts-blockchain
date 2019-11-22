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

    findTransaction(address: string): Transaction {
        return <Transaction> this.transactions.find(tx => tx.txInput.address === address);
    }

    validTransactions(): Transaction[] {
        let validTransactions: Transaction[] = [];

        this.transactions.forEach(tx => {
            let startingBalance = tx.txInput.amount;
            let outputBalance = 0;
            tx.txOutputs.forEach(txOutput => outputBalance += txOutput.amount);

            if (outputBalance !== startingBalance) {
                console.log('Invalid transation (balance) from address: ' + tx.txInput.address);
                return;
            }
            if (!Transaction.verifyTransaction(tx)) {
                console.log('Invalid transaction (signature) from address: ' + tx.txInput.address);
                return;
            }
            validTransactions.push(tx);
        })
        return validTransactions;
    }
}