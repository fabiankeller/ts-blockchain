import Block from "./block";
import Transaction from "../wallet/transaction";

/**
 * 
 */
export default class Blockchain {
    chain: Block[];

    constructor() {
        this.chain = [Block.getGenesisBlock()];
    }

    isValidChain(blocks: Block[]): boolean {
        // Check if first block is the genesis block.
        if (JSON.stringify(blocks[0]) !== JSON.stringify(Block.getGenesisBlock())) {
            return false;
        }

        for (let index: number = 1; index < blocks.length; index++) {
            const currentBlock: Block = blocks[index];
            const previousBlock: Block = blocks[index - 1];
            if (currentBlock.lastHash !== previousBlock.hash
                || currentBlock.hash !== Block.generateHashOfBlock(currentBlock)) {
                    console.log('Not valid - currentBlock.lastHash: ' + currentBlock.lastHash
                     + ", previousBlock.hash: " + previousBlock.hash);
                    return false;
                }
        }
        return true;
    }

    replaceChain(newBlocks: Block[]): boolean {
        if (newBlocks.length <= this.chain.length) {
            console.log('New chain is not longer than current chain - NOT replacing.')
            return false;
        }
        if (!this.isValidChain(newBlocks)) {
            console.log('New chain is not valid - NOT replacing.')
            return false;
        }
        this.chain = newBlocks;
        console.log('Replacing current chain with new chain.');
        return true;
    }

    addBlock(data: Transaction[]): Block {
        const newBlock = Block.mineNewBlock(this.chain[this.chain.length - 1], data);
        this.chain.push(newBlock);
        
        return newBlock;
    }
}