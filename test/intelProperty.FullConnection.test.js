const BN = web3.utils.BN;
const chai = require("./SetupChai.js");
const expect = chai.expect;

const multiHash = require("../util/multihash.js");
const intelPropHelper = require("../util/intelPropertyHelper.js");
const eventHelper = require("./expectEvent.js");
const { ethers } = require("ethers");
const getBytes32FromMultihash = multiHash.getBytes32FromMultihash;
const getMultihashFromContractResponse = multiHash.getMultihashFromContractResponse;

const IntelPropertyAgreement = artifacts.require('../contracts/IntelPropertyAgreement.sol');
const intelPropertyTokens = artifacts.require('../contracts/IntelPropertyTokens.sol');
const intelPropertyNFT = artifacts.require('./IntelPropertyNFT.sol');

/** @dev 
 *  IMPORTANT: The three individual test scripts (IntelPropertyNFT.test.js, IntelPropertyTokens.tst.js
 *  and IntelPropertyAgreement.test.js) cover things in greater detail than this test does. This test's 
 *  focus is the connection between the three contracts, specifically; using the NFT index (typically 
 *  called the nftID) to coordinate and connect the 3 contacts. The nftID is set by the IntelPropertyNFT.sol 
 *  contract and is then used as the key in the 'intelPropertyFile' mapping in IntelPropertyTokens.sol. 
 *  The IntelPropertyTokens contract connects the IntelPropertyAgreement contract to the NFT through itself.
 */
