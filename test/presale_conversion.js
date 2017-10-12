const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TokenEscrow = artifacts.require('test/TokenEscrow.sol'); // PBKX token
const BankexToken = artifacts.require('BankexToken');
const PresaleConversion = artifacts.require('PresaleConversion');
const BankexCrowdsale = artifacts.require('BankexCrowdsale');

contract('PresaleConversion', function ([owner, investor, _]) {

  before(async function() {
    // this.pbkxToken = await TokenEscrow.new();
    // this.presaleConversion = await PresaleConversion.new(this.pbkxToken.address);
    // this.bkxToken = await BankexToken.new(this.presaleConversion.address);
    // await this.pbkxToken.setToken(this.presaleConversion.address);
    // await this.pbkxToken.setRate(1);
    // await this.presaleConversion.setBkxAddress(this.bkxToken.address);
    this.pbkxToken = await TokenEscrow.deployed();
    this.presaleConversion = await PresaleConversion.deployed();
    this.crowdsale = await BankexCrowdsale.deployed();
    this.bkxToken = BankexToken.at(await this.crowdsale.token());
  });

  it("should convert PBKX to BKX", async function() {
    await this.pbkxToken.sendTransaction({from: investor, value: web3.toWei(1, "ether")});
    const pbkxBalance = await this.pbkxToken.balanceOf(investor);
    const pbkxDecimals = await this.pbkxToken.decimals();
    const pbkxTokens = pbkxBalance.div(new BigNumber(10).pow(pbkxDecimals));
    await this.pbkxToken.convert({from: investor});
    const bkxBalance = await this.bkxToken.balanceOf(investor);
    const bkxDecimals = await this.bkxToken.decimals();
    const bkxTokens = bkxBalance.div(new BigNumber(10).pow(bkxDecimals));
    bkxTokens.should.be.bignumber.equal(pbkxTokens);
  });
})
