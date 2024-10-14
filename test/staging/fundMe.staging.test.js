const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const helpers = require("@nomicfoundation/hardhat-network-helpers"); //模拟当前测试网时间流逝
const { devlopmentChains } = require("../../helper-hardhat-config");

devlopmentChains.includes(network.name)
	? describe.skip
	: describe("test fundme contract", async function () {
			// beforeEach 在每个it被执行前先执行
			let fundMe;
			let firstAccount;
			beforeEach(async function () {
				// 部署所有tags为all的合约
				await deployments.fixture(["all"]);
				firstAccount = (await getNamedAccounts()).firstAccount;
				const fundMeDeployment = await deployments.get("FundMe"); //deployments可以跟踪所有已部署的合约
				fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
			});

			// test fund and getFund successfully
			it("fund and getFund successfully", async function () {
				//make sure target reched
				await fundMe.fund({ value: ethers.parseEther("0.5") }); //3000 * 0.5 = 1500
				// make sure window closed 保证经过足够长的时间，窗口关闭了
				// 现在集成测试是部署到测试网上，真实环境就不能用到helpers.time.increase()了，而是改用promise等待一段时间，来等待时间流逝
				// 在js环境中181是毫秒，所以需要 *1000	换算成秒;
				await new Promise((resolve) => setTimeout(resolve, 181 * 1000));
				// make sure we can get receipt ---like: waitForDeployment()
				// just promised the transaction sent to the blockchain successfully
				const getFundTx = await fundMe.getFund();
				const getFunReceipt = await getFundTx.wait();
				// 上面已经获得了getFunReceipt，所以不需要加await
				expect(getFunReceipt)
					.to.be.emit(fundMe, "FundWithdrawByOwner")
					.withArgs(ethers.parseEther("0.5"));
				/*
        // 单元测试里面的写法，
        // fundMe.getFund() 如果加上await关键字，他能保证的并不是说这个交易成功的写到链上了，而是保证这个交易发送成功了，到底上没上链是保证不了的
        // 在单元测试里面是可以这么写的，他没什么延迟，你交易发起了就默认已经上链了；但是在集成测试里面用的是真实的测试网络，交易发送了并不意味着链上已经写入了，所以需要等待一段时间，否则可能返回的是一个空的回执
        await expect(fundMe.getFund())
        .to.emit(fundMe, "FundWithdrawByOwner")
        .withArgs(ethers.parseEther("0.5"));
        */
			});

			// test fund and refund successfully
			it("fund and refund successfully", async function () {
				//make sure target not reched
				await fundMe.fund({ value: ethers.parseEther("0.1") }); // 0.1 * 3000 = 300
				// 等待窗口结束
				await new Promise((resolve) => setTimeout(resolve, 181 * 1000));
				const refundTx = await fundMe.reFund();
				const refunReceipt = await refundTx.wait();
				expect(refunReceipt)
					.to.be.emit(fundMe, "RefundByFunder")
					.withArgs(firstAccount, ethers.parseEther("0.1"));
			});
	  });
