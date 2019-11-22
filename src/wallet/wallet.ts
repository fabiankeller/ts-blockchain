import * as config from '../config';
import * as elliptic from 'elliptic';
import ChainUtil from '../chain-util';

export default class Wallet {
    balance: number;
    keypair: elliptic.ec.KeyPair;
    publicKey: string;
    static blockchainWallet: Wallet;

    // for balance re-calculcation - need to know from where to start recalculating
    lastBlockTimestamp: number;

    // ???
    lastBlockBalanceCalc: number;

    constructor() {
        this.balance = config.INITIAL_BALANCE;
        this.keypair = ChainUtil.genKeyPair();
        this.publicKey = this.keypair.getPublic().encode('hex', true);
        this.lastBlockTimestamp = 0;
        this.lastBlockBalanceCalc = 0;
    }

    static getBlockchainWallet(): Wallet {
        if (!Wallet.blockchainWallet) {
            Wallet.blockchainWallet = new Wallet();
            Wallet.blockchainWallet.publicKey = 'blockchain-wallet-address';
        }
        return Wallet.blockchainWallet;
    }

    
};