var TokenEscrow = artifacts.require("test/TokenEscrow.sol");
var BankexCrowdsale = artifacts.require("BankexCrowdsale.sol");

module.exports = function(deployer) {
  var bkxTokenAddress;
  deployer.deploy(TokenEscrow)
  .then(function() {
    const startTime = web3.eth.getBlock('latest').timestamp + 30 * 60; // Math.floor(Date.now() / 1000); // seconds
    const endTime = startTime + 7 * 24 * 60 * 60; // + 1 week
    return deployer.deploy(BankexCrowdsale, [10, 10, 10], [10, 20, 30], startTime, endTime, TokenEscrow.address, web3.eth.accounts[0], web3.eth.accounts[1], 10 ** 15, web3.eth.accounts[2]);
  })
  .then(function() {
    return BankexCrowdsale.deployed();
  })
  .then(function(bankExCrowdsale) {
    return bankExCrowdsale.token();
  })
  .then(function(_bkxTokenAddress) {
    bkxTokenAddress = _bkxTokenAddress;
    return TokenEscrow.deployed();
  })
  .then(function(pbkxToken) {
    return pbkxToken.setToken(bkxTokenAddress);
  })
  .then(function() {
    return TokenEscrow.deployed();
  })
  .then(function(pbkxToken) {
    return pbkxToken.setRate(10 ** 16);
  })
};
