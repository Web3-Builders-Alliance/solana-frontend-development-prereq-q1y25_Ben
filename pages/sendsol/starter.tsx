// so we can have a stateful react app, and create useEffect hooks when component data changes
import React, { useState, useEffect } from "react";
import * as web3 from "@solana/web3.js";
// to display toast pop up notifications to the user
import { toast } from "react-toastify";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// icon library
import { ExternalLinkIcon } from "@heroicons/react/outline";

const Finished = () => {
  // account state and setter, default blank
  const [account, setAccount] = useState("");
  // amount state and setter, default 0
  const [amount, setAmount] = useState(0);
  // balance state and setter, default 0
  const [balance, setBalance] = useState(0);
  // transaction signature state and setter, default blank
  const [txSig, setTxSig] = useState("");

  // connection object using connection provider
  const { connection } = useConnection();
  // publicKey object and sendTransaction method through wallet provider
  const { publicKey, sendTransaction } = useWallet();

  // transaction handler to be called in the UI
  const handleTransaction = async () => {
    // if no connection or pubkey, toast the user with message
    if (!connection || !publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }

    // create objects for the recent blockhash and last valid block height using the conncetion provider
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    // create transaction info object
    const txInfo = {
      feePayer: publicKey,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };
    // create a new transaction from the transaction info object
    const transaction = new web3.Transaction(txInfo);

    // create a new instruction using the system program's transfer method
    const instruction = web3.SystemProgram.transfer({
      fromPubkey: publicKey,
      lamports: amount * web3.LAMPORTS_PER_SOL,
      toPubkey: new web3.PublicKey(account),
    });

    // add instruction to transaction object
    transaction.add(instruction);

    // sign the transaction and send it using the connection provider
    try {
      const signature = await sendTransaction(transaction, connection);
      setTxSig(signature);

      // update user's balance
      const newBalance = balance - amount;
      setBalance(newBalance);
    } catch (error) {
      console.log(error);
      toast.error("Transaction failed!");
    }
  };

  // react useEffect hook to update user's balance if connection or publicKey change
  useEffect(() => {
    const getInfo = async () => {
      if (connection && publicKey) {
        const info = await connection.getAccountInfo(publicKey);
        setBalance(info!.lamports / web3.LAMPORTS_PER_SOL);
      }
    };
    getInfo();
  }, [connection, publicKey]);

  // some UI elements
  const outputs = [
    {
      title: "Account Balance...",
      dependency: balance,
    },
    {
      title: "Transaction Signature...",
      dependency: txSig,
      href: "https://explorer.solana.com/tx/{txSig}?cluster=devnet",
    },
  ];

  return (
    <main className="min-h-screen text-white max-w-7xl">
      <section className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4">
        <form className="rounded-lg min-h-content p-4 bg-[#2a302f] sm:col-span-6 lg:col-start-2 lg:col-end-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl text-[#fa6ece]">Send Sol 💸</h2>
            <button
              onClick={(e) => {
                // e.preventDefault prohibits the page from submitting the form and forcing a page reload on user click
                e.preventDefault();
                handleTransaction();
              }}
              // button is disabled if no account connected or no amount input by user
              disabled={!account || !amount}
              className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] rounded-lg w-24 py-1 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]"
            >
              Submit
            </button>
          </div>
          <div className="mt-6">
            <h3 className="italic text-sm">Address of receiver</h3>
            <input
              id="account"
              type="text"
              placeholder="Public key of receiver"
              className="text-[#9e80ff] py-1 w-full bg-transparent outline-none resize-none border-2 border-transparent border-b-white"
              onChange={(event) => setAccount(event.target.value)}
            />
          </div>
          <div className="mt-6">
            <h3 className="italic text-sm">Number amount</h3>
            <input
              id="amount"
              type="number"
              min={0}
              placeholder="Amount of SOL"
              className="text-[#9e80ff] py-1 w-full bg-transparent outline-none resize-none border-2 border-transparent border-b-white"
              onChange={(event) => setAmount(Number(event.target.value))}
            />
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
