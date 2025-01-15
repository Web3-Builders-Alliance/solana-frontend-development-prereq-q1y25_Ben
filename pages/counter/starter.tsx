import React, { useState, useEffect } from "react";
import * as web3 from "@solana/web3.js";
import { toast } from "react-toastify";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ExternalLinkIcon } from "@heroicons/react/outline";
// program to interact with, anchor provider for interacting with the blockchain
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// makes web3.js wallet compatible with anchor
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
// idl of program we are interacting with
import CounterIDL from "../../programs/idls/counter.json";
// types from the program's idl
import { Counter } from "../../programs/types/counter";
import { Keypair, PublicKey } from "@solana/web3.js";

const Finished = () => {
  // state for counter's account pubkey and setter function, defaulted to blank
  const [counterKey, setCounterKey] = useState("");

  // count state, setter function, defaulted to 0
  const [count, setCount] = useState(0);

  // txsig state for most recent txsig, setter function, defaulted to blank
  const [txSig, setTxSig] = useState("");

  // connection object through provider
  const { connection } = useConnection();
  // pubkey and wallet through wallet provider
  const { publicKey, wallet } = useWallet();

  // create a provider object using the AnchorProvider class. use the connection and wallet
  const provider = new AnchorProvider(
    connection,
    wallet?.adapter as unknown as NodeWallet,
    AnchorProvider.defaultOptions()
  );

  // create a new Program class to interact with using the IDL and provider object
  const counterProgram = new Program(
    CounterIDL as unknown as Counter,
    provider
  );

  // helper function to create a transaction object
  const getPreparedTransaction = async () => {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const txInfo = {
      feePayer: publicKey,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };
    const transaction = new web3.Transaction(txInfo);
    return transaction;
  };

  // helper function to initialize a counter account from the program's instructions
  const handleInitializeCounter = async () => {
    // if no connection or pubkey, error toast the user
    if (!connection || !publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    // create transaction object using helper function
    const transaction = await getPreparedTransaction();

    // generate a new keypair for the counter
    const counterKeypair = Keypair.generate();

    // create a new instruction object using the program's initialize instruction method
    const instruction = await counterProgram.methods
      .initialize()
      .accounts({
        payer: publicKey,
        counter: counterKeypair.publicKey,
      })
      .instruction();

    // add instruction to the transaction object
    transaction.add(instruction);

    // try block to sign the transaction and send it using the provider object
    try {
      const signature = await provider.sendAndConfirm(
        transaction,
        // counter keypair is a signer to the transaction, approving its own initialization
        [counterKeypair],
        {
          // skipping preflight checks means the transaction is not simulated prior to sending
          skipPreflight: true,
        }
      );
      // update txsig state
      setTxSig(signature);
      setCounterKey(counterKeypair.publicKey.toBase58());
    } catch (error) {
      console.log(error);
      toast.error("Transaction failed!");
    }
  };

  // helper function to increment the counter we just created
  const handleIncrementCounter = async () => {
    // if no connection or pubkey found, error toast the user
    if (!connection || !publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    // call transaction builder helper function to create transaction object
    const transaction = await getPreparedTransaction();

    // call the increment instruction method from the program's idl
    const instruction = await counterProgram.methods
      .increment()
      .accounts({
        counter: new PublicKey(counterKey),
      })
      .instruction();
    transaction.add(instruction);

    // try block to sign, and send the transaction. no additional signers added
    try {
      const signature = await provider.sendAndConfirm(transaction, [], {
        skipPreflight: true,
      });
      // update txsig state
      setTxSig(signature);
    } catch (error) {
      console.log(error);
      toast.error("Transaction failed!");
    }
  };

  // react useEffect hook to update state if conncetion, pubkey, counterkey, or txsig change
  useEffect(() => {
    const getInfo = async () => {
      if (connection && publicKey && counterKey) {
        try {
          // fetch the counter account's pubkey
          const currentCount = await counterProgram.account.counter.fetch(
            new PublicKey(counterKey)
          );
          // read the account's "count" data and use the setter to update it in state
          setCount(currentCount.count);
        } catch (error) {
          console.log(error);
        }
      }
    };
    getInfo();
  }, [connection, publicKey, counterKey, txSig]);

  // ouputs array to display values on the UI
  const outputs = [
    {
      title: "Counter Value...",
      dependency: count,
    },
    {
      title: "Latest Transaction Signature...",
      dependency: txSig,
      href: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
    },
  ];

  return (
    <main className="min-h-screen text-white max-w-7xl">
      <section className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4">
        <form className="rounded-lg min-h-content p-4 bg-[#2a302f] sm:col-span-6 lg:col-start-2 lg:col-end-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl text-[#fa6ece]">
              Create Counter 💸
            </h2>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleInitializeCounter();
              }}
              // button is disabled if there is no pubkey connected
              disabled={!publicKey}
              className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] 
                rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent 
                border-2 border-transparent hover:border-[#fa6ece]`}
            >
              Initialize Counter
            </button>
            {counterKey && (
              <p className="text-sm text-gray-400">Counter Key: {counterKey}</p>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleIncrementCounter();
              }}
              // button is disabled if there is no pubkey connected or counterkey
              disabled={!publicKey || !counterKey}
              className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] 
                rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent 
                border-2 border-transparent hover:border-[#fa6ece]`}
            >
              Increment Counter
            </button>
          </div>
          <div className="text-sm font-semibold mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
            <ul className="p-2">
              {outputs.map(({ title, dependency, href }, index) => (
                <li
                  key={title}
                  className={`flex justify-between items-center ${
                    index !== 0 && "mt-4"
                  }`}
                >
                  <p className="tracking-wider">{title}</p>
                  {dependency && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex text-[#80ebff] italic ${
                        href && "hover:text-white"
                      } transition-all duration-200`}
                    >
                      {dependency.toString().slice(0, 25)}
                      {href && <ExternalLinkIcon className="w-5 ml-1" />}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Finished;
