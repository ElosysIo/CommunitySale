import PrimaryButton from "../components/buttons/PrimaryButton";
import { useEffect, useRef, useState } from "react";
import { Reveal } from 'react-awesome-reveal';
import { BTN_HEIGHT_IN_MAIN_AREA, BTN_WIDTH_IN_MAIN_AREA, STATUS_COMING, STATUS_OVER, STATUS_RUNNING, fadeInRight, fadeInUp } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import BigNumber from "bignumber.js"
import {
  useAccount,
  useBalance,
  useConnect,
  useNetwork,
  useFeeData,
  useWalletClient,
  
} from "wagmi";

import EloPresaleABI from "../wagmi-interaction/EloPresale.json";

import { prepareWriteContract, readContracts,readContract, waitForTransaction, writeContract, fetchBalance } from '@wagmi/core';

import { daysUntilWithdrawal, formatNumber as formatAsMK } from "../utils/methods";
import { ContractFunctionExecutionError, InvalidAddressError, formatUnits, parseEther, parseUnits } from "viem";
import { getTransactionReceipt, publicClient } from "../wagmi-interaction/client";
import { toast } from "react-toastify";
import Status from "../components/Status";
import Loading from "../components/Loading";


export default function Presale({ className, onUpdateRound }) {
  const [depositeAmount, setDepositeAmount] = useState("");
  const [claimInfo, setClaimInfo] = useState({
      deposited: 0,  claim: 0, enable: false
  });
  const [buyAmount, setBuyAmount] = useState("");
  const [roundId, setRoundId] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [purchaseRunning, setPurchaseRunning] = useState(false);
  const [searchRunning, setSearchRunning] = useState(false);
  const [claimRunning, setClaimRunning] = useState(false);

  
  const [roundInfo, setRoundInfo] = useState({
            roundId: 1,
            startTime: 0,
            endTime: 0,
            eloPerEth: 0,
            totalEth: 0,
            maxBuyEth: 0,
            minBuyEth: 0,
            totalRaisedEth: 0,
            totalSoledElo: 0
  })

  // get the gas price
  const { data: feeData, isError: feeDataError, isLoading: feeDataLoading } = useFeeData();

  const [checkingWallet, setCheckingWallet] = useState("");
  const [estimateGas, setEstimateGas] = useState(0);

  const { address, isConnected } = useAccount();
  const { data: connectionData } = useConnect();
  const roundRef = useRef(null);

  const readRoundId = async() => {
    try {
      const data = await readContract({
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getRoundId',
          args: [],
          chainId: connectionData?.chain?.id,
        }
      );

      setRoundId(data !== undefined && data !== null && parseInt(data));
      
      // roundRef.current = data[0] !== undefined && data[0] !== null && data[0]["result"];
    } catch (err) {
      console.log(err);
    }
  }

  const readClaimInfo = async() => {
    try {
      if ( !address ) {
        setClaimInfo({
          deposited: 0,
          claim: 0
        });
        return;
      }
      const data = await readContracts({
        contracts: [{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getAddressInvestment',
          args: [address],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getAddressBoughtElo',
          args: [address],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: '_claim',
          args: [],
          chainId: connectionData?.chain?.id,
        }]
      }
      );

      setClaimInfo({
        deposited: data[0] !== undefined && data[0] !== null && parseFloat(formatUnits(data[0]["result"], 18)),
        claim: data[1] !== undefined && data[1] !== null && parseFloat(formatUnits(data[1]["result"], 18)),
        enable: data[2] !== undefined && data[2] !== null && data[2]["result"]
      });

    } catch (err) {
      console.log(err);
    }
  }

  const readPresaleInfo = async (roundId) => {
    try {

      const data = await readContracts({
        contracts: [{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getRoundStartTime',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getRoundEndTime',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getEloPerEther',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getTotalEth',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getMaxBuyEthPerWallet',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getMinBuyEthPerWallet',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getTotalRaisedEth',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },{
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'getTotalSoledElo',
          args: [roundId],
          chainId: connectionData?.chain?.id,
        },
        ]
      }
      );

      roundRef.current = {
        roundId,
        startTime: data[0] !== undefined && data[0] !== null && parseInt(data[0]["result"]),
        endTime: data[1] !== undefined && data[1] !== null && parseInt(data[1]["result"]),
        eloPerEth: data[2] !== undefined && data[2] !== null && parseFloat(formatUnits(data[2]["result"], 18)),
        totalEth: data[3] !== undefined && data[3] !== null && parseFloat(formatUnits(data[3]["result"], 18)),
        maxBuyEth: data[4] !== undefined && data[4] !== null && parseFloat(formatUnits(data[4]["result"], 18)),
        minBuyEth: data[5] !== undefined && data[5] !== null && parseFloat(formatUnits(data[5]["result"], 18)),
        totalRaisedEth: data[6] !== undefined && data[6] !== null && parseFloat(formatUnits(data[6]["result"], 18)),
        totalSoledElo: data[7] !== undefined && data[7] !== null && parseFloat(formatUnits(data[7]["result"], 18)),
      };

      setRoundInfo(roundRef.current);

    } catch (err) {
      console.log(err);
    }
  }

  useEffect(()=>{
    readClaimInfo();
  }, [address]);

  useEffect(()=>{
    let timer  = setInterval(()=>{
      readRoundId();
      setCurrentTime(Date.now());
      // readClaimInfo();
      // console.log(roundRef.current);
      // readPresaleInfo(roundRef.current);
    }, 1000);
    
    return () => {
      if(timer>0) clearInterval(timer);
    }
  }, [])

  useEffect(()=>{
    if (roundId === 1 || roundId === 2) {
      readPresaleInfo(roundId);
    } 
    onUpdateRound(roundId);
    
  }, [roundId])

  // useEffect(()=>{
  //   doEstimateGas();
  // },[feeData, roundInfo, ethBalanceData]);

  useEffect(()=>{
    const amount = parseFloat(depositeAmount);
    if ( !amount ) {
      setBuyAmount("");
    } else {
      setBuyAmount(formatBlanace(amount / roundInfo.eloPerEth, 3));
    }
  }, [depositeAmount, roundInfo]);

  // useEffect(()=>{
  //   const amount = parseFloat(buyAmount);
  //   if ( !amount ) {
  //     setDepositeAmount("");
  //   } else {
  //     setDepositeAmount(formatBlanace(amount * roundInfo.eloPerEth, 8));
  //   }
  // }, [buyAmount, roundInfo])

  const onClickMax = async () => {
    try {
      const gasFee = parseUnits('0.0003', 18);//await doEstimateGas();
      const balance = !gasFee ? 0 : await getEthBalance();
      if ( balance < gasFee ) {
        setDepositeAmount(0);
        return;
      }
      const maxBuy = Math.min(roundInfo.maxBuyEth, roundInfo.totalEth - roundInfo.totalRaisedEth);
      setDepositeAmount(formatBlanace(Math.max(0, Math.min(formatUnits(balance - gasFee, 18), maxBuy))));
    } catch (error) {
      console.log(error);
    }
  }

  const onClickPurchase = async () => {
    try {
      const amount = parseFloat(depositeAmount);
      if ( amount < roundInfo.minBuyEth ) {
        toast.warn(`You could deposite between ${roundInfo.minBuyEth}ETH and ${roundInfo.maxBuyEth}ETH`);
        setPurchaseRunning(false);
        return;
      }
      if ( amount + roundInfo.totalRaisedEth > roundInfo.totalEth ) {
        toast.warn(`Total depositable amount in this round is ${roundInfo.totalEth}ETH`);
        setPurchaseRunning(false);
        return;
      }
      const data = await callContractFunction("buy",[], parseUnits(depositeAmount.toString(), 18));
      if ( data ) {
        toast.info(`You have deposited ${depositeAmount} ETH successfully.\nYou can claim ELO tokens after presale is over.`);
      }

      readPresaleInfo(roundId);
      readClaimInfo();

    } catch (error) {
      console.log("buyELO error = ", error);
    }
    setPurchaseRunning(false);
  }

  const onClickClaim = async() => {
    try {
      const data = await callContractFunction("claimElo",[]);
      if ( data ) {
        toast.info(`You have claimed ${formatBlanace(claimInfo.claim)} ELO successfully.`);
      }
      readClaimInfo();
    } catch (error) {
      console.log("Claim error = ", error);
    }
    setClaimRunning(false);
  }

  const onClickSearch = async () => {
    try {
      const data = await readContract({
        address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
        abi: EloPresaleABI,
        functionName: 'checkWhitelist',
        args: [checkingWallet],
        chainId: connectionData?.chain?.id,
      });

      if ( data ) {
        toast.info(`Good News. You are in whitelist.`);
      } else {
        toast.warn(`Bad News. You aren't in whitelist.`);
      }
    } catch (error) {
      console.log("Search error = ", error);
      if ( error instanceof InvalidAddressError) {
        toast.warn(`Address ${checkingWallet} is invalid.`);
        setSearchRunning(false);
        return;
      }
      
      toast.warn(`Failed to retrieve whitelist information. Please check your internet and try again.`);
    }
    setSearchRunning(false);
  }

  const callContractFunction = async (functionName, args, value) => {
    try {
      const config  = await prepareWriteContract ({
        address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
        abi: EloPresaleABI,
        functionName,
        args,
        value,
        chainId: connectionData?.chain?.id,
      });

      const response = await writeContract(config);

      const result = await waitForTransaction({
        hash: response.hash,
        // confirmations: 2,
        chainId: connectionData?.chain?.id
      })
      return result;
    } catch (error) {
    
      if (error?.cause?.shortMessage) {
        toast.warning(error?.cause?.shortMessage);
        return null;          
      }
      toast.warning(error.message);
      console.log(`${functionName} call = `, error);
      
      return null;
    }
  }

  const doEstimateGas = async () => {
    if (!feeData?.gasPrice || estimateGas || !roundInfo.maxBuyEth) return;

      try {
        const data = await prepareWriteContract ({
          address: process.env.REACT_APP_ELOSYS_PRESALE_CONTRACT_ADDRESS,
          abi: EloPresaleABI,
          functionName: 'buy',
          args: [],
          value: parseUnits(roundInfo.minBuyEth.toString(), 18),
          chainId: connectionData?.chain?.id,
          gasPrice: parseUnits('1', 18)//feeData.gasPrice//parseUnits('0.0003', 18)
        });
        
        console.log("prepareWriteContract = ", data);
        return 0.0003;
      } catch (error) {
        console.log("doEstimateGas", error);

        const keyword = "supplied gas";
        if ( error?.cause?.message && error.cause.message.indexOf(keyword) > -1 ) {
          const str =error.cause.message;
          const start = str.indexOf(keyword);
          const end = str.indexOf(")", start);
          const subString = str.substring(start + keyword.length+1, end);
          return formatUnits(feeData.gasPrice * parseUnits(subString, 0), 18);
        }

        // if it throws an error, it means the transaction will fail
        if (error?.cause?.reason) {
          toast.warning(error.cause.reason);
          return null;          
        }
        toast.warning(error.message);
        return 0;
      }
  }


  const getEthBalance = async () => {
    if ( !address ) {
      return 0;
    }
    try {
      const data = await fetchBalance({
        address,
        chainId: connectionData?.chain?.id,
      });

      return data.value;//parseFloat(formatUnits(data.value, data.decimals));
    } catch (error) {
      return 0;
    }
  }

  const formatNumber = (v) => {
    return v < 10 ? "0" + v : v;
  }

  const formatBlanace = (v, digits = 4) => {
    return Math.floor(v * (10 ** digits) + 1e-2) / (10 ** digits);
  }

  const getTimeUnit = (unit) => {
    const now = Math.floor(Date.now() / 1000);
    
    if ( roundId > 2 || roundInfo.startTime === 0 ) {
      return "00";
    }

    let value = now < roundInfo.startTime ? roundInfo.startTime - now : roundInfo.endTime - now;

    if ( value < 0 ) {
      return "00";
    }

    if ( unit === 's' ) {
      return formatNumber(value % 60);
    }
    value = Math.floor(value / 60);
    if ( unit === 'm' ) {
      return formatNumber(value % 60);
    }
    value = Math.floor(value / 60);
    if ( unit === 'h' ) {
      return formatNumber(value % 24);
    }
    value = Math.floor(value / 24);
    return formatNumber(value);
  }

  const getStatus = () => {
    const now = Math.floor(Date.now() / 1000);
    // const now = roundInfo.startTime - 1;
    if ( roundId > 2 ) {
      return STATUS_OVER;
    }
    return now < roundInfo.startTime ? STATUS_COMING : STATUS_RUNNING;
  }

  function commafy( num ) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
  }

  return (
    <div className={`${className} flex flex-col  `}>
      <div className="w-full flex flex-row justify-center">
        <div
          className="overflow-hidden w-full md:w-[520px] flex flex-col justify-between "
        >
          <Reveal keyframes={fadeInUp} className='onStep' delay={0} duration={800} triggerOnce>
            <div className="flex flex-col gap-3"> 
              <div className="flex">
                <span className="text-2xl font-bold text-left">Count down</span>
                <Status status={getStatus()}/>
              </div>
              { roundId <= 2 &&
              <div className="bg-white rounded-xl border-none flex flex-col gap-3 items-center justify-center px-4 py-5">
                <div className="flex gap-3 items-center justify-center">
                  <div className="border-[1px] rounded-xl border-eloline w-[60px] py-2 flex flex-col">
                    <span className="text-2xl font-black">{getTimeUnit('d')}</span>
                    <span className="text-xs text-elogray">Days</span>
                  </div>
                  <div className="border-[1px] rounded-xl border-eloline w-[60px] py-2 flex flex-col">
                    <span className="text-2xl font-black">{getTimeUnit('h')}</span>
                    <span className="text-xs text-elogray">Hours</span>
                  </div>
                  <div className="border-[1px] rounded-xl border-eloline w-[60px] py-2 flex flex-col">
                    <span className="text-2xl font-black">{getTimeUnit('m')}</span>
                    <span className="text-xs text-elogray">Mins</span>
                  </div>
                  <div className="border-[1px] rounded-xl border-eloline w-[60px] py-2 flex flex-col">
                    <span className="text-2xl font-black">{getTimeUnit('s')}</span>
                    <span className="text-xs text-elogray">Secs</span>
                  </div>
                </div>
              </div>
              }

              { roundId < 3 && 
                <div className="bg-white rounded-xl border-none flex flex-col gap-4 py-5 px-4">
                  <div className="flex justify-between items-center w-full px-2">
                    <span className="text-lg font-bold text-elogray">Ethereum raised</span>
                    {/* <span className="text-lg font-bold text-elogray">You deposited</span> */}
                  </div>
                  <div className="flex justify-between items-center w-full px-2">
                    <span className="text-xl font-bold text-eloblack">{formatBlanace(roundInfo.totalRaisedEth)} ETH / {formatBlanace(roundInfo.totalEth)} ETH</span>
                    {/* <span className="text-xl font-bold text-elogreen">&nbsp;{formatBlanace(deposited)} ETH</span> */}
                  </div>
                  
                  <div class="flex flex-start bg-[#f4f7f9] overflow-hidden font-sans rounded-full text-xs font-medium h-4 mx-2">
                    <div class="flex justify-center items-center h-full overflow-hidden break-all rounded-full bg-elogreen text-white" 
                      style={{width: Math.round(roundInfo.totalRaisedEth * 100 / roundInfo.totalEth) + "%"}}/>
                  </div>
                  <hr className="bg-elogray mx-2 mt-2 mb-1"/>
                  <div className="flex justify-between items-center w-full px-2">
                    <span className="text-lg font-bold text-elogray">Round {roundId}</span>
                    <span className="text-lg font-bold text-elogray">Price</span>
                  </div>
                  <div className="flex justify-between items-center w-full px-2">
                    <span className="text-xl font-bold text-eloblack">{formatAsMK(Math.floor(roundInfo.totalEth / roundInfo.eloPerEth))} ELO</span>
                    <span className="text-xl font-bold text-elogreen">&nbsp;${formatBlanace(2200 * roundInfo.eloPerEth, 6)}</span>
                  </div>
                  { !claimInfo.deposited && 
                    <div className="rounded-xl border-none flex flex-col gap-5 p-5 bg-[#e6f4ee]">
                      <div className="rounded-xl border-[0.5px] border-eloline flex flex-row p-2 items-center gap-2">
                        <img src="/logo-eth.png" className="w-[30px] h-[30px]" alt=""/>
                        <input
                            className="text-base font-normal bg-transparent outline-none flex-auto"
                            size="10"
                            placeholder="Enter amount"
                            disabled = {getStatus() !== STATUS_RUNNING || purchaseRunning }
                            value={depositeAmount}
                            onChange={(e) => setDepositeAmount(e.target.value)}
                          ></input>
                        <PrimaryButton
                          className={"bg-[#bfe4d3] text-sm py-1 text-elogreen font-bold"}
                          label={"MAX"}
                          onClick={() => {
                            if ( getStatus() !== STATUS_RUNNING || purchaseRunning ) return;
                            onClickMax()
                          }}
                        />
                      </div>
                      {/* <span className="text-sm text-red-300">Amount should be between 0.1ETH and 0.3ETH</span> */}
                      <div className="rounded-xl border-[0.5px] border-eloline flex flex-row p-2 items-center gap-2">
                        <img src="/logo-elo.png" className="w-[30px] h-[30px]" alt=""/>
                        <div className={`text-base font-normal bg-transparent outline-none flex-auto text-left ${!buyAmount && "text-gray-600"}`} >
                          {buyAmount ? buyAmount : "Receive"}
                        </div>
                        {/* <input
                            className="text-base font-normal bg-transparent outline-none flex-auto"
                            size="10"
                            placeholder="Receive"
                            value={buyAmount}
                            onChange={(e) => setBuyAmount(e.target.value)}
                          ></input> */}
                      </div>
                      <PrimaryButton
                          label={
                          <>
                            Purchase
                            {purchaseRunning && <Loading className={"w-4 h-4 ml-2"}/>}
                          </>}
                          disabled={getStatus() !== STATUS_RUNNING || purchaseRunning}
                          onClick={() => {  
                            if ( getStatus() !== STATUS_RUNNING || purchaseRunning ) return;
                            setPurchaseRunning(true); 
                            onClickPurchase();
                          }}
                        />

                    </div>
                  }
                </div>
              }

              {
                (claimInfo.deposited > 0 || roundId > 2) &&
                <div className="bg-white rounded-xl border-none flex flex-col gap-4 py-5 px-4">
                  { (claimInfo.deposited > 0 || !claimInfo.claim) ? 
                  <>
                    <div className="flex justify-between items-center w-full px-2">
                      <span className="text-sm md:text-lg font-bold text-elogray">You deposited</span>
                      <span className="text-lg font-bold text-eloblack">{formatBlanace(claimInfo.deposited)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center w-full px-2">
                      <span className="text-sm md:text-lg font-bold text-elogray">You will receive</span>
                      <span className="text-lg font-bold text-elogreen">{commafy(formatBlanace(claimInfo.claim))} ELO</span>
                    </div>
                  </>
                  :
                  <div className="flex justify-between items-center w-full px-2">
                      <span className="text-sm md:text-lg font-bold text-elogray">You received</span>
                      <span className="text-lg font-bold text-elogreen">{commafy(formatBlanace(claimInfo.claim))} ELO</span>
                    </div>
                  }
                  { (claimInfo.enable && claimInfo.deposited) ? 
                    <PrimaryButton
                      label={
                        <>
                          Claim
                          {claimRunning && <Loading className={"w-4 h-4 ml-2"}/>}
                        </>}
                      onClick={() => { 
                        if ( claimRunning ) {
                          return;
                        }
                        setClaimRunning(true); 
                        onClickClaim();
                      }}
                    />
                    :
                    <></>
                  }
                  
                  { (!claimInfo.enable && claimInfo.deposited) ?
                    <span className="text-sm md:text-lg font-bold text-blue-500">Waiting for a moment. You can claim soon.</span>
                    :
                    <></>
                  }
                </div>
                
              }

              { roundId === 1 && 
              <>
                <span className="text-2xl font-bold text-left">Whitelist Checker</span>

                <div className="bg-white rounded-xl border-none flex flex-col gap-4 py-5 px-6">
                  <span className="text-xl font-bold text-eloblack text-left ">Search by your address</span>
                  
                  <input
                    className="text-base font-normal bg-transparent outline-none flex-auto"
                    size="10"
                    placeholder="0x0000000000000000000000000000000000000000"
                    value={checkingWallet}
                    onChange={(e) => setCheckingWallet(e.target.value)}
                  ></input>
                  <PrimaryButton
                      label={
                        <>
                          Search
                          {searchRunning && <Loading className={"w-4 h-4 ml-2"}/>}
                        </>}
                      onClick={() => { setSearchRunning(true); onClickSearch();}}
                    />
                </div>
              </>
              }

            </div>
          </Reveal>
        </div>

      </div>

    </div>
  );
}
