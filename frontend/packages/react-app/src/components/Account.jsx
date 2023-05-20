import { Button } from "antd";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { useTokenPrice } from "../hooks";
import Address from "./Address";
import Balance from "./Balance";
import TokenBalance from "./TokenBalance";
import Wallet from "./Wallet";
import { useContractReader } from "eth-hooks";
const { ethers } = require("ethers");
/** 
  ~ What it does? ~

  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out

  ~ How can I use? ~

  <Account
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
    isContract={boolean}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
**/

export default function Account({
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  isContract,
  readContracts
}) {
  const { currentTheme } = useThemeSwitcher();

  // Mainnet price 
  const ssvTokenPrice = useTokenPrice("0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54");
  // testnet balance 
  const ssvTokenBalance = useContractReader(readContracts, "SSVTOKENADDRESS", "balanceOf", [address]);
  console.log("ssvTokenBalance", ssvTokenBalance);

  let accountButtonInfo;
  if (web3Modal?.cachedProvider) {
    accountButtonInfo = { name: "Logout", action: logoutOfWeb3Modal };
  } else {
    accountButtonInfo = { name: "Connect", action: loadWeb3Modal };
  }

  const display = !minimized && (
    <span>
      <span style={{ fontSize: 15, verticalAlign: "middle", padding: 8 }}>SSV Price: {ssvTokenPrice} </span>
      {address && (
        <Address address={address} ensProvider={mainnetProvider} blockExplorer={blockExplorer} fontSize={20} />
      )}
      <Balance address={address} provider={localProvider} price={price} size={20} />
       <span style={{ fontSize: 15, verticalAlign: "middle", padding: 8 }}>{ ssvTokenBalance ? Number(ethers.utils.formatEther(ssvTokenBalance)).toFixed(2) : 0} SSV </span>
      {!isContract && (
        <Wallet
          address={address}
          provider={localProvider}
          signer={userSigner}
          ensProvider={mainnetProvider}
          price={price}
          color={currentTheme === "light" ? "#1890ff" : "#2caad9"}
          size={22}
          padding={"5px"}
        />
      )}
    </span>
  );

  return (
    <div style={{ display: "flex" }}>
      {display}
      {web3Modal && (
        <Button style={{ marginLeft: 8 }} shape="round" onClick={accountButtonInfo.action}>
          {accountButtonInfo.name}
        </Button>
      )}
    </div>
  );
}
