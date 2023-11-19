// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./AirvertiseNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct AdCampaign {
	address campaignAddress;
	bool pendingCollection;
}

/// @title Main Airvertise contract. It provides interfaces with frontend
/// @notice Allows users to create campaigns and claim airdrops
contract Airvertise is Ownable {
	mapping(address => bool) public advertisementExists;
	address[] public advertisements;

	mapping(address => AdCampaign[]) public userToCampaignAddresses;

	mapping(address => address[]) public campaignOwnerToCampaignAddresses;

	/// @dev offchain signer address
	address private signer;

	/// @dev divisor to computevalue to be collected by the platform per campaign
	uint256 public platformFeesPercentDivisor;

	/// @dev default percent divisor to compute fees
	uint256 public constant DEFAULT_PERCENT_DIVISOR = 20; // 5% default

	/// @dev address where platform earnings will be sent to
	address public earningsWalletAddress;

	event CampaignCreated(address campaignAddress, uint256 campaignsCount);
	event AirdropClaimed(address user, address campaignAddress, uint256 tokenId);
	event OffchainSignerAddressUpdated(address signer);
	event PlatformFeesPercentDivisorUpdated(uint256 percentDivisor);
	event AirvertiseWalletAddressUpdated(address earningsWalletAddress);

	/// @notice Instantiate the contract
	/// @dev Initialize vital values
	/// @param _signer offchain signer address
	/// @param _walletAddress address where platform earnings will be sent to
	constructor(address _signer, address _walletAddress) {
		signer = _signer;
		earningsWalletAddress = _walletAddress;
		platformFeesPercentDivisor = DEFAULT_PERCENT_DIVISOR;
	}

	/// @notice Allows admins to configure the offchain signer address
	/// @param _signer offchain signer address
	function setSigner(address _signer) external onlyOwner {
		signer = _signer;
		emit OffchainSignerAddressUpdated(signer);
	}

	/// @notice Allows admins to configure the percentage of fees to collect
	/// @param _fees percentage of the value to collect
	function setFees(uint256 _fees) external onlyOwner {
		platformFeesPercentDivisor = _fees;
		emit PlatformFeesPercentDivisorUpdated(platformFeesPercentDivisor);
	}

	/// @notice Allows admins to set the address where platform earnings will be sent to
	/// @param _address address where platform earnings will be sent to
	function setAdvertiseWalletAddress(address _address) external onlyOwner {
		earningsWalletAddress = _address;
		emit AirvertiseWalletAddressUpdated(earningsWalletAddress);
	}

	/// @notice Allows user to create ad campaign (by deploying NFT contract) and calls bulkAirdropERC721
	/// @param _campaignTitle, title meant to be displayed to final users
	/// @param _campaignName, internal campaign identifier meant to be used by customer
	/// @param _value, value in wei for each individual airdrop
	/// @param _advertisementUri, IPFS URI of the advertisement image
	/// @param _to, list of addesses to airdrop
	// @return newAdcampaignAddress, address of newly deployed NFT contract (a.k.a. campaignAddress)
	function createCampaign(
		string memory _campaignTitle,
		string memory _campaignName,
		uint256 _value,
		string memory _advertisementUri,
		address[] calldata _to
	) external payable returns (address newAdcampaignAddress) {
		require(bytes(_campaignTitle).length > 0, "Provide campaign title");
		require(bytes(_campaignName).length > 0, "Provide campaign name");
		require(bytes(_advertisementUri).length > 0, "Provide campaign flyer URI");

		uint256 campaignFunds = _value * _to.length;
		uint256 platformFees = campaignFunds / platformFeesPercentDivisor;
		require(msg.value >= campaignFunds + platformFees, "Not enough value");

		bytes32 salt = keccak256(
			abi.encodePacked(_campaignTitle, "AIRAD", _campaignName, _value, _advertisementUri, address(this))
		);

		address campaignAddress = predictAddress(uint256(salt));
		require(advertisementExists[campaignAddress] == false, "Campaign already exists");

		AirvertiseNFT newAdCampaign = new AirvertiseNFT{ salt: salt }(
			_campaignTitle,
			"AIRAD",
			_campaignName,
			_value,
			_advertisementUri,
			address(this)
		); // Use create2

		newAdcampaignAddress = address(newAdCampaign);

		advertisementExists[newAdcampaignAddress] = true;
		advertisements.push(newAdcampaignAddress);
		emit CampaignCreated(newAdcampaignAddress, advertisements.length);

		// Keep track of the available airdrops for each user
		AdCampaign memory newAdCampaignRecord = AdCampaign(newAdcampaignAddress, true);
		for (uint256 i = 0; i < _to.length; i++) {
			userToCampaignAddresses[_to[i]].push(newAdCampaignRecord);
		}

		// Keep track of the campaigns created by owner
		campaignOwnerToCampaignAddresses[msg.sender].push(newAdcampaignAddress);

		newAdCampaign.bulkAirdropERC721{ value: msg.value - platformFees }(_to);
	}

	/// @notice Predicts AirvertiseNFT contract address before it is deployed. Used internally for validation
	/// @param _salt, hash of ABI encoded salt values
	function predictAddress(uint256 _salt) public view returns (address) {
		bytes memory bytecode = abi.encodePacked(type(AirvertiseNFT).creationCode, abi.encode(address(this)));
		bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode)));
		return address(uint160(uint256(hash)));
	}

	/// @notice Allows users to collect an airdrop for a given campaign
	/// @param _campaignAddressIndex, index pointing to the campaign contract address (NFT collection)
	/// @param _tokenId, airdrop id to claim from campaign (NFT collection)
	function claimAirdrop(uint256 _campaignAddressIndex, uint256 _tokenId) external {
		// This require is not necessary because the call would revert when platform
		// detects the user is not ownerOf(). Leaving it anyways as double check
		require(
			userToCampaignAddresses[msg.sender][_campaignAddressIndex].pendingCollection,
			"Airdrop already collected"
		);

		userToCampaignAddresses[msg.sender][_campaignAddressIndex].pendingCollection = false;
		address campaignAddress = userToCampaignAddresses[msg.sender][_campaignAddressIndex].campaignAddress;

		AirvertiseNFT(campaignAddress).claimAirdrop(_tokenId, msg.sender);
		emit AirdropClaimed(msg.sender, campaignAddress, _tokenId);
	}

	/// @notice Returns pending and collected airdrops for a user
	/// @param _address, user address
	// @return campaigns, list of AdCampaign objects
	function getUserCampaignAddresses(address _address) external view returns (AdCampaign[] memory campaigns) {
		campaigns = userToCampaignAddresses[_address];
	}

	/// @notice Returns list of campaign addresses created by user
	/// @param _address, user address
	// @return campaigns, list of campaign addresses
	function getOwnerCampaignAddresses(address _address) external view returns (address[] memory campaigns) {
		campaigns = campaignOwnerToCampaignAddresses[_address];
	}

	/// @notice Sends the contract balance to the airvertise wallet
	/// @dev notice that anyone can call it since funds are sent to a preset address
	function withdrawEarnings() external {
		(bool success, ) = earningsWalletAddress.call{ value: address(this).balance }("");
		require(success, "Earnings withdraw failed");
	}
}
