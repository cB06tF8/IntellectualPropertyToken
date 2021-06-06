const multiHash = require("../util/multihash.js");
const getBytes32FromMultihash = multiHash.getBytes32FromMultihash;
const getMultihashFromBytes32 = multiHash.getMultihashFromBytes32;
const chai = require("./SetupChai.js");
const expect = chai.expect;

describe('multihash', () => {
  it('should be able convert IPFS hash back and forth', async () => {
    const multihash = 'QmSr8fFpgMm4x9mFB3NTyctKjfHLpKpzUkKCxNXrisfu9e';

    expect(getMultihashFromBytes32(getBytes32FromMultihash(multihash))).to.be.equal(multihash);
  });
});
