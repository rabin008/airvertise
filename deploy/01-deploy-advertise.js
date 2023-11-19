const { network } = require("hardhat")
const { DECIMALS, INITIAL_PRICE, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const chainId = network.config.chainId

	arguments = [process.env.OFFCHAIN_SIGNER_ADDRESS]

	const Airvertise = await deploy("Airvertise", {
		from: deployer,
		log: true,
		args: arguments,
	})

	airvertiseAddress = Airvertise.address
	console.log("Airvertise contract deployed at: ", airvertiseAddress)

	// Commented this out because we don't currently need to verify the contract
	// if (!developmentChains.includes(network.name) && process.env.POLYGONSCAN_API_KEY) {
	// 	await verify(Airvertise.address, ["0xABB70f7F39035586Da57B3c8136035f87AC0d2Aa"])
	// 	await verify(AirvertiseNFT.address, [Airvertise.address])
	// }
}
module.exports.tags = ["all", "deploy_contracts"]
