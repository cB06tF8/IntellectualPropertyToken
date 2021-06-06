/**
 * @dev Script contains the steps necessary for setting up chai
 * so that it can be easily accessed by any/all test scripts. 
*/
"use strict";
var chai = require("chai");
const BN = web3.utils.BN;
const chaiBN = require("chai-bn")(BN);
chai.use(chaiBN);
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
module.exports = chai;