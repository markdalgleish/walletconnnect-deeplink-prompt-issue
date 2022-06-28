import type { NextPage } from "next";
import Head from "next/head";
import { providers } from "ethers";
import { getAddress } from "ethers/lib/utils";
import WalletConnectProvider from "@walletconnect/ethereum-provider";
import { useEffect, useRef, useState } from "react";

const provider = new WalletConnectProvider({
  chainId: 5, // Goerli
  infuraId: "84842078b09946638c03157f83405213", // Default ID
});

const Home: NextPage = () => {
  const [ready, setReady] = useState(false);
  const [connection, setConnection] = useState<{
    address: string;
    deepLinkUrl: string | null;
    signer: providers.JsonRpcSigner;
  } | null>(null);
  const [populatedTransaction, setPopulatedTransaction] =
    useState<providers.TransactionRequest>();

  async function connect() {
    const accounts = await provider.enable();
    const address = getAddress(accounts[0]);
    const signer = new providers.Web3Provider(provider).getSigner(address);
    const deepLinkJson = localStorage.getItem("WALLETCONNECT_DEEPLINK_CHOICE");
    const deepLinkUrl = deepLinkJson ? JSON.parse(deepLinkJson).href : null;
    setConnection({ address, deepLinkUrl, signer });
  }

  const didMount = useRef(false);
  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    async function init() {
      await connect();
      setReady(true);
    }

    init();
  }, []);

  return (
    <div>
      <Head>
        <title>WalletConnect Deep Link Prompt Issue</title>
      </Head>

      {ready && (
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: 20,
          }}
        >
          {!connection ? (
            <button
              onClick={() => {
                connect();
              }}
              type="button"
            >
              Connect
            </button>
          ) : (
            (() => {
              const { address, deepLinkUrl, signer } = connection;

              return (
                <>
                  <button
                    onClick={() => {
                      signer.sendTransaction({
                        to: address,
                        value: 0,
                      });
                    }}
                    type="button"
                  >
                    Send transaction
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={async () => {
                        setPopulatedTransaction(
                          await signer.populateTransaction({
                            to: address,
                            value: 0,
                          })
                        );
                      }}
                      type="button"
                    >
                      Populate transaction
                    </button>

                    <button
                      disabled={!populatedTransaction}
                      onClick={() => {
                        populatedTransaction &&
                          signer.sendTransaction(populatedTransaction);
                      }}
                      type="button"
                    >
                      Send transaction
                    </button>

                    <button
                      disabled={!populatedTransaction}
                      onClick={() => {
                        populatedTransaction &&
                          signer.sendUncheckedTransaction(populatedTransaction);
                      }}
                      type="button"
                    >
                      Send unchecked transaction
                    </button>
                  </div>

                  {deepLinkUrl && (
                    <>
                      <button
                        onClick={() => {
                          window.location.href = deepLinkUrl;
                        }}
                        type="button"
                      >
                        Deep link
                      </button>

                      <button
                        onClick={() => {
                          setTimeout(() => {
                            window.location.href = deepLinkUrl;
                          }, 1000);
                        }}
                        type="button"
                      >
                        Deep link after 1s
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      provider.disconnect();
                      setConnection(null);
                    }}
                    type="button"
                  >
                    Disconnect
                  </button>
                </>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
