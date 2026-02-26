"use client";

import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useAccount, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export function ConnectWalletButton() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <Wallet>
      <ConnectWallet />
      {isConnected && chainId !== baseSepolia.id && (
        <button
          type="button"
          onClick={() => switchChain?.({ chainId: baseSepolia.id })}
          className="mt-2 w-full px-3 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white"
        >
          Switch to Base Sepolia
        </button>
      )}
      <WalletDropdown>
        <Identity hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}
