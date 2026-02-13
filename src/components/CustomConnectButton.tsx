"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const CustomConnectButton = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected =
          ready &&
          account &&
          chain
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button" className="ml-auto font-bold border-purple-900 text-purple-900 hover:text-purple-300 hover:border-purple-800">
                    Connect Wallet
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button" className="ml-auto font-bold border-purple-900 text-purple-900 hover:text-purple-300 hover:border-purple-800">
                    Wrong network
                  </button>
                );
              }
              return (
                <div className="flex justify-between items-center border border-purple-900 text-purple-900 hover:text-purple-300 hover:border-purple-800">
                  <button
                    onClick={openChainModal}
                    className="ml-auto font-bold border-purple-900 text-purple-900 hover:text-purple-300 hover:border-purple-800"
                    type="button"
                  >
                    {chain.hasIcon && (
                      <div>
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                          />
                        )}
                      </div>
                    )}
                    {/* {chain.name} */}
                  </button>
                  <button onClick={openAccountModal} type="button">
                    {account.displayName}
                    {/* {account.displayBalance
                      ? ` (${account.displayBalance})`
                      : ''} */}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
