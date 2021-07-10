import { AccountInterface } from '@verida/account'
import { SecureStorageContextConfig, SecureStorageContextServices } from './interfaces'

export default class DIDStorageConfig {

    /**
     * Generate a storage link for an existing DID
     * 
     * @param did 
     * @param contextName 
     */
    static async generate(account: AccountInterface, contextName: string, servicesConfig: SecureStorageContextServices): Promise<SecureStorageContextConfig> {
        const keyring = await account.keyring(contextName)
        const publicKeys = await keyring.publicKeys()
        const config: SecureStorageContextConfig = {
            id: contextName,
            publicKeys: {
                asymKey: {
                    type: 'Curve25519EncryptionPublicKey',
                    base58: publicKeys.asymPublicKeyBase58
                },
                signKey: {
                    type: 'ED25519SignatureVerification',
                    base58: publicKeys.signPublicKeyBase58
                }
            },
            services: servicesConfig
        }

        return config
    }

}