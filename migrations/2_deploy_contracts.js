var TokenEscrow = artifacts.require("test/TokenEscrow.sol");
var BankexCrowdsale = artifacts.require("BankexCrowdsale.sol");
var PresaleConversion = artifacts.require("PresaleConversion.sol");

module.exports = function(deployer) {
  var bkxTokenAddress;
  deployer.deploy(TokenEscrow)
  .then(function() {
    return deployer.deploy(PresaleConversion, TokenEscrow.address);
  })
  .then(function() {
    const startTime = web3.eth.getBlock('latest').timestamp + 30 * 60; // Math.floor(Date.now() / 1000); // seconds
    const endTime = startTime + 7 * 24 * 60 * 60; // + 1 week
    return deployer.deploy(BankexCrowdsale, [10, 10, 10], [10, 20, 30], startTime, endTime, PresaleConversion.address, web3.eth.accounts[0], web3.eth.accounts[1], 10 ** 15, web3.eth.accounts[2]);
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
    return pbkxToken.setToken(PresaleConversion.address);
  })
  .then(function() {
    return TokenEscrow.deployed();
  })
  .then(function(pbkxToken) {
    return pbkxToken.setRate(1);
  })
  .then(function() {
    return PresaleConversion.deployed();
  })
  .then(function(presaleConversion) {
    return presaleConversion.setBkxAddress(bkxTokenAddress);
  })
};
