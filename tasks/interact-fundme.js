//合约交互
const { task } = require("hardhat/config");

//使用该task时需要传入合约的地址,因为合约还没有被初始化
//使用方法：npx harhat interact-fundme --addr 0x.... --network sepolia
task("interact-fundme", "interact with fundme contract")
  .addParam("addr", "fundme contract address") //("参数名","描述")
  .setAction(async (taskArgs, hre) => {
    //
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    const fundMe = fundMeFactory.attach(taskArgs.addr);

    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners();

    // fundd contract with first account
    //fundMe.fund 只能保证调用合约里面这个fund函数的这个交易发送成功了，但不能保证这个交易已经写入区块链了，同上面的deploy()
    const fundTx = await fundMe.fund({ value: ethers.parseEther("0.1") });
    await fundTx.wait();

    // check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target);
    console.log(`Balance of the contract is ${balanceOfContract}`);

    // fund contract with second account
    // .connect(secondAccount),如果不指定账号，系统会默认使用第一个账号firstAccount
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({
      value: ethers.parseEther("0.1"),
    });
    await fundTxWithSecondAccount.wait();

    // check balance of contract
    const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(
      fundMe.target
    );
    console.log(
      `Balance of the contract is ${balanceOfContractAfterSecondFund}`
    );

    // check mapping fundersToAmount
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(
      firstAccount.address
    );
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(
      secondAccount.address
    );
    console.log(
      `Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`
    );
    console.log(
      `Balance of second account ${seccondAccount.address} is ${secondAccountBalanceInFundMe}`
    );
  });

module.exports = {};
