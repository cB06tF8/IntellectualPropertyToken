# Intellectual Property Token
 This project consists of 3 contracts which work together. They track the specifics about pieces of intellectual property, their location in IPFS and information about each piece's rights holders.
 
### IntelPropertyNFT.sol
 An ERC721Enumerable contract which issues NFTs and tracks basic on chain data about a piece of intellectual property.
### IntelPropertyTokens.sol
 - An ERC20 contract that allows for the tracking of information for multiple rights holders for each NFT. 
 - Each set of an [NFT + it's rights holders] is connected to a specific file that has been uploaded to IPFS. For instance, a music file or an art file. Each NFT that is issued has a set number of ERC20 tokens which are minted and belong to each rightsHolder. In other words, the ERC20 tokens minted are specifically tied to a single NFT and it's rightsHolder. If a rightsHolder holds rights to multiple NFTs (pieces of intellectual property), the rightsHolder would have multiple sets of the ERC20 tokens. As an example: we have a rightsHolder who is a songwriter of 3 songs (uploaded to IPFS) and NFTs have been issued for them. If the amount of tokens a rights holder is issued is 1000 per NFT, the rightsHolder would have a total of 3000 tokens. But, though they _are_ fungable, the rightsHolder would not be able to transfer all 3000 to another account at once. He/she would choose an NFT (nftID) that the tokens are connected to, and could only transfer the balance of what they have specific to the NFT chosen. Therefore the person could only transfer 1000 tokens at one time, before repeating the process for another song.

 
#### Rights Holders
 - rights holder's address
 - number of tokens
### IntelPropertyAgreement.sol
 A contract tracking an IPFS hash address that can be used for an agreement file (docx, pdf, etc) that all parties have signed.
 
 These three contracts work together. Each NFT index (nftID) issued by the IntelPropertyNFT contract is used as the key in a mapping inside the IntelPropertyTokens contract:
  - mapping (uint => IntelPropertyFile) intelPropertyFile;
 The IntelPropertyFile struct holds the IPFS hash address to the intellectual property file and information about the rights holders the intellectual property belongs to. The IntelPropertyFile structure also holds an index pointing to the agreement (if supplied) used for the intellectual property. The agreement index points to a specific agreement whose IPFS hash address is tracked by the IntelPropertyAgreement contract.
 
##Test Scripts
 There are 4 test scripts included, one for testing and demonstrating working with each contract separately and one that demonstrates the connecting of the three contracts together: creating an Intellectual Property NFT, track it's intellectual file, it's rightsHolders information and an agreement for the NFT + rightsHolders.
 
 
## Known Issues
 - Please notes that this project is a learning project for me - I am still inexperienced at writing smart contracts.  
 - This project should not be considered production ready. It should be audited before being deployed outside of a testnet.
 - Some of the information I'm tracking on chain may be better handled off chain. I've attempted to create some efficienies in gas and resource usage by writing to the event logs when I could and also by storing IPFS hash information as efficient as I know how.
 
