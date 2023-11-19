const { assert, expect } = require("chai")
const { network, deployments, ethers, waffle } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Airvertise unit tests", function () {
			let Airvertise, AirvertiseNFT, airvertiseNFT, deployer, player2, player
			describe("sets correctly", function () {
				beforeEach(async () => {
					// Setup
					accounts = await ethers.getSigners()
					player = accounts[1]
					player2 = accounts[2]
					deployer = accounts[0]
					await deployments.fixture(["all"])
					Airvertise = await ethers.getContract("Airvertise", deployer)
					const Airvertise_address = Airvertise.address

					// Variables to create campaign
					const title = "Campaign 2"
					const campaignName = "Title 2"
					const campaignIndividualAirdrop = 5
					const adUri = "campaign2uri.com"
					const usersAddresses = [player.address, player2.address]
					const value = 10

					// Create campaign
					const transactionResponse = await Airvertise.createCampaign(
						title,
						campaignName,
						campaignIndividualAirdrop,
						adUri,
						usersAddresses,
						{ value: value }
					)

					// Get address through event
					const transactionReceipt = await transactionResponse.wait()
					newAdcampaignAddress = transactionReceipt.events[0].args.campaignAddress

					// Attach contract to interact
					AirvertiseNFT = await hre.ethers.getContractFactory("AirvertiseNFT")
					airvertiseNFT = await AirvertiseNFT.attach(newAdcampaignAddress)
				})
				it("sets Airvertise correctly", async () => {
					// Airvertise variables and mappings
					const advertisement1 = await Airvertise.advertisements(1)
					assert.equal(advertisement1, airvertiseNFT.address)
					await expect(Airvertise.advertisements(2)).to.be.reverted
					const campaigns = await Airvertise.getOwnerCampaignAddresses(deployer.address)
					assert.equal(campaigns[1], airvertiseNFT.address)
					const advertisement_exist = await Airvertise.advertisementExists(airvertiseNFT.address)
					assert.equal(advertisement_exist, true)

					// Variables associated with airdrop
					const playerinfo = await Airvertise.getUserCampaignAddresses(player.address)
					assert.equal(playerinfo[0][0], airvertiseNFT.address)
					assert.equal(playerinfo[0][1], true)
					const player2info = await Airvertise.getUserCampaignAddresses(player2.address)
					assert.equal(playerinfo[0][0], airvertiseNFT.address)
					assert.equal(playerinfo[0][1], true)
					// read signer from storage of the contract
					const signer1 = await deployer.provider.getStorageAt(Airvertise.address, 5) // the variable desired is in the first slot
					const signer = "0x" + signer1.slice(-40)
					assert.equal(signer, process.env.OFFCHAIN_SIGNER_ADDRESS.toLowerCase())
				})
				it("sets signer correctly", async () => {
					const new_signer = await Airvertise.setSigner(deployer.address)
					const signer1 = await deployer.provider.getStorageAt(Airvertise.address, 5) // the variable desired is in the first slot
					const signer = "0x" + signer1.slice(-40)
					assert.equal(signer, deployer.address.toLowerCase())
				})
				it("sets AirvertiseNFT correctly", async () => {
					const factory_address = await airvertiseNFT.airvertiseFactoryAddress()
					assert.equal(factory_address, Airvertise.address)
					const campaign_title = await airvertiseNFT.campaignName()
					assert.equal(campaign_title, "Title 2")
					const advertisementUri = await airvertiseNFT.advertisementUri()
					assert.equal(advertisementUri, "campaign2uri.com")
					const airdropValue = await airvertiseNFT.airdropValue()
					assert.equal(airdropValue, 5)
					const tokenIdCounter = await airvertiseNFT.tokenIdCounter()
					assert.equal(tokenIdCounter.toString(), "2") // the next token_id should be two
				})
				it("airdrops correctly", async () => {
					const owner1 = await airvertiseNFT.ownerOf(0)
					assert.equal(owner1, player.address)
					const owner2 = await airvertiseNFT.ownerOf(1)
					assert.equal(owner2, player2.address)
					const tokenid1 = await airvertiseNFT.addressToTokenId(player.address)
					assert.equal(tokenid1, 0)
					const tokenid2 = await airvertiseNFT.getTokenIdByAddress(player2.address)
					assert.equal(tokenid2, 1)
				})
				it("reverts if campaign already exists", async () => {
					// Define the same variables
					const title = "Campaign 2"
					const campaignName = "Title 2"
					const campaignIndividualAirdrop = 5
					const adUri = "campaign2uri.com"
					const usersAddresses = [player.address, player2.address]
					const value = 10

					await expect(
						Airvertise.createCampaign(
							title,
							campaignName,
							campaignIndividualAirdrop,
							adUri,
							usersAddresses,
							{ value: value }
						)
					).to.be.reverted
				})
				it("claims airdrop correctly", async () => {
					airvertise = Airvertise.connect(player)
					// It is the 0th campaign and player has the token_id 0
					await airvertise.claimAirdrop(0, 0)
					const playerinfo = await Airvertise.getUserCampaignAddresses(player.address)
					assert.equal(playerinfo[0][0], airvertiseNFT.address)
					assert.equal(playerinfo[0][1], false)
					// Verify that user can no longer call the claimairdrop function
					await expect(airvertise.claimAirdrop(0, 0)).to.be.reverted
					// It is the 0th campaign and player2 has the token_id 1
					airvertise = Airvertise.connect(player2)
					await airvertise.claimAirdrop(0, 1)
					const playerinfo2 = await Airvertise.getUserCampaignAddresses(player2.address)
					assert.equal(playerinfo2[0][0], airvertiseNFT.address)
					assert.equal(playerinfo2[0][1], false)
				})
				// math and balances (pending)
			})
	  })
