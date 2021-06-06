// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/** @title IntelPropertyNFT.sol is an ERC721 token smart contract handling Intellectual Property. 
  * @author Chris Ball
  * @notice This contract is an ERC721 token derived from ERC721Enumerable.sol. It works in conjuction with 
  * the IntelPropertyTokens contract, which tracks rightsHolder information for each NFT. There is also an 
  * optional IntelPropertyAgreement contract which all rightsHolders (and the NFT's contract owner) can use 
  * to keep all parties on the same page. 
*/
contract IntelPropertyNFT is ERC721Enumerable, Ownable {
 
	struct NFTSpec {
		address admin;
		bytes32 name; // nftID => name (human readable alias for the nftID)
		bytes32 artist; // nftID => artist name
		bytes32 collection; // nftID => collection name
		uint[] playsByDate;  // nftID => timeStamp array of plays (or views)
		Multihash thumbnail; // ifps hash of NFT thumbnail picture	
	}
	struct Multihash {
		bytes32 digest;
		uint8 hashFunction;
		uint8 size;
	}
	
	mapping (uint => NFTSpec) nftSpecs; // nftID => NFTSpec
	
	/** @dev this event dumps information about the NFT to the event log. IMPORTANT: the NFTSpec object contains 
	  * a lot of information. This is why, instead of having a view function that returns the info from the contract 
	  * to an external calling proc - which could be very expensive, we dump it to the event log. That way any front 
	  * end script can read the off chain data and deal with it in any way needed. 
	*/
	event dumpNFTInfo(uint indexed nftID, NFTSpec nftSpec);
	/** @dev dumps play array information to the event log (each play + it's timeStamp) */
	event dumpPlayReport(uint indexed nftID, uint[] playDates);
	/** @dev event logs the setting of the thumbnail hash for the NFT */
	event ipfsHashSetToNFT (uint indexed nftID, string  hashType, bytes32 digest, uint8 hashFunction, uint8 size);

	constructor() ERC721Enumerable() ERC721("IntelPropertyNFT", "IPNFT") public {
	}    

	/** @notice function wraps the ERC721 mint function and sets basic human readable info for the NFT */
	function mint(bytes32 _name, bytes32 _artist, bytes32 _collection) external onlyOwner { 	  
	//function mint(string memory _name, string memory _artist, string memory _collection) external onlyOwner {
	  
	  uint nextNFT = totalSupply(); // totalSupply is 1 based, _mint is 0 based which works well for setting the next index
	  _mint(msg.sender, nextNFT);

	  (NFTSpec storage currNFT) = (nftSpecs[nextNFT]);
	  currNFT.admin = msg.sender;
	  currNFT.name = _name;
	  currNFT.artist = _artist;
	  currNFT.collection = _collection;
	}

	/** @notice adds an IPFS hash whose content is a thumbnail picture for the NFT */
	function addThumnail(uint _nftID, bytes32 _digest, uint8 _hashFunction, uint8 _size) external onlyOwner {
		(NFTSpec storage currNFT) = (nftSpecs[_nftID]);
		(Multihash storage entry) = (currNFT.thumbnail);
		entry.digest = _digest;
		entry.hashFunction = _hashFunction;
		entry.size = _size;
		emit ipfsHashSetToNFT(_nftID, 'thumbnail', _digest, _hashFunction, _size);
	}

	/** @notice method writes to the event log all data about the NFT's included in the incoming _nftIDs array arg */
	function dumpNFTSpecsToEventLog(uint[] calldata _nftIDs) external {
		/** @dev My idea is that we can dump this any time the data is entered for a newly added NFT. From there, 
		  * javascript can create searchable arrays: by artist, collection, or even eventually styles or other 
		  * keywords. 
		  * NOTE: there may be more efficient ways (gas) to handle this 'off chain' data, but writing info to the 
		  * event log is one idea I wanted to try.
	    */
		for (uint i = 0; i < _nftIDs.length; i++) {
			(NFTSpec storage currNFT) = (nftSpecs[i]);
			emit dumpNFTInfo(i, currNFT);
		}
	}
	
	/** @notice method adds to the play count array (could be renamed 'addView' for visual art) */
	function addPlay(uint _nftID) external {
		(NFTSpec storage currNFT) = (nftSpecs[_nftID]);
		currNFT.playsByDate.push(block.timestamp);
	}
	
	/** @notice writes the play history of each NFT in the _nftIDs array to the event log */
	function reportPlays(uint[] calldata _nftIDs) external {
		for (uint i = 0; i < _nftIDs.length; i++) {
			(NFTSpec storage currNFT) = (nftSpecs[i]);
			emit dumpPlayReport(i, currNFT.playsByDate);
		}
	}
}