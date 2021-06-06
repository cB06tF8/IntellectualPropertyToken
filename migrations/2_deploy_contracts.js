var IntelPropertyNFT = artifacts.require("../contracts/IntelPropertyNFT.sol");
var IntelPropertyTokens = artifacts.require("../contracts/IntelPropertyTokens.sol");
var IntelPropertyAgreement = artifacts.require("../contracts/IntelPropertyAgreement.sol");

module.exports = function(deployer) {
  deployer.deploy(IntelPropertyNFT);  
  deployer.deploy(IntelPropertyTokens);
  deployer.deploy(IntelPropertyAgreement);   
};
