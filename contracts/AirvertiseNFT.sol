// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Airvertise NFT implementation
/// @notice NFT collection implementation meant to be deployed per each
/// ad campaign. Receives calls only from the main contract
contract AirvertiseNFT is ReentrancyGuard, ERC721URIStorage {
	uint256 public tokenIdCounter;
	// Value in wei to be sent to each address
	uint256 public airdropValue;
	string public advertisementUri;
	string public campaignName;

	// Map of airdrop owners and its tokenId
	mapping(address => uint256) public addressToTokenId;

	// Address of AirvertiseFactory contract
	address public airvertiseFactoryAddress;

	constructor(
		string memory __campaignTitle,
		string memory __symbol,
		string memory _campaignName,
		uint256 _value,
		string memory _advertisementUri,
		address _airvertiseFactoryAddress
	) ERC721(__campaignTitle, __symbol) {
		campaignName = _campaignName;
		airdropValue = _value;
		advertisementUri = _advertisementUri;
		airvertiseFactoryAddress = _airvertiseFactoryAddress;
	}

	/// @notice Mints an NFT, representing the airdrop, per address passed in the _to array
	/// @dev This function can only be called from the main Airvertise contract
	/// @param _to, list of addresses to airdrop
	function bulkAirdropERC721(address[] calldata _to) external payable nonReentrant onlyFactoryContract {
		// Checks there's a list of addreses
		require(_to.length != 0, "No addresses received");
		// This check is now redundant, it's in Airvertise.sol. Leaving it here as double check
		require(msg.value >= (airdropValue * _to.length), "Not enough funds");

		for (uint256 i = 0; i < _to.length; i++) {
			_safeMint(_to[i], tokenIdCounter + i);
			// Although we don't need to have a tokenUri for each tokenId
			// we set it anyways for visualization in other NFT viewer/marketplace
			_setTokenURI(tokenIdCounter + i, advertisementUri);
			addressToTokenId[_to[i]] = tokenIdCounter + i;
		}

		tokenIdCounter = tokenIdCounter + _to.length;
	}

	/// @notice Burns the NFT airdrop and sends the funds to the users
	/// @dev This function can only be called from the main Airvertise contract
	/// @param _tokenId, token representing the airdrop ownership
	/// @param _claimer, airdrop owner
	function claimAirdrop(uint256 _tokenId, address _claimer) external nonReentrant onlyFactoryContract {
		require(_claimer == ownerOf(_tokenId), "Not token owner");

		_burn(_tokenId);
		(bool sent, ) = payable(_claimer).call{ value: airdropValue }("");
		require(sent, "Failed to send value");
	}

	/// @notice Returns tokenId owned by given address
	/// @param _address, user address
	// @return tokenId, airdrop owner
	function getTokenIdByAddress(address _address) public view returns (uint256 tokenId) {
		tokenId = addressToTokenId[_address];
	}

	/// @notice Function to prevent the token from being transferred between users
	/// @dev Hook that is called before any (single) token transfer. This includes minting and burning.
	/// @param _from, sender address. It's address(0) when minting
	/// @param _to, receiver address. It's address(0) when burning
	/// @param _tokenId, token to be transferred/minted/burned
	function _beforeTokenTransfer(
		address _from,
		address _to,
		uint256 _tokenId
	) internal virtual override {
		require(_from == address(0) || _to == address(0), "Cannot transfer airdrop");
		super._beforeTokenTransfer(_from, _to, _tokenId);
	}

	modifier onlyFactoryContract() {
		require(msg.sender == airvertiseFactoryAddress, "Caller is not AirvertiseFactory");
		_;
	}
}
