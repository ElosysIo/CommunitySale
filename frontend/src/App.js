import "./App.css";

import NavbarWithCTAButton from "./components/Navbar";
import { useRoutes } from "react-router-dom";
import Routes from "./Routes";

import { Spinner } from "@material-tailwind/react";

import { EventBus, minAddress } from "./utils/methods";
import { BTN_HEIGHT_IN_MAIN_AREA, BTN_WIDTH_IN_MAIN_AREA, SET_LOADING } from "./utils/constants";
import { useEffect, useState } from "react";
import PrimaryButton from "./components/buttons/PrimaryButton";
import { useAccount, useConnect, useDisconnect, useEnsName, useNetwork } from 'wagmi'
import Presale from "./pages/Presale";

function App() {
  const pages = useRoutes(Routes);
  const [isLoading, setIsLoading] = useState(false);
  const showWalletMenu = false;
  const { chain } = useNetwork();
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address });
  const [roundId, setRoundId] = useState(1);

  const { connect, connectors, error } =
    useConnect()
  const { disconnect } = useDisconnect();

  useEffect(() => {
    console.log(error !== null && error !== undefined && error.message);
  }, [error])

  const setLoading = (data) => {
    setIsLoading(data);
  };

  useEffect(() => {
    EventBus.on(SET_LOADING, (data) => {
      setLoading(data);
    });

    return () => {
      EventBus.remove(SET_LOADING);
    };
  }, []);

  const onUpdateRound = (roundId) => {
    setRoundId(roundId);
  }

  return (

    <div
      className="App flex flex-col bg-[#f6f6f8] min-h-[100vh] overflow-x-hidden text-eloblack items-center"
    >
      <div className="flex w-[100vw] lg:w-[1000px] justify-between h-max px-6 md:px-10 py-5 md:py-8 items-start ">
        <div className="w-full relative">
          <header className="flex flex-row justify-between items-center w-full">
            <div className="flex">
              <span className=" text-xl md:text-2xl font-black text-left">Elosys Sale {roundId < 3 ? "Round "+roundId : "Claiming"}</span>
            </div>
            <NavbarWithCTAButton className="flex" />
          </header>
          
          {
            showWalletMenu &&
            <div className="absolute top-50 left-0 w-full flex flex-col gap-6 rounded-3xl  items-center"
            >
              {isConnected !== true ?
                <div className="flex flex-col gap-3 ">
                  {connectors?.length > 0 && connectors.filter((obj, index, array) => {
                    return index === array.findIndex((el) => el.id === obj.id);
                  }).map((connector) => (
                    <PrimaryButton
                      disabled={!connector.ready}
                      key={connector.id}
                      onClick={() => connect({ connector })}
                      label={`${connector.name} `}
                    />
                  ))}
                </div>
                : <div className="flex flex-col items-center gap-2 " > {
                  (chain && chain.id !== parseInt(process.env.REACT_APP_TARGET_CHAIN_ID)) &&
                  <div className="text-red-400 text-[16px] font-semibold text-center">
                    Please change the network of your wallet into {process.env.REACT_APP_TARGET_CHAIN_NAME}. Elosys presale works on {process.env.REACT_APP_TARGET_CHAIN_NAME}.
                  </div>
                }
                  {
                    (chain && chain.id === parseInt(process.env.REACT_APP_TARGET_CHAIN_ID)) &&
                    <div className="text-green-400 text-[16px] font-semibold text-center">Connected to {chain.name} network.</div>
                  }
                  <div className="text-white text-[16px] font-semibold">{isConnected ? ensName ?? minAddress(address) : "Not connected"}</div>
                  <PrimaryButton label={"Disconnect"} className=""
                    onClick={() => disconnect()}
                    width={BTN_WIDTH_IN_MAIN_AREA}
                    height={BTN_HEIGHT_IN_MAIN_AREA}
                  />
                </div>
              }
            </div>
          }
          {
            showWalletMenu !== true &&
            <div className="w-full mt-5">
              <Presale onUpdateRound={onUpdateRound}/>
            </div>
          }
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          zIndex: 999,
          top: 0,
          left: 0,
          display: `${isLoading ? "flex" : "none"}`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner color="blue" className="h-10 w-10" />
      </div>
    </div>
  );
}

export default App;
