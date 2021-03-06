// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/** @title IntelPropertyTokens.sol is an ERC20 token smart contract handling Intellectual Property. 
  * @author Chris Ball
  * @notice This contract is an ERC20 token that works in conjuction with the IntelPropertyNFT (ERC721) contract. 
  * This contract tracks the IPFS hash address of the intellectual property (for instance, an art or music file) 
  * and the rightsHolder information for each piece (represented by the nftID issued by the IntelPropertyNFT contract). 
  * Tokens are minted in batches of 1000 (see intelPropertyTokenLimit) and issued to the rightsHolders of the 
  * NFT/Intellectual Property file. Each batch belongs to one NFT and the rightsHolders who own the rights to it.
*/
contract IntelPropertyTokens is ERC20, Ownable {
	mapping (uint => IntelPropertyFile) intelPropertyFile; /** @dev nftIndex => intelPropertyFile (nftIndex => Mulithash is covered by this mapping)  */
	uint totalIntelPropertyFiles; /** @dev total of all IntelProperty files in the contract */
	uint intelPropertyTokenLimit = 1000; /** @dev should probably be 1000 (or 10000) x # of rightsHolderTypes. Using 1000 for this example. */
    address admin; /** @dev the idea of 'admin' will need to be expanded to become an admin for the IntelPropertyFile: whoever uploads ia the admin for that _nftID */
    
   	constructor() ERC20("IntellectualPropertyToken", "IPT") { 
		admin = msg.sender;
	}
    
	struct IntelPropertyFile {
		address admin;
		Multihash ipfsHash;
		bool active;
		bool finalized;
		RightsHolderSpec[] rightsHolderSpecs; 
	}	
	struct RightsHolderSpec {
		uint agreementID;
		address rightsHolderAddr; /* this functions as the original rightsHolder account, regardless of who owns the token */ 
		uint16 rightsHolderType; /* see IntelPropertyToken.test.js - for example: ARTIST=0, WRITER=1, PUBLISHER=2, MASTERRIGHTSHOLDER=3 */ 
		uint tokensHeld; /* this possibly won't reflect secondary market sales buy-backs - need to research */ 
	}	
	struct Multihash {
		bytes32 digest;
		uint8 hashFunction;
		uint8 size;
  	}
    
	event ipfsHashSetToNFT (uint indexed nftID, bytes32 digest, uint8 hashFunction, uint8 size);

	/** @notice method adds the IPFS hash address & rightsHolder info to the contract specific to the incoming _nftID (see IntelPropertyNFT.sol for more info) */
	function addIntelPropertyFile(uint _nftID, bytes32 _digest, uint8 _hashFunction, uint8 _size, address[] calldata _rightsHolders, uint16[] calldata _rightsHolderTypes, uint _agreementID) external onlyOwner {
		/** @dev requirement of onlyOwner is temp - in production, anyone who uploads will become an admin for that intelPropertyFile */		
		require(_rightsHolders.length == _rightsHolderTypes.length, 'length of rightsHolders must match the length of rightsHolderTypes submitted');
		
		/** @dev
		  * IMP: there is nothing to keep the same file from being tracked as an NFT multiple times. This could cause 
		  * issues, but may resolve itself in that everything is onchain and transparent in the case of a nefarious actor. 
		  * Further, plays/views of a file that exists as more than 1 NFT will simply be split between the NFTs in the case
		  * of an honest, mistaken re-upload. 
		*/

		/** @dev using the incoming _nftID is needed for the various contracts to coordinate */
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		sdFile.admin = admin;		
		
		(Multihash storage entry) = (sdFile.ipfsHash);
		entry.digest = _digest;
		entry.hashFunction = _hashFunction;
		entry.size = _size;
		emit ipfsHashSetToNFT(_nftID, _digest, _hashFunction, _size);		
		
		for (uint i = 0; i < _rightsHolders.length; i++) {
			/** @dev RightsHolderSpec(address, rightsHolderType, tokensHeld) */
			(RightsHolderSpec memory rhSpec) = (RightsHolderSpec(_agreementID, _rightsHolders[i], _rightsHolderTypes[i], 0));
			sdFile.rightsHolderSpecs.push(rhSpec);
		}
		totalIntelPropertyFiles++; 
		mintTokensForIntelPropertyFile(_nftID);
	}
	
	/** @notice handles minting of the tokens specific to the IntelProperty file's ID supplied. 
	  * 'intelPropertyTokenLimit' determines the # of tokens and this is divided by the # 
	  * of rightsHolders assigned to the IntelProperty file. Any remainder (beyond the evenly
	  * split # of tokens between rightsHolders) tokens will be assigned to the first 
	  * rightsHolder account in the list. Example: 1000 tokens / 3 = 334, 333, 333
	*/
	function mintTokensForIntelPropertyFile(uint _nftID) internal {		
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		/** @dev we need to account for decimals when dividing tokens between rightsHolders. 
		  * IMPORTANT: the first rightsHolder listed will receive the extra tokens after division */
		(uint modu) = (intelPropertyTokenLimit % sdFile.rightsHolderSpecs.length);
		(uint numTokens) = (intelPropertyTokenLimit / sdFile.rightsHolderSpecs.length);
		for (uint16 i = 0; i < sdFile.rightsHolderSpecs.length; i++) {
			uint amount = (i == 0 && modu > 0) ? numTokens + modu : numTokens;
			(RightsHolderSpec storage rhSpec) = (sdFile.rightsHolderSpecs[i]);
			rhSpec.tokensHeld = rhSpec.tokensHeld + amount;
			_mint(rhSpec.rightsHolderAddr, amount);
		}
	}
	
	/** @notice controls the transfer of rightsHolder's tokens specific to the IntelProperty file ID supplied  */
	function transferRightsHolderTokens(uint _nftID, address _rightsHolder, address _to, uint _amount) public returns (bool _retVal) {
		/** @dev since solidity 0.7.0, you can't create a mapping inside of a struct, therefore we need to iterate
		  * thru the rightsHolders, but there aren't many 
		*/
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		for (uint16 i = 0; i < sdFile.rightsHolderSpecs.length; i++) {
			(RightsHolderSpec storage rhSpec) = (sdFile.rightsHolderSpecs[i]);
			if (rhSpec.rightsHolderAddr == _rightsHolder) {
				require(msg.sender == _rightsHolder || msg.sender == admin, "msg.sender is not authorized.");
				require(rhSpec.tokensHeld >= _amount, "RightsHolder does not have enough tokens.");
				bool retVal = transferFrom(_rightsHolder, _to, _amount);
				require(retVal == true, 'unable to transfer');
				return retVal;
			}
		}		
	}

	/** @notice returns the IPFS multihash address for the IntelProperty file's content */
	function retrieveIntelPropertyFile(uint _nftID) public view returns(Multihash memory _intelPropFile) {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		return sdFile.ipfsHash;
	}
	
	/** @notice returns the rightsHolder information for the IntelProperty file requested */
	function retrieveRightsHolderInfo(uint _nftID) external view returns(RightsHolderSpec[] memory _rightsHolder) {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		return sdFile.rightsHolderSpecs;
	}

	/** @notice returns total number of IntelProperty files in the contract */
	function numberOfIntelPropertyFiles() public view returns(uint totalEntries) {
		return totalIntelPropertyFiles;
	}

	/** @notice sets the IntelProperty file's active flag, used for controling visibility of the contents */
	function setActiveFlag(uint _nftID, bool _active) external onlyOwner {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		sdFile.active = _active;
	}
	/** @notice retrieves the IntelProperty file's active flag, used for controlling visibility of the contents */
	function getActiveFlag(uint _nftID) external view returns(bool _active) {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		return sdFile.active;
	}

	/** @notice sets the IntelProperty file's status to Finalized, limiting what can be changed 
	  * @dev this may turn out to not be needed but is being left here for now
	*/
	function setFinalizedFlag(uint _nftID) external onlyOwner {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		sdFile.finalized = true;
	}
	/** @notice returns Finalized status for this IntelProperty file */
	function getFinalizedFlag(uint _nftID) external view returns(bool _finalized) {
		(IntelPropertyFile storage sdFile) = (intelPropertyFile[_nftID]);
		return sdFile.finalized;
	}
}
