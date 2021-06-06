const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
require("dotenv").config({path: "./.env"}); 
const AccountIndex = 0; // used for the additional network

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!  
  //contracts_build_directory: path.join(__dirname, "build/contracts"),
  contracts_build_directory: path.join(__dirname, "client/src/abis"),
  networks: {    
    development: {
      port: 7545,
      host: "127.0.0.1",
      network_id: '5777'//,
      //gas: 15000000,	// <-- Use this high gas value
      //gasPrice: 0x01,	// <-- Use this low gas price
    },
    ganache_local: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, "http://127.0.0.1:7545", AccountIndex)
      },
      network_id: 5777
    },
  },
  compilers: {
    solc: {
      version: "0.8.0"
    }
  },
  plugins: 
    ["truffle-contract-size"]
  
};