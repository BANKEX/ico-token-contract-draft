var TokenEscrow = artifacts.require("TokenEscrow.sol");
var BankExToken = artifacts.require("BankExToken.sol");
var BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExToken', function(accounts) {
  it("should convert PBKX to BKX", function() {
    var pbkxToken;
    var bkxToken;
    var pbkxTokenOwner = accounts[0];
    var pbkxInvestor = accounts[1];
    var pbkxInvestorBalance;

    return TokenEscrow.deployed()
    .then(function(_pbkxToken) {
      pbkxToken = _pbkxToken;
      return pbkxToken.sendTransaction({from: pbkxInvestor, value: web3.toWei(1, "ether")});
    })
    .then(function() {
      return pbkxToken.balanceOf(pbkxInvestor);
    })
    .then(function(_pbkxInvestorBalance) {
      pbkxInvestorBalance = _pbkxInvestorBalance;
      return BankExCrowdsale.deployed()
    })
    .then(function(bkxCrowdsale) {
      return bkxCrowdsale.token();
    })
    .then(function(bkxTokenAddress) {
      bkxToken = BankExToken.at(bkxTokenAddress);
      return pbkxToken.setToken(bkxTokenAddress);
    })
    .then(function() {
      return pbkxToken.setRate(1);
    })
    .then(function() {
      return pbkxToken.convert({from: pbkxInvestor});
    })
    .then(function() {
      return bkxToken.balanceOf(pbkxInvestor);
    })
    .then(function(balance) {
      assert.equal(pbkxInvestorBalance, balance.toNumber());
    });
  });
});
