const BN = web3.utils.BN;
const chai = require("./SetupChai.js");
const expect = chai.expect;

const multiHash = require("../util/multihash.js");
const eventHelper = require("./expectEvent.js");
const getBytes32FromMultihash = multiHash.getBytes32FromMultihash;
const getMultihashFromContractResponse = multiHash.getMultihashFromContractResponse;
const IntelPropertyAgreement = artifacts.require('../contracts/IntelPropertyAgreement.sol');

contract('IntelPropertyAgreement', (accounts) => {    
    let intelPropertyAgreement;
    
    beforeEach(async () => {
      intelPropertyAgreement = await IntelPropertyAgreement.deployed();        
    });
  
    // content baseURL (not used within the test): https://ipfs.infura.io/ipfs/
    const agreementHash = 'QmbnzpFcK1PJKy5YoBiN8WcNDaYQkBqNqqx3qfxDoifE8K'; // file hash content (simple json file for the test)

    /** @dev parses an IPFS multihash into it's relevant parts and stores it on chain */
    async function addAgreement(hash) {
        const { digest, hashFunction, size } = await getBytes32FromMultihash(hash);        
        return await intelPropertyAgreement.addAgreement(digest, hashFunction, size, { from: accounts[0] });    
    }
  
    /** @dev handles the return of an IPFS multihash from the IntelPropertyAgreement contract, converting it into 1 continuous string */
    async function getAgreement(agreementID) {
        /** @dev return vals array: bytes32 digest, uint8 hashfunction, uint8 size  */
        var returnVals = await intelPropertyAgreement.retrieveAgreement(agreementID);    
        return await getMultihashFromContractResponse(returnVals);
    }

    /** @dev test IntelPropertyAgreement deployment */
    describe('deployment', async () => {
        it('IntelPropertyAgreement deploys successfully', async () => {
            const addr = intelPropertyAgreement.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        });
    });

    /** @dev add an IPFS hash as an example of saving an Intellectual Property Agreement for the NFT + Token combo  */
    it('add agreement hash', async () => {
        await addAgreement(agreementHash);
        var retVal = await getAgreement(0);
        expect(retVal).to.equal(agreementHash);
        
        const totAgreements = await intelPropertyAgreement.getTotalAgreements();
        const testNum = 1;
        assert.equal(totAgreements.toString(), testNum.toString());
    });        
});