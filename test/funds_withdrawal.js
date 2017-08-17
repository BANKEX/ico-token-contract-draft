const BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExCrowdsale', function([bkxTokenOwner, bkxInvestor, _]) {

  it("should forward funds to BankEx", async function() {
    const initialBalance = web3.eth.getBalance(bkxTokenOwner);
    const purchaseValue = web3.toWei(1, "ether");
    const bkxCrowdsale = await BankExCrowdsale.deployed();
    await bkxCrowdsale.buyTokens(bkxInvestor, {from: bkxInvestor, value: purchaseValue});
    const newBalance = web3.eth.getBalance(bkxTokenOwner);
    assert.equal(newBalance.toNumber(), initialBalance.plus(purchaseValue));
  });
});
