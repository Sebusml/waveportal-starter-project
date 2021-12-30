import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import "./App.css";
import wavePortalAbi from "./utils/WavePortal.json"

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  
  // My webPortal contract running in rinkeby
  const contractAddress = "0x3DAC4433843E2e344594d681cBdfF9A5989aF349";
  const contractABI = wavePortalAbi.abi

  const callGetAllWaves = async () => {
    try {
      const {ethereum} = window;
      if (!ethereum) {
        console.log("null ethereum object");
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const wavesRaw = await wavePortalContract.getAllWaves();

      const waves = wavesRaw.map(wave =>
        ({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        })
      );

      setAllWaves(waves);
      console.log(waves);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message
        },
      ]);
    };
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        
        // Now that user is authentified get list of waves
        callGetAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const callGetTotalWaves = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        // This will use nodes that Metamask provides in the background to send/receive data from our deployed contract.
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved toal count: ", count.toNumber());
      } else {
        console.log("null ethereum object");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        // Metamask estimates the transaction's gas using complex algos. Since this contract 
        // is not deterministic -winners execute more code- it can make wrong estimations 
        // which can lead to erros. By setting gasLimit, we setup price upfront and reimburse
        // the user with the exceeding gas.
        const waveTxn = await wavePortalContract.wave("Default message", { gasLimit: 300000});
        console.log("Mining, transaction hash: ", waveTxn.hash);
        
        await waveTxn.wait();
        console.log("Mined!: ", waveTxn.hash);

        const count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved new total wave count: ", count.toNumber());
      } else {
        console.log("null ethereum object");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="Hand">👋</span> Yo yo!
        </div>

        <div className="bio">
          I'm sebus, connect your Ethereum wallet and wave at me!
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        <button className="waveButton" onClick={callGetTotalWaves}>
          Print current count
        </button>
        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        
        {/* 
        * Render waves
        */}
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App