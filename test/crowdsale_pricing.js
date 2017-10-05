import {advanceBlock} from './helpers/advanceToBlock';
import {increaseTimeTo, duration} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MintableToken = artifacts.require('MintableToken');
const PresaleConversion = artifacts.require('PresaleConversion');
const BankExCrowdsale = artifacts.require('BankExCrowdsale');

contract('BankExCrowdsale', function ([_, investor, wallet]) {

  before(async function() {
    await advanceBlock();
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);
    this.crowdsale = await BankExCrowdsale.new([10, 10, 10], [10, 20, 30], this.startTime, this.endTime, PresaleConversion.address, wallet, 1);
    this.crowdsale.register(investor);
    this.token = MintableToken.at(await this.crowdsale.token());
    await increaseTimeTo(this.startTime);
  });

  it('should calculate prices correctly', async function () {
    // left: 10x10, 10x20 and 10x30
    await this.crowdsale.sendTransaction({value: 10, from: investor});
    let balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(1);
    // left: 9x10, 10x20 and 10x30
    await this.crowdsale.sendTransaction({value: 20, from: investor});
    balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(3);
    // left: 7x10, 10x20 and 10x30
    await this.crowdsale.sendTransaction({value: 70, from: investor});
    balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(10);
    // left: 0x10, 10x20 and 10x30
    await this.crowdsale.sendTransaction({value: 260, from: investor});
    balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(22);
    // left: 0x10, 0x20 and 8x30
    await this.crowdsale.sendTransaction({value: 1000, from: investor});
    balance = await this.token.balanceOf(investor);
    balance.should.be.bignumber.equal(30);
  });
})
