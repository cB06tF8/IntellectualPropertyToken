const BN = web3.utils.BN;
const chai = require("./SetupChai.js");
const expect = chai.expect;

const multiHash = require("../util/multihash.js");
const intelPropHelper = require("../util/intelPropertyHelper.js");
const eventHelper = require("./expectEvent.js");
const { ethers } = require("ethers");

const getBytes32FromMultihash = multiHash.getBytes32FromMultihash;
const getMultihashFromContractResponse = multiHash.getMultihashFromContractResponse;
const intelPropertyNFT = artifacts.require('./IntelPropertyNFT.sol');


contract('IntelPropertyNFT', (accounts) => {
    let intelPropNFT;

    beforeEach(async () => {
        intelPropNFT = await intelPropertyNFT.deployed();
    })

    const ipfsThumbNailHash = 'QmRFWpfJD8EcrX4t3hcHYKFEo95zdrBgLsNqkSKPNKsdZL'; //sample thumbnail art for the NFT
  
    /** @dev parses an IPFS multihash into it's relevant parts and stores it on chain */
    async function addThumbnail(nftIndex, hash) {
        const { digest, hashFunction, size } = getBytes32FromMultihash(hash);
        return intelPropNFT.addThumnail(nftIndex, digest, hashFunction, size, { from: accounts[0] });    
    }

    /** @dev test contract deployment */
    describe('deployment', async () => {
        it('deploys successfully', async () => {
            const addr = intelPropNFT.address;
            assert.notEqual(addr, '0x0'); // test of an empty address
            assert.notEqual(addr, '');
            assert.notEqual(addr, null);
            assert.notEqual(addr, undefined);
        })

        it('has a name and symbol', async () => {
            const name = await intelPropNFT.name();
            assert.equal(name, 'IntelPropertyNFT');
            const sym = await intelPropNFT.symbol();
            assert.equal(sym, 'IPNFT');
        })
    })

    /** @dev test of minting the tokens */
    describe('minting', async () => {
        it('creates 3 new tokens', async () => { 
            var nameBytes = await ethers.utils.formatBytes32String('Her Smile');
            /** @dev - flip back to readable text */
            //let originalText = ethers.utils.parseBytes32String(nameBytes);
            //console.log('original: ' + originalText);
            
            var artistBytes = await ethers.utils.formatBytes32String('Chris Ball');
            var collectionBytes = await ethers.utils.formatBytes32String('Monterey');
            var result = await intelPropNFT.mint(nameBytes, artistBytes, collectionBytes);

            var nameBytes = await ethers.utils.formatBytes32String('East To West');
            artistBytes = await ethers.utils.formatBytes32String('Chris Ball');
             collectionBytes = await ethers.utils.formatBytes32String('Monterey');
            result = await intelPropNFT.mint(nameBytes, artistBytes, collectionBytes);

            var nameBytes = await ethers.utils.formatBytes32String('Minuano');
            artistBytes = await ethers.utils.formatBytes32String('Pat Metheny Group');
             collectionBytes = await ethers.utils.formatBytes32String('Still Life Talking');
            result = await intelPropNFT.mint(nameBytes, artistBytes, collectionBytes);
            var totSupply = await intelPropNFT.totalSupply();
            assert.equal(totSupply, 3);
            const event = result.logs[0].args;
            //console.log('tokenId: ' + event.tokenId); // tokenId will be 3 because we've added 4            
        })
    })

    /** @dev test of minting the tokens */
    describe('adding thumbnail art, plays, and creating events', async () => {
        it('creates a new token', async () => { 
            var nameBytes = await ethers.utils.formatBytes32String('Her Smile');
            var artistBytes = await ethers.utils.formatBytes32String('Chris Ball');
            var collectionBytes = await ethers.utils.formatBytes32String('Monterey');
            var result = await intelPropNFT.mint(nameBytes, artistBytes, collectionBytes);
            var event = result.logs[0].args;

            /** @dev add thumbnail art file */
            await addThumbnail(0, ipfsThumbNailHash);

            /** @dev add record of plays of NFT */           
            await intelPropNFT.addPlay(0);
            intelPropHelper.sleep(2000);            
            await intelPropNFT.addPlay(0);
            intelPropHelper.sleep(2000);
            await intelPropNFT.addPlay(0);

            var tokens = [event.tokenId];
            result = await intelPropNFT.dumpNFTSpecsToEventLog(tokens);
            var event2 = await result.logs[0].args;

            /** @dev name, artist, collection */
            expect(ethers.utils.parseBytes32String(event2[1][1])).to.be.equal('Her Smile');
            expect(ethers.utils.parseBytes32String(event2[1][2])).to.be.equal('Chris Ball');
            expect(ethers.utils.parseBytes32String(event2[1][3])).to.be.equal('Monterey');
            
            //console.log('should be play array: ' + event2[1][4]);
            var thumbNail = [];
            thumbNail = event2[1][5];
            expect(getMultihashFromContractResponse(thumbNail)).to.be.equal(ipfsThumbNailHash);
            
            result = await intelPropNFT.reportPlays([0]);
            var event3 = await result.logs[0].args;
            var timeStamps = [];
            var plays = [];
            timeStamps = event3[1];
            expect(timeStamps.length.toString()).to.be.equal('3');            
            for (i = 0; i < timeStamps.length; i++) {
                console.log('play: ' + intelPropHelper.unixTimeStampToDateTime(timeStamps[i]));
            }
        })
    })

    describe('onlyOwner testing', async () => {
        it('other account not able to mint', async () => {
            let nameBytes = await ethers.utils.formatBytes32String('Her Smile');
            var artistBytes = await ethers.utils.formatBytes32String('Chris Ball');
            var collectionBytes = await ethers.utils.formatBytes32String('Monterey');
            return expect(intelPropNFT.mint(nameBytes, artistBytes, collectionBytes, { from: accounts[1]})).to.be.rejected;
        })
    })

})