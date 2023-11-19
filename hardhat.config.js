require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-deploy")
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://eth-rinkeby.alchemyapi.io/v2/your-api-key"
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || ""
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || ""

module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 80001, //same chainId as mumbai, will probally need it to match to test offchain signer
		},
		mumbai: {
			url: MUMBAI_RPC_URL,
			accounts: [PRIVATE_KEY],
			blockConfirmations: 6,
		},
	},
	solidity: {
		compilers: [
			{
				version: "0.8.8",
				settings: {
					optimizer: {
						enabled: true,
						runs: 1000,
					},
				},
			},
		],
	},
	etherscan: {
		apiKey: POLYGONSCAN_API_KEY,
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		outputFile: "gas-report.txt",
		noColors: true,
		// coinmarketcap: COINMARKETCAP_API_KEY,
	},
	namedAccounts: {
		deployer: {
			default: 0, // here this will by default take the first account as deployer
			1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
		},
	},
	mocha: {
		timeout: 200000, // 200 seconds max for running tests
	},
}
