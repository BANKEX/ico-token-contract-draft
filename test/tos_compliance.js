const BankExToken = artifacts.require("BankExToken.sol");
const BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExCrowdsale', function([bkxTokenOwner, bkxInvestor]) {

  it("should not allow direct payments", async function() {
    const initialBalance = web3.eth.getBalance(bkxInvestor);
    const  purchaseValue = web3.toWei(1, "ether");
    const bkxCrowdsale = await BankExCrowdsale.deployed();
    await bkxCrowdsale.sendTransaction({from: bkxInvestor, value: purchaseValue});
    const bkxTokenAddress = await bkxCrowdsale.token();
    const bkxToken = BankExToken.at(bkxTokenAddress);
    const balance = await bkxToken.balanceOf(bkxInvestor);
    assert.equal(balance.toNumber(), 0);
  });
});
