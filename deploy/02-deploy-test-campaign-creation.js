const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()

	arguments = [process.env.OFFCHAIN_SIGNER_ADDRESS]

	const MyContract = await ethers.getContractFactory("Airvertise")
	const contract = await MyContract.attach(
		airvertiseAddress // The deployed contract address
	)

	const title = process.env.CAMPAIGN_TITLE
	const campaignName = process.env.CAMPAIGN_NAME
	const campaignIndividualAirdrop = process.env.CAMPAIGN_INDIVIDUAL_AIRDROP
	const adUri = process.env.AD_URI
	const usersAddresses = JSON.parse(process.env.USERS_ADDRESSES)
	const value = ethers.utils.parseUnits(process.env.CAMPAIGN_TOTAL_AIRDROP, "wei")

	const transactionResponse = await contract.createCampaign(
		title,
		campaignName,
		campaignIndividualAirdrop,
		adUri,
		usersAddresses,
		{
			value: value,
		}
	)

	const transactionReceipt = await transactionResponse.wait()
	newAdcampaignAddress = transactionReceipt.events[0].args.campaignAddress

	console.log("The AirvertiseNFT contract deployed from Airvertise is at: ", newAdcampaignAddress)

	// Get the campaign address

	AirvertiseNFT = await hre.ethers.getContractFactory("AirvertiseNFT")
	const airvertiseNFT = await AirvertiseNFT.attach(newAdcampaignAddress)

	const campaignNameCreated = await airvertiseNFT.campaignName()
	console.log("New campaign name: ", campaignNameCreated)
}
module.exports.tags = ["all", "deploy_contracts"]
