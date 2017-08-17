var BankExToken = artifacts.require("BankExToken.sol");
var BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExCrowdsale', function(accounts) {

  it("should not allow direct payments", function() {
    var bkxCrowdsale;
    var bkxTokenOwner = accounts[0];
    var bkxInvestor = accounts[1];
    var initialBalance = web3.eth.getBalance(bkxInvestor);
    var purchaseValue = web3.toWei(1, "ether");

    return BankExCrowdsale.deployed()
    .then(function(_bkxCrowdsale) {
      bkxCrowdsale = _bkxCrowdsale;
      return bkxCrowdsale.sendTransaction({from: bkxInvestor, value: purchaseValue});
    })
    .then(function() {
      return bkxCrowdsale.token();
    })
    .then(function(bkxTokenAddress) {
      bkxToken = BankExToken.at(bkxTokenAddress);
      return bkxToken.balanceOf(bkxInvestor);
    })
    .then(function(balance) {
      assert.equal(balance.toNumber(), 0);
    });
  });
});
