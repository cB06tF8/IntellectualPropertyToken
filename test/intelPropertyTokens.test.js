const BN = web3.utils.BN;
const chai = require("./SetupChai.js");
const expect = chai.expect;

const multiHash = require("../util/multihash.js");
const intelPropHelper = require("../util/intelPropertyHelper.js");
const eventHelper = require("./expectEvent.js");
const getBytes32FromMultihash = multiHash.getBytes32FromMultihash;
const getMultihashFromContractResponse = multiHash.getMultihashFromContractResponse;
const intelPropertyTokens = artifacts.require('../contracts/IntelPropertyTokens.sol');


contract('IntelPropertyTokens', (accounts) => {    
    let intelProperty;

    /** @dev this list can be altered for different kinds of rightsHolder types */
    const RightsHolderTypes = {
        //0: CREATOR,
        0: 'ARTIST',
        1: 'SONGWRITER',
        2: 'PUBLISHER',
        3: 'MASTERRIGHTSHOLDER', 
    };

    beforeEach(async () => {
      intelProperty = await intelPropertyTokens.new();
    });
  
    // content baseURL (not used within the test): https://ipfs.infura.io/ipfs/
    const ipfsHashes = [
      'QmSr8fFpgMm4x9mFB3NTyctKjfHLpKpzUkKCxNXrisfu9e', //monty python: eat the minstrels wav
      'QmfZRqqYyGCZsKi1rg7ZBioiyU8e499nGibezUFstZZQr2', //monty python: herring wav
    ];

    var currentNFTIndex;
    /** @dev parses an IPFS multihash into it's relevant parts and stores it on chain */
    async function setIPFSHash(nftIndex, hash) {
        let rightsHolders = [accounts[0], accounts[1], accounts[2]];
        let rhTypes = [0, 1, 2];
        let agreementID = 1;
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

    /** @dev test intelProperty deployment */
    describe('deployment', async () => {
        it('IntelPropertyToken deploys successfully', async () => {
            const addr = intelProperty.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        });

        it('has a name and symbol', async () => {
            const name = await intelProperty.name();
            assert.equal(name, 'IntellectualPropertyToken');
            const sym = await intelProperty.symbol();
            assert.equal(sym, 'IPT');
        });
    });

    it('mint tokens for accounts and check balances', async () => {
        currentNFTIndex = new BN(0);
        await setIPFSHash(currentNFTIndex, ipfsHashes[0]);
        var total = await intelProperty.totalSupply();
        expect(total).to.be.bignumber.equal(new BN(1000));
        var bal = await intelProperty.balanceOf(accounts[0]);
        expect(bal).to.be.bignumber.equal(new BN(334));        
    });

    it('should set and get IPFS hashes for each address', async () => {
        currentNFTIndex = new BN(0);
        await setIPFSHash(currentNFTIndex, ipfsHashes[0]);
        currentNFTIndex = new BN(1);
        await setIPFSHash(currentNFTIndex, ipfsHashes[1]);
    
        /** @dev if you want to see the entire IPFS address:
        var show = await getIPFSHash(currentNFTIndex);
        console.log('full IPFS address: ' + show);
        */        

        currentNFTIndex = new BN(0);
        expect(getIPFSHash(currentNFTIndex)).to.eventually.be.equal(ipfsHashes[0]);
        currentNFTIndex = new BN(1);
        expect(getIPFSHash(currentNFTIndex)).to.eventually.be.equal(ipfsHashes[1]);    
        /*
        let totalSupply = await intelProperty.totalSupply();
        console.log('2 NFTs - totalSupply: ' + totalSupply);
        var amount = await intelProperty.balanceOf(accounts[0]);
        console.log('2 NFTs - accounts[0] balance: ' + amount);
        amount = await intelProperty.balanceOf(accounts[2]);
        console.log('2 NFTs - accounts[2] balance: ' + amount);
        */

        /** @dev tokens in these tests are split between 3 accounts (1000/3). accounts[0] gets the extra token */
        expect(intelProperty.balanceOf(accounts[0])).to.eventually.be.a.bignumber.equal(new BN(668));
        expect(intelProperty.balanceOf(accounts[2])).to.eventually.be.a.bignumber.equal(new BN(666));

        /** @dev return total number of ipfsHashes added */
        return expect(intelProperty.numberOfIntelPropertyFiles()).to.eventually.be.a.bignumber.equal(new BN(2));    
    });

    it('return and parse rightsHolder information', async () => {
        currentNFTIndex = new BN(0);
        await setIPFSHash(currentNFTIndex, ipfsHashes[0]);

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
    });

    it('should be able to transfer tokens', async () => {
        currentNFTIndex = new BN(0);
        await setIPFSHash(currentNFTIndex, ipfsHashes[0]);
        currentNFTIndex = new BN(1);
        await setIPFSHash(currentNFTIndex, ipfsHashes[1]);

        /** @dev approve admin/owner for transfers */
        let amount = 100;
        expect(intelProperty.approve(accounts[0], amount)).to.eventually.be.fulfilled;
        expect(intelProperty.transferRightsHolderTokens(0, accounts[0], accounts[1], 100)).to.eventually.be.fulfilled;

        /** @dev transfer from another account without approval by the account being withdrawn from should fail */
        expect(intelProperty.transferRightsHolderTokens(0, accounts[1], accounts[4], amount)).to.eventually.be.rejected;

        /** @dev transfer of more tokens associated with [this account for this specific NFTIndex], but less than 
         * the total tokens belonging to the account for all NFTIndexes should fail */
        currentNFTIndex = new BN(0);
        expect(intelProperty.transferRightsHolderTokens(currentNFTIndex, accounts[0], accounts[1], 400)).to.eventually.be.rejected;
    });
    
    it('owner/admin should be able to activate tokens', async () => {
        currentNFTIndex = new BN(0);
        await setIPFSHash(currentNFTIndex, ipfsHashes[0]);

        var active = false;
        active = await intelProperty.getActiveFlag(currentNFTIndex); 
        assert.equal(active, false);
        await intelProperty.setActiveFlag(currentNFTIndex, true);
        active = await intelProperty.getActiveFlag(currentNFTIndex);        
        assert.equal(active, true);
        await intelProperty.setActiveFlag(currentNFTIndex, false);
        active = await intelProperty.getActiveFlag(currentNFTIndex);        
        assert.equal(active, false);

        /** @dev someone other than the owner.admin of this currentNFTIndex should not be able to change activation */
        expect(intelProperty.setActiveFlag(currentNFTIndex, true, {from: accounts[1]})).to.eventually.be.rejected;

    });        
});