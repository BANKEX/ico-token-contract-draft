var BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExCrowdsale', function(accounts) {
  it("should forward funds to BankEx", function() {
    var bkxTokenOwner = accounts[0];
    var bkxInvestor = accounts[1];
    var initialBalance = web3.eth.getBalance(bkxTokenOwner);
    var purchaseValue = web3.toWei(1, "ether");

    return BankExCrowdsale.deployed()
    .then(function(bkxCrowdsale) {
      return bkxCrowdsale.buyTokens(bkxInvestor, {from: bkxInvestor, value: purchaseValue});
    })
    .then(function() {
      var newBalance = web3.eth.getBalance(bkxTokenOwner);
      assert.equal(newBalance.toNumber(), initialBalance.plus(purchaseValue));
    });
  });
});
