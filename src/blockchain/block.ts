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

    static mineNewBlock(lastBlock: Block, data: Transaction[]): Block {
        let lastHash = lastBlock.hash;
        let timestamp: number;
        let nonce = 0
        let hash: string;
        let { difficulty } = lastBlock
        do {
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            nonce++;
            hash = Block.generateHash(timestamp, lastHash, data, nonce, difficulty);
        } while (hash.substr(0, difficulty) !== '0'.repeat(difficulty))
        return new this(timestamp, lastHash, hash, data, nonce, difficulty);
    }

    static adjustDifficulty(lastBlock: Block, newBlockTime: number): number {
        let { difficulty } = lastBlock;
        difficulty = lastBlock.timestamp + config.MINE_RATE > newBlockTime ? ++difficulty : --difficulty;

        if (difficulty < 1) {
            difficulty = 1;
        }
        return difficulty;
    }

    toString(): string {
		return `Block:
			Timestamp  : ${this.timestamp}
			Last Hash  : ${this.lastHash.substring(0,10)}
			Hash       : ${this.hash.substring(0,10)}
			Data       : ${this.data}
			Nonce      : ${this.nonce}
			Difficulty : ${this.difficulty}
		`;
	}
}