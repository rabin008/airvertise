const hre = require("hardhat")

async function main() {
	try {
		Airvertise = await hre.ethers.getContractFactory("Airvertise")
		const airvertise = await Airvertise.deploy(
			process.env.OFFCHAIN_SIGNER_ADDRESS,
			process.env.AIRVERTISE_WALLET_ADDRESS
		)
		await airvertise.deployed()

		const title = process.env.CAMPAIGN_TITLE
		const campaignName = process.env.CAMPAIGN_NAME
		const campaignIndividualAirdrop = process.env.CAMPAIGN_INDIVIDUAL_AIRDROP
		const adUri = process.env.AD_URI
		const usersAddresses = JSON.parse(process.env.USERS_ADDRESSES)
		const value = hre.ethers.utils.parseUnits(process.env.CAMPAIGN_TOTAL_AIRDROP, "wei")

		const createCampaign = await airvertise.createCampaign(
			title,
			campaignName,
			campaignIndividualAirdrop,
			adUri,
			usersAddresses,
			{
				value: value,
			}
		)
		const rc = await createCampaign.wait()
		const event = rc.events.find((event) => event.event === "CampaignCreated")
		;[campaignAddress] = event.args

		AirvertiseNFT = await hre.ethers.getContractFactory("AirvertiseNFT")
		const airvertiseNFT = await AirvertiseNFT.attach(campaignAddress)

		const campaignNameCreated = await airvertiseNFT.campaignName()
		console.log("New campaign name: ", campaignNameCreated)
	} catch (error) {
		console.log(error)
	}
}
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
