import Encryption from '@verida/encryption-utils'
import { box, sign } from 'tweetnacl'
const bs58 = require('bs58')
const jsSHA = require("jssha")

import { KeyringKeyType } from './interfaces'

/**
 * Class that takes a signature (generated from a 3ID consent message) and generates a
 * collection of asymmetric keys, symmetric key and signing key for a given secure storage
 * context.
 * 
 * @todo: Consider replacing encryption-utils to use `digitalbazaar/minimal-cipher` for asym encryption
 */
export default class Keyring {

    private seed: string

    public asymKeyPair?: nacl.BoxKeyPair    // was 'any'
    public signKeyPair?: nacl.SignKeyPair   // was 'any'
    public symKey?: Uint8Array

    /**
     * A string used as a seed for this keyring.
     * The seed should be a hex signature obtained by 3ID signed consent message.
     * 
     * @param seed 
     */
    constructor(seed: string) {
        this.seed = seed
    }

    public async _init() {
        if (this.asymKeyPair) {
            return
        }

        this.asymKeyPair = await this.buildKey(this.seed, KeyringKeyType.ASYM)
        this.signKeyPair = await this.buildKey(this.seed, KeyringKeyType.SIGN)
        const symKeyPair = await this.buildKey(this.seed, KeyringKeyType.SYM)
        this.symKey = symKeyPair.secretKey
    }

    /**
     * Helper function that generates a key of the appropriate type
     * 
     * @param seed 
     * @param keyType 
     * @returns 
     */
    private async buildKey(seed: string, keyType: KeyringKeyType): Promise<nacl.BoxKeyPair | nacl.SignKeyPair> {
        const inputMessage = `${seed}-${keyType}`

        const hash = new jsSHA('SHA-256', 'TEXT')
        hash.update(inputMessage)
        const hashBytes = hash.getHash('UINT8ARRAY')

        switch (keyType) {
            case KeyringKeyType.SIGN:
                return sign.keyPair.fromSeed(hashBytes)
            case KeyringKeyType.ASYM:
                return box.keyPair.fromSecretKey(hashBytes)
            case KeyringKeyType.SYM:
                return box.keyPair.fromSecretKey(hashBytes)
            default:
                throw new Error('Unknown key type specified')
        }
    }

    /**
     * Generate an object containing all the public keys for this Keyring
     * 
     * @returns 
     */
    public async publicKeys() {
        await this._init()
        
        return {
            asymPublicKey: this.asymKeyPair?.publicKey,
            asymPublicKeyBase58: bs58.encode(this.asymKeyPair?.publicKey),
            signPublicKey: this.signKeyPair?.publicKey,
            signPublicKeyBase58: bs58.encode(this.signKeyPair?.publicKey)
        }
    }

    public async sign(data: string): Promise<string> {
        await this._init()
        return Encryption.signData(data, this.signKeyPair!.secretKey)
    }

    public async verifySig(data: string, sig: string): Promise<boolean> {
        await this._init()
        return Encryption.verifySig(data, sig, this.signKeyPair!.publicKey)
    }

    public async symEncrypt(data: string): Promise<string> {
        await this._init()
        return Encryption.symEncrypt(data, this.symKey!)
    }

    public async symDecrypt(data: string): Promise<any> {
        await this._init()
        return Encryption.symDecrypt(data, this.symKey!)
    }

    public async asymEncrypt(data: string, secretOrSharedKey: Uint8Array): Promise<string> {
        await this._init()
        return Encryption.asymEncrypt(data, secretOrSharedKey)
    }

    public async asymDecrypt(messageWithNonce: string, secretOrSharedKey: Uint8Array): Promise<any> {
        await this._init()
        return Encryption.asymDecrypt(messageWithNonce, secretOrSharedKey)
    }

    public async buildSharedKeyStart(privateKey: Uint8Array): Promise<Uint8Array> {
        await this._init()
        return box.before(this.asymKeyPair!.publicKey, privateKey);
    }

    public async buildSharedKeyEnd(publicKey: Uint8Array): Promise<Uint8Array> {
        await this._init()
        return box.before(publicKey, this.asymKeyPair!.secretKey);
    }

}