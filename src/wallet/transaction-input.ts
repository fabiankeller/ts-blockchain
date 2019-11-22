import * as elliptic from 'elliptic';

export default class TransactionInput {
    amount: number;
    address: string;
    timestamp: number;
    signature: elliptic.ec.Signature;
    constructor(amount: number, address: string) {
        this.amount = amount;
        this.address = address;
    }
}