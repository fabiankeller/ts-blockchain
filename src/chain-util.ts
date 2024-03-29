import * as elliptic from 'elliptic';
import * as crypto from 'crypto-js';
import * as uuidV1 from 'uuid/v1';

const ec = new elliptic.ec('secp256k1');

export default class ChainUtil {
    static genKeyPair() {
        return ec.genKeyPair();
    }

    /**
     * Generates hash based on any given data. Useful for not having to sign very large
     * pieces of data but just the hash values.
     */
    static generateHash(data: any): string {
        return crypto.SHA256(JSON.stringify(data)).toString();
    }

    static genID(): string {
        return uuidV1();
    }

    static verifySignature(publicKey: string, signature: elliptic.ec.Signature, expectedDataHash: string): boolean {
        try {
            return ec.keyFromPublic(publicKey, 'hex').verify(expectedDataHash, signature);
        } catch(error) {
            console.log('Signature verification error for public key: ' + publicKey + '; error message: ' + error.message);
            return false;
        }
    }
}