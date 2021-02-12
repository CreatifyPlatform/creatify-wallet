import { getUnlockedMnemonicAndSeed } from './../wallet-seed';
// import * as bip32 from 'bip32';
import nacl from 'tweetnacl';
import { Account } from '@solana/web3.js';
import bs58 from 'bs58';
import { derivePath, getPublicKey } from 'ed25519-hd-key';

export function getAccountFromSeed(seed, walletIndex) {
  // const derivedSeed = bip32
  //   .fromSeed(seed)
  //   .derivePath(`m/44'/501'/${walletIndex}'`).privateKey;
  //   console.log("Private Key (main): ", derivedSeed.toString('hex'));
  const { key, chainCode} = derivePath(`m/44'/501'/${walletIndex}'`, seed);
  console.log("Private Key: ", key.toString('hex'));
  console.log("Chaincode: ", chainCode.toString('hex'));
  let publicKey = getPublicKey(key).toString('hex');
  console.log("Public Key: ", publicKey);
  const bytes = Buffer.from(publicKey.substr(2, publicKey.length), 'hex');
  console.log("Wallet Address: ", bs58.encode(bytes));
  return new Account(nacl.sign.keyPair.fromSeed(key).secretKey);
}

export class LocalStorageWalletProvider {
  constructor(args) {
    const { seed } = getUnlockedMnemonicAndSeed();
    this.account = args.account;
    this.listAddresses = async (walletCount) => {
      const seedBuffer = Buffer.from(seed, 'hex');
      return [...Array(walletCount).keys()].map((walletIndex) => {
        let address = getAccountFromSeed(seedBuffer, walletIndex).publicKey;
        let name = localStorage.getItem(`name${walletIndex}`);
        return { index: walletIndex, address, name };
      });
    };
  }

  init = async () => {
    return this;
  };

  get publicKey() {
    return this.account.publicKey;
  }

  signTransaction = async (transaction) => {
    transaction.partialSign(this.account);
    return transaction;
  };

  createSignature = (message) => {
    return bs58.encode(nacl.sign.detached(message, this.account.secretKey));
  };
}
