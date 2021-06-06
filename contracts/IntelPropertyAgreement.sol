// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/** @notice This contract is extremely simple. It adds an IPFS Multihash (by it's 3 distinct parts) to a contract.
  * @dev It's dependent on a js file (see ../util/multihash.js or you can use an equiv.) taking the full IPFS hash 
  * string and parsing it into it's respective parts:
  * bytes32 digest
  * uint8 hashFunction
  * uint8 size
  * Parsing in this way allows the hash to be stored onchain in an efficient manner. Note that this contract could 
  * easily be used for saving any IPFS hash address to a contract that a dApp needs. Here, we're using it for storing 
  * an Agreement file (a signed pdf, for instance) that all parties to an Intellectual Property NFT + an Intellectual 
  * Property RightsHolder ERC20 Token combination have agreed upon. It allows a simple index to be referenced in 
  * other contracts.
*/
contract IntelPropertyAgreement is Ownable {

	struct Multihash {
		bytes32 digest;
		uint8 hashFunction;
		uint8 size;
  	}
    
    mapping (uint => Multihash) agreements;
    uint totalAgreements;
    
	event ipfsHashSetToNFT (uint indexed agreementID, bytes32 digest, uint8 hashFunction, uint8 size);

	/** @notice adds a parsed IPFS hash file to the contract */
	function addAgreement(bytes32 _digest, uint8 _hashFunction, uint8 _size) external onlyOwner {
		(Multihash storage entry) = (agreements[totalAgreements]);
		entry.digest = _digest;
		entry.hashFunction = _hashFunction;
		entry.size = _size;
        emit ipfsHashSetToNFT(totalAgreements, _digest, _hashFunction, _size);        
        totalAgreements++; // increment to reset index for the next incoming agreement
    }

	/** @notice returns an IPFS hash by it's ID number. Note that the Multihash will need to be re-combined, 
	  * (see ../util/multihash.js). */
    function retrieveAgreement(uint _agreementID)  public view returns(Multihash memory) {
		(Multihash storage agreement) = (agreements[_agreementID]);
		return agreement;
    }

	/** @notice returns the total number of agreements present in the contract */
	function getTotalAgreements() public view returns(uint) {
		return totalAgreements;
	}
}