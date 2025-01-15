// import BoilerPlate from '../../components/BoilerPlate';

// imports react methods
import * as React from "react";
// imports solana library to interact with the solana json rpc api
import * as web3 from "@solana/web3.js";
// imports methods for deriving data from the wallet's local data store
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { publicKey } from "@project-serum/borsh";
// applies pre-built styling to components in the browser
require("@solana/wallet-adapter-react-ui/styles.css");

const Starter = () => {
  // set and track wallet balance
  const [balance, setBalance] = React.useState<number | null>(0);

  // connection context object, injected into the browser by the wallet
  const { connection } = useConnection();
  // the connected user's/wallet's pubkey
  const { publicKey } = useWallet();

  // this code will run if the connection or publickey change
  React.useEffect(() => {
    const getInfo = async () => {
      // if there is a connection and a publickey in the first place
      if (connection && publicKey) {
        // get account info from user's wallet data store
        const info = await connection.getAccountInfo(publicKey);
        // set info equal to wallet's lamports in SOL
        setBalance(info!.lamports / web3.LAMPORTS_PER_SOL);
      }
    };
    getInfo();
    // the code above will execute whenever the variable below change (the chain connection or the publickey connected through the wallet)
  }, [connection, publicKey]);

  return (
    <main className="min-h-screen text-white">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        <div className="col-span-1 lg:col-start-2 lg:col-end-4 rounded-lg bg-[#2a302f] h-60 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold">account info ✨</h2>
          </div>

          <div className="mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
            <ul className="p-2">
              <li className="flex justify-between">
                <p className="tracking-wider">Wallet is connected...</p>
                <p className="text-turbine-green italic font-semibold">
                  {publicKey ? "yes" : "no"}
                </p>
              </li>

              <li className="text-sm mt-4 flex justify-between">
                <p className="tracking-wider">Balance...</p>
                <p className="text-turbine-green italic font-semibold">
                  {balance}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Starter;
