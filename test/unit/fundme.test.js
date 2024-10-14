const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers"); //模拟当前测试网时间流逝
const { devlopmentChains } = require("../../helper-hardhat-config");

// 三元运算符： condition ? true : false
!devlopmentChains.includes(network.name)
	? describe.skip
	: describe("test fundme contract", function () {
			// beforeEach 在每个it被执行前先执行
			let fundMe;
			let fundMeSecondAccount;
			let firstAccount;
			let secondAccount;
			let mockV3Aggregator;
			beforeEach(async function () {
				// 部署所有tags为all的合约
				await deployments.fixture(["all"]);
				firstAccount = (await getNamedAccounts()).firstAccount;
				secondAccount = (await getNamedAccounts()).secondAccount;
				const fundMeDeployment = await deployments.get("FundMe"); //deployments可以跟踪所有已部署的合约
				mockV3Aggregator = await deployments.get("MockV3Aggregator");
				fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
				fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount);
			});

			// 测试构造函数，测试owner 是否为 msg.sender
			it("test if the owner is msg.sender", async function () {
				// 获取合约交易发送人
				// const [firstAccount] = await ethers.getSigners();
				// 先初始化合约工厂
				// const fundMeFactory = await ethers.getContractFactory("FundMe");
				// 部署合约
				// const fundMe = await fundMeFactory.deploy(180);
				// 等待合约部署成功，上一行代码只能代表部署操作已经完成（合约部署这个交易发送成功），并不能保证部署已经完成（并不能保证合约已经部署成功）
				await fundMe.waitForDeployment();
				// 测试owner是不是合约的发送人的地址
				// assert.equal(await fundMe.owner(), firstAccount.address); //使用的是getSigners()
				assert.equal(await fundMe.owner(), firstAccount); //使用的是getNamedAccounts()，在beforeEach中已经获取了firstAccount
			});

			//测试构造函数里面的dataFeed 是否赋值成功
			it("test if the dataFeedd is assigned correctly", async function () {
				// const fundMeFactory = await ethers.getContractFactory("FundMe");
				// const fundMe = await fundMeFactory.deploy(180);
				await fundMe.waitForDeployment();
				// 以下地址是用于部署在sepolia测试网上的，在本地环境测试并不需要
				assert.equal(
					await fundMe.dataFeed(),
					/*"0x694AA1769357215DE4FAC081bf1f309aDC325306"*/
					mockV3Aggregator.address
				);
			});

			// fund、getFund、refund 测试这三个函数

			// unit test for fund
			// condition:window open、msg.value greater than minimum value、 funder balance
			it("window close,value greater than minimum value,fund failed", async function () {
				// 时间窗口关闭，以下两句是模拟时间流逝200秒,超过窗口的开放时间,make sure the window is closed
				await helpers.time.increase(200);
				await helpers.mine();

				// value is greater than minimum value (>100)//wei
				// 第一给条件不满足，第二个条件满足
				// reverteddWith("此处对的条件必须与require的条件一样")
				expect(
					fundMe.fund({ value: ethers.parseEther("0.1") })
				).to.be.revertedWith("window is closed");
			});

			it("window open, value less than minimum value, fund failed", async function () {
				// 第一个条件满足，第二个条件不满足
				expect(
					fundMe.fund({ value: ethers.parseEther("0.01") })
				).to.be.revertedWith("Send more ETH");
			});

			it("window open, value greater than minimum value, fund success", async function () {
				// greater than minimum value
				await fundMe.fund({ value: ethers.parseEther("0.1") });
				const balance = await fundMe.fundersToAmount(firstAccount);
				expect(balance).to.equal(ethers.parseEther("0.1"));
			});

			// uint test for getFund
			// onlyOwner、window closed、target reached
			it("not owner,window closed,target reached,getFund failed", async function () {
				// make sure the target is reached---1000usd
				await fundMe.fund({ value: ethers.parseEther("1") });

				// 模拟时间流逝200秒，超过窗口的开放时间
				await helpers.time.increase(200);
				await helpers.mine();

				await expect(fundMeSecondAccount.getFund()).to.be.revertedWith(
					"this function can only be called by owner"
				);
			});

			//
			it("window open, target reacherd, getFund failed", async function () {
				// make sure the target is reached
				await fundMe.fund({ value: ethers.parseEther("1") });
				await expect(fundMe.getFund()).to.be.revertedWith(
					"window is not closed"
				);
			});

			//
			it("window close, target not reached, getFund failed", async function () {
				//target is not reached
				await fundMe.fund({ value: ethers.parseEther("0.1") });
				//make sure window is closed
				await helpers.time.increase(200);
				await helpers.mine();
				await expect(fundMe.getFund()).to.be.revertedWith(
					"Target is not reached"
				);
			});

			// successful getFund test --有时候测试通过，有时候报错？？？
			it("window close, target reached, getFund success", async function () {
				// make sure the target is reached
				await fundMe.fund({ value: ethers.parseEther("1") });
				// make sure window is closed
				await helpers.time.increase(200);
				await helpers.mine();
				// getFund--在合约里面增加一个event事件记录，在测试里面可以通过withArgs来判断是否getFund成功
				await expect(fundMe.getFund())
					.to.emit(fundMe, "FundWithdrawByOwner")
					.withArgs(ethers.parseEther("1"));
			});

			// unit test for refund
			//window closed 、target not reached 、 funder has balance
			it("window open, target not reached, funder has balance", async function () {
				await fundMe.fund({ value: ethers.parseEther("0.1") });
				await expect(fundMe.refund()).to.be.revertedWith(
					"window is not closed"
				);
			});

			// window closed 、target reached 、 funder has balance
			it("window closed, target reached, funder has balance", async function () {
				// make sure the target is reached
				await fundMe.fund({ value: ethers.parseEther("1") });
				// make sure window is closed
				await helpers.time.increase(200);
				await helpers.mine();
				await expect(fundMe.refund()).to.be.revertedWith("Target is reached");
			});

			// window closed 、target not reached 、 funder does not has balance
			it("window closed, target not reached, funder does not has balance", async function () {
				// make sure the target is reached
				await fundMe.fund({ value: ethers.parseEther("0.1") });
				// make sure window is closed
				await helpers.time.increase(200);
				await helpers.mine();
				await expect(fundMeSecondAccount.refund()).to.be.revertedWith(
					"there is no fund for you"
				);
			});

			//all conition are satisfied
			it("window closed, target reached, funder has balance", async function () {
				// make sure the target is reached
				await fundMe.fund({ value: ethers.parseEther("0.1") });
				// make sure window is closed
				await helpers.time.increase(200);
				await helpers.mine();
				await expect(fundMe.refund())
					.to.emit(fundMe, "RefundByFunder")
					.withArgs(firstAccount, ethers.parseEther("0.1"));
			});
	  });
