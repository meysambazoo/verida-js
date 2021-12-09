// https://nodejs.org/api/assert.html
const assert = require('assert');
import { AutoAccount } from '@verida/account-node';
import { EnvironmentType, Network } from '@verida/client-ts';
import Credentials from '../src/credentials';
import SharingCredential from '../src/sharing-credential';

const WALLET = {
	chain: 'ethr',
	mnemonic:
		'sunset dry result clarify six vote hero fiscal globe latin shop grief',
	privateKey:
		'0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af',
	publicKey:
		'0x5dd84b6d500bcbc018cbc71b0407d694095755d91af42bd3442b2dfc96b1e0af',
	did: 'did:ethr:0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
	address: '0xB3729982A2585544FD72c99CF3773a9c6baBD55c',
};

const credentialData = {
	id: 'did:example:ebfeb1f712ebc6f1c276e12ec21',
	alumniOf: 'Example University',
	schema: 'https://schemas.verida.io/credential/public/default/schema.json',
};

const VERIDA_CONTEXT_NAME = 'Verida: Credentials';
const VERIDA_TESTNET_DEFAULT_SERVER = 'https://db.testnet.verida.io:5002/';

const connect = async () => {
	const context = await Network.connect({
		context: {
			name: VERIDA_CONTEXT_NAME,
		},
		client: {
			environment: EnvironmentType.TESTNET,
		},
		account: new AutoAccount(
			{
				defaultDatabaseServer: {
					type: 'VeridaDatabase',
					endpointUri: VERIDA_TESTNET_DEFAULT_SERVER,
				},
				defaultMessageServer: {
					type: 'VeridaMessage',
					endpointUri: VERIDA_TESTNET_DEFAULT_SERVER,
				},
			},
			{
				privateKey: WALLET.privateKey,
				environment: EnvironmentType.TESTNET,
			}
		),
	});
	return context;
};

describe('Credential tests', function () {
	describe('Credential Units', function () {
		this.timeout(100000);
		let encryptedData;

		it('Login in user and create context', async function () {
			const context = await connect();
			assert.equal(context.getContextName(), VERIDA_CONTEXT_NAME);
		});
		it('issue encrypted credential', async function () {
			const context = await connect();

			const credential = new SharingCredential(context);

			const data = await credential.issueEncryptedCredential(credentialData);

			encryptedData = data;

			assert.ok(data.result.ok, 'Error saving document');
		});

		it('Verify a credential', async function () {
			const context = await connect();

			const credential = new Credentials(context);

			const jwtURI = await credential.fetchURI(encryptedData.uri);

			const verifiedCredential: any = await credential.verifyCredential(jwtURI);

			assert.equal(verifiedCredential.jwt, jwtURI, 'JWT does not match');
		});
	});
});
