import TransactionOutput from "./transaction-output";
import TransactionInput from "./transaction-input";
import ChainUtil from "../chain-util";

export default class Transaction {
    id: string;
    txInput: TransactionInput;
    txOutputs: TransactionOutput[];

    constructor() {
        this.id = ChainUtil.genID();
        this.txOutputs = [];
    }
}