contract('Full Test for Intellectual Property NFT', (accounts) => {
    let intelPropNFT;
    let intelProperty;
    let intelPropertyAgreement;
    let nftID;

    beforeEach(async () => {
        intelPropNFT = await intelPropertyNFT.deployed(); // ERC721
        intelProperty = await intelPropertyTokens.deployed(); // ERC20
        intelPropertyAgreement = await IntelPropertyAgreement.deployed();
    })

    /** @dev this list can be altered for different kinds of rightsHolder types */
    const RightsHolderTypes = {
        //0: CREATOR,
        0: 'ARTIST',
        1: 'SONGWRITER',
        2: 'PUBLISHER',
        3: 'MASTERRIGHTSHOLDER', 
    };
        // content baseURL (not used within the test): https://ipfs.infura.io/ipfs/
    const ipfsHashes = [
        'QmSr8fFpgMm4x9mFB3NTyctKjfHLpKpzUkKCxNXrisfu9e', 
        'QmfZRqqYyGCZsKi1rg7ZBioiyU8e499nGibezUFstZZQr2', 
      ];
    const ipfsThumbNailHash = 'QmRFWpfJD8EcrX4t3hcHYKFEo95zdrBgLsNqkSKPNKsdZL'; 
    const agreementHash = 'QmbnzpFcK1PJKy5YoBiN8WcNDaYQkBqNqqx3qfxDoifE8K'; 

    /** @dev parses an IPFS multihash into it's relevant parts and stores it on chain */
    async function addThumbnail(nftIndex, hash) {
        const { digest, hashFunction, size } = getBytes32FromMultihash(hash);
        return intelPropNFT.addThumnail(nftIndex, digest, hashFunction, size, { from: accounts[0] });    
    }

    /** @dev parses an IPFS multihash into it's relevant parts and stores it, 
      * rightsHolder info and an agreementID for the contract on chain */
    async function setIPFSHash(nftIndex, hash, agreementID) {
        let rightsHolders = [accounts[0], accounts[1], accounts[2]];
        let rhTypes = [0, 1, 2];
        const { digest, hashFunction, size } = getBytes32FromMultihash(hash);
        return intelProperty.addIntelPropertyFile(nftIndex, digest, hashFunction, size, rightsHolders, rhTypes, agreementID, { from: accounts[0] });    
    }
  
    /** @dev handles the return of an IPFS multihash from the contract, converting it into 1 continuous string */
    async function getIPFSHash(nftIndex) {
        /** @dev return vals array: bytes32 digest, uint8 hashfunction, uint8 size  */
        var returnVals = await intelProperty.retrieveIntelPropertyFile(nftIndex);    
        return await getMultihashFromContractResponse(returnVals);
    }

    /** @dev returns the human readable rightsHolder type for the integer supplied */
    function displayRightsHolderType(value) {
        return RightsHolderTypes[value];
    }

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

    /** @dev test contract deployment */
    describe('deployment', async () => {
        it('IntelPropertyNFT deploys successfully', async () => {
            const addr = intelPropNFT.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        })

        it('IntelPropertyNFT has a name and symbol', async () => {
            const name = await intelPropNFT.name();
            assert.equal(name, 'IntelPropertyNFT');
            const sym = await intelPropNFT.symbol();
            assert.equal(sym, 'IPNFT');
        })

        it('IntelPropertyTokens deploys successfully', async () => {
            const addr = intelProperty.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        });

        it('IntelPropertyTokens has a name and symbol', async () => {
            const name = await intelProperty.name();
            assert.equal(name, 'IntellectualPropertyToken');
            const sym = await intelProperty.symbol();
            assert.equal(sym, 'IPT');
        });        

        it('IntelPropertyAgreement deploys successfully', async () => {
            const addr = intelPropertyAgreement.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        });        
    })

    /** @dev test of minting the tokens */
    describe('minting', async () => {
        it('create a new NFT and connect it to IntelPropertyTokens and Agreement', async () => {
            var nameBytes = await ethers.utils.formatBytes32String('Minuano');
            artistBytes = await ethers.utils.formatBytes32String('Pat Metheny Group');
             collectionBytes = await ethers.utils.formatBytes32String('Still Life Talking');
            result = await intelPropNFT.mint(nameBytes, artistBytes, collectionBytes);
            var totSupply = await intelPropNFT.totalSupply();
            assert.equal(totSupply, 1);
            
            /** @dev add thumbnail art file */
            await addThumbnail(0, ipfsThumbNailHash);

            var event = result.logs[0].args;
            nftID = event.tokenId;

            /** @dev add an Agreement to the system that all rightsHolders agree to for this NFT */
            await addAgreement(agreementHash);
            var agreementID = 0;
            var retVal = await getAgreement(agreementID);
            expect(retVal).to.equal(agreementHash);

            /** @dev at this point, the NFT contract has what it needs to get started. Next,
              * pass the tokenId to the IntelPropertyTokens contract to mint rightsHolder tokens */
            await setIPFSHash(nftID, ipfsHashes[0], agreementID);
            var total = await intelProperty.totalSupply();
            expect(total).to.be.bignumber.equal(new BN(1000));
            var bal = await intelProperty.balanceOf(accounts[0]);
            expect(bal).to.be.bignumber.equal(new BN(334));               

            expect(getIPFSHash(nftID)).to.eventually.be.equal(ipfsHashes[0]);

            /** @dev retrieve and parse rightsHolder information */
            var rightsHolders = await intelProperty.retrieveRightsHolderInfo(0);
            var flattenedRHArray = Array.from(intelPropHelper.flatten(rightsHolders));
            
            const lengthOfRHObj = 4; /** @dev agreementID, rightsHolder's address, rightsHolder type, tokens held */
            var numOfRigtsHolders = flattenedRHArray.length / lengthOfRHObj;
            expect(numOfRigtsHolders).to.be.equal(3);
            for (i = 0; i < numOfRigtsHolders; i++) {
                var agree = await flattenedRHArray[i * lengthOfRHObj];
                var rhAddr = await flattenedRHArray[(i * lengthOfRHObj) + 1];
                var rhType = await displayRightsHolderType(flattenedRHArray[(i * lengthOfRHObj) + 2]);
                var rhTokens = await flattenedRHArray[(i * lengthOfRHObj) + 3];
                console.log('RightsHolder account ' + i + ' for NFT 0: Agreement: ' + agree + 
                    ', Address: ' + rhAddr + ', Type: ' + rhType + ', Tokens Held: ' + rhTokens
                );
            }

            /** @dev approve admin/owner and transfer more tokens to a rightsHolder */
            let amount = 100;
            expect(intelProperty.approve(accounts[0], amount)).to.eventually.be.fulfilled;
            expect(intelProperty.transferRightsHolderTokens(0, accounts[0], accounts[1], 100)).to.eventually.be.fulfilled;

        })
    })

})