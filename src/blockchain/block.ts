import Transaction from "../wallet/transaction";
import TransactionInput from "../wallet/transaction-input";
import * as config from "../config";
import ChainUtil from "../chain-util";

export default class Block {
    constructor(
        public timestamp: number,
        public lastHash: string,
        public hash: string,
        public data: Transaction[],
        public nonce: number,
        public difficulty: number) { }

    /**
     * First block of the blockchain.
     */
    static getGenesisBlock(): Block {
        let genesisTx: Transaction = new Transaction();
        genesisTx.id = 'genesis';
        genesisTx.txInput = new TransactionInput(0, '----');
        return new Block(0, '----', '', [genesisTx], 0, config.DIFFICULTY);
    }

    static generateHash(timestamp: number, lastHash: string, data: any, nonce: number, difficulty: number): string {
            return ChainUtil.generateHash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`);
    }

    static generateHashOfBlock(block: Block): string {
        const { timestamp, lastHash, data, nonce, difficulty } = block;
        return Block.generateHash(timestamp, lastHash, data, nonce, difficulty);
    }
}