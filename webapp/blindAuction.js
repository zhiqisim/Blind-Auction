import { useState, useRef, useEffect } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
// NOTE: be aware of this: https://flaviocopes.com/parcel-regeneratorruntime-not-defined/
import Web3 from "web3";
const keccak256 = require('keccak256')


// importing a compiled contract artifact which contains function signature etc. to interact
import artifact from "../build/contracts/Bank.json"; // REMEMBER TO CHANGE THIS!!!

const myAddress = "0x612f3f3bc105eb95b14Af4A93D9788cC888E6054"; // MAY NEED TO FILL UP
const infuraWSS = `wss://ropsten.infura.io/ws/v3/58dd641dd5c54a49b9418a8e2e4e17c5`; // PLEASE CHANGE IT TO YOURS (changed)

// run $ truffle migrate --network ropsten --reset
// export const BlindAuctionContractAddress = ""; // TO FILL UP!!
export const Testnet = "ropsten"; // PLEASE CHANGE IT TO YOURS (changed)

const web3 = new Web3(
    Web3.currentProvider || new Web3.providers.WebsocketProvider(infuraWSS)
);
// doc here: https://web3js.readthedocs.io/en/v1.2.11/web3.html#providers

// const contract = new web3.eth.Contract(artifact.abi, BlindAuctionContractAddress); // Need to put this into each function

export const bid = async (value, real, secret, contractAddress) => {
    // contract = new web3.eth.Contract(artifact.abi, contractAddress);

    let blindedBid = keccak256(artifact.abi.encodePacked(value, real, secret)); // a lot of errors here

    const provider = await detectEthereumProvider();
    if (provider) {
        // From now on, this should always be true:
        // provider === window.ethereum
        ethereum.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: ethereum.selectedAddress,
                    to: "0x612f3f3bc105ab95b14Af4A93D9788cC888E6054",
                    value: web3.utils.toWei(0, 'ether'),
                    gas: web3.utils.toHex(46899),
                    gasPrice: web3.utils.toHex(15000),

                    data: web3.eth.abi.encodeFunctionCall(
                        {
                            name: "bid",
                            type: "function",
                            inputs: [
                                {
                                    type: 'string',
                                    name: 'blindedBid'
                                },
                                {
                                    type: 'string', // might not be string wrong, need to check
                                    name: 'address'
                                },
                            ],
                        },
                        [blindedBid, ethereum.selectedAddress]
                    ), // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-abi.html#encodefunctioncall
                    chainId: 3, // ropsten
                },
            ],
        });
    } else {
        console.log("Please install MetaMask!");
    }

}

export const lookupAddress = async (addr) => {
    // doc here: https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#methods-mymethod-call
    const result = await contract.methods.getRegisteredURL(addr).call({ from: myAddress });

    return { ownerAddress: result };
};

export const getAddressList = async () => {
    const result = await contract.methods.getAddresses().call({ from: myAddress });
    return { addressList: result }
}

export const getURLCount = async (addr) => {
    const result = await contract.methods.getURLCount(addr).call({ from: myAddress });
    return { count: result }
}

export const getURL = async (addr, idx) => {
    const result = await contract.methods.getURL(addr, idx).call({ from: myAddress });
    return { domainName: result }
}

export const sendETH = async (amount, ownerAddress) => {
    // Using MetaMask API to send transaction
    //
    // please read: https://docs.metamask.io/guide/ethereum-provider.html#ethereum-provider-api
    const provider = await detectEthereumProvider();
    if (provider) {
        // From now on, this should always be true:
        // provider === window.ethereum
        ethereum.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: ethereum.selectedAddress,
                    to: ownerAddress,
                    value: web3.utils.toWei(amount, 'ether'),
                    gas: web3.utils.toHex(46899),
                    gasPrice: web3.utils.toHex(15000),
                    data: null,
                    chainId: 3, // ropsten
                },
            ],
        });
    } else {
        window.alert("Please install MetaMask!");
        // console.log("Please install MetaMask!");
    }
}



export const startAuction = async (domainURL) => {
    const provider = await detectEthereumProvider();
    if (provider) {
        // From now on, this should always be true:
        // provider === window.ethereum
        ethereum.request({
            method: "eth_sendTransaction",
            params: [
                {
                    from: ethereum.selectedAddress,
                    to: BlindAuctionContractAddress,
                    value: web3.utils.toWei(amount, 'ether'),
                    gas: web3.utils.toHex(46899),
                    gasPrice: web3.utils.toHex(15000),

                    data: web3.eth.abi.encodeFunctionCall(
                        {
                            name: "startAuction",
                            type: "function",
                            inputs: [
                                {
                                    type: 'string',
                                    name: 'domainURL'
                                }
                            ],
                        },
                        [domainURL]
                    ), // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-abi.html#encodefunctioncall
                    chainId: 3, // ropsten
                },
            ],
        });
    } else {
        console.log("Please install MetaMask!");
    }
}


