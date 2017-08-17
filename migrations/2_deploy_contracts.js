var TokenEscrow = artifacts.require("TokenEscrow.sol");
var BankExToken = artifacts.require("BankExToken.sol");
var BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

module.exports = function(deployer) {
  deployer.deploy(TokenEscrow)
  .then(function() {
    const startBlock = web3.eth.blockNumber + 2;
    const endBlock = startBlock + 300;
    const rate = new web3.BigNumber(1000);
    const wallet = web3.eth.accounts[0];
    return deployer.deploy(BankExCrowdsale, startBlock, endBlock, rate, wallet);
  })
  .then(function() {
    return BankExCrowdsale.deployed();
  })
  .then(function(bankExCrowdsale) {
    return bankExCrowdsale.token();
  })
  .then(function(bankExTokenAddress) {
    return BankExToken.at(bankExTokenAddress);
  })
  .then(function(bankExToken) {
    return bankExToken.setPbkx(TokenEscrow.address);
  });
};
