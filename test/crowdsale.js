import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const BankExCrowdsale = artifacts.require('BankExCrowdsale')
const PresaleConversion = artifacts.require('PresaleConversion')
const MintableToken = artifacts.require('MintableToken')

contract('BankExCrowdsale', function ([owner, someAccount, newExternalOracle, _, investor, bankexEtherWallet, bankexTokenWallet, externalOracle]) {

  const tokens = new BigNumber(1000000000000)
  const rate = new BigNumber(1000)
  const value = new BigNumber(1000000)
  const receipt = 123

  const expectedTokenAmount = value.div(rate)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1)
    this.endTime =   this.startTime + duration.weeks(1)
    this.afterEndTime = this.endTime + duration.seconds(1)

    this.crowdsale = await BankExCrowdsale.new([tokens], [rate], this.startTime, this.endTime, PresaleConversion.address, bankexEtherWallet, bankexTokenWallet, 1000000, externalOracle)
    this.token = MintableToken.at(await this.crowdsale.token())

    this.initialSupply = await this.token.totalSupply()
  })

  it('should have an owner', async function() {
    const _owner = await this.crowdsale.owner()
    _owner.should.equal(owner)
  })

  it('should be token owner', async function () {
    const owner = await this.token.owner()
    owner.should.equal(this.crowdsale.address)
  })

  it('should be ended only after end', async function () {
    let ended = await this.crowdsale.hasEnded()
    ended.should.equal(false)
    await increaseTimeTo(this.afterEndTime)
    ended = await this.crowdsale.hasEnded()
    ended.should.equal(true)
  })

  describe('accepting payments', function () {

    beforeEach(async function() {
      await this.crowdsale.register(investor, {from: externalOracle})
    })

    it('should reject payments before start', async function () {
      await this.crowdsale.sendTransaction({value: value, from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.sendTransaction({value: value, from: investor}).should.be.fulfilled
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.sendTransaction({value: value, from: investor}).should.be.rejectedWith(EVMThrow)
    })
  })

  describe('KYC', function () {

    it('only external oracle can register investor', async function () {
      await this.crowdsale.register(investor, {from: someAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('investor should be specified', async function () {
       await this.crowdsale.register(null, {from: externalOracle}).should.be.rejectedWith(EVMThrow)
    })

    it('same investor can not be registered twice', async function () {
      await this.crowdsale.register(investor, {from: externalOracle})
      await this.crowdsale.register(investor, {from: externalOracle}).should.be.rejectedWith(EVMThrow)
    })

    it('transfer from unknown investor is rejected', async function () {
      await this.crowdsale.sendTransaction({value: value, from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('external purchase for unknown investor is rejected', async function () {
      await this.crowdsale.doExternalPurchase(investor, value, receipt, {from: externalOracle}).should.be.rejectedWith(EVMThrow)
    })

    it('unknown investor has no registered status', async function () {
      const registered = await this.crowdsale.registered(investor)
      registered.should.equal(false)
    })

    it('registered investor has registered status', async function () {
      await this.crowdsale.register(investor, {from: externalOracle})
      const registered = await this.crowdsale.registered(investor)
      registered.should.equal(true)
    })

    it('registration is logged', async function () {
      const {logs} = await this.crowdsale.register(investor, {from: externalOracle})
      const event = logs.find(e => e.event === 'Registration')
      should.exist(event)
      event.args.investor.should.equal(investor)
      event.args.status.should.equal(true)
    })
  })

  describe('external oracle', function () {

    it('... should be defined', async function() {
      const _externalOracle = await this.crowdsale.externalOracle()
      _externalOracle.should.equal(externalOracle)
    })

    it('... can be changed by the owner', async function() {
      await this.crowdsale.changeExternalOracle(newExternalOracle, {from: owner})
      const _externalOracle = await this.crowdsale.externalOracle()
      _externalOracle.should.equal(newExternalOracle)
    })

    it('... can be changed only by the owner', async function () {
      await this.crowdsale.changeExternalOracle(newExternalOracle, {from: someAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('... can not be changed to null', async function() {
      await this.crowdsale.changeExternalOracle(null, {from: owner}).should.be.rejectedWith(EVMThrow)
      const _externalOracle = await this.crowdsale.externalOracle()
    })

    it('... change is logged', async function () {
      const {logs} = await this.crowdsale.changeExternalOracle(newExternalOracle, {from: owner})
      const event = logs.find(e => e.event === 'ExternalOracleChanged')
      should.exist(event)
      event.args.previousExternalOracle.should.equal(externalOracle)
      event.args.newExternalOracle.should.equal(newExternalOracle)
    })
  })

  describe('ethereum purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.register(investor, {from: externalOracle})
    })

    it('payments bellow minimum contribution are rejected', async function () {
      await this.crowdsale.sendTransaction({value: 1000, from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.sendTransaction({value: value, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.investor.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should assign tokens to sender', async function () {
      await this.crowdsale.sendTransaction({value: value, from: investor})
      let balance = await this.token.balanceOf(investor)
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should forward funds to bankexEtherWallet', async function () {
      const pre = web3.eth.getBalance(bankexEtherWallet)
      await this.crowdsale.sendTransaction({value, from: investor})
      const post = web3.eth.getBalance(bankexEtherWallet)
      post.minus(pre).should.be.bignumber.equal(value)
    })
  })

  describe('external purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.register(investor, {from: externalOracle})
    })

    it('can be called by externalOracle only', async function () {
      await this.crowdsale.doExternalPurchase(investor, 1000, receipt, {from: someAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('payments bellow minimum contribution are rejected', async function () {
      await this.crowdsale.doExternalPurchase(investor, 1000, receipt, {from: externalOracle}).should.be.rejectedWith(EVMThrow)
    })

    it('should log purchase', async function () {
      const {logs} = await this.crowdsale.doExternalPurchase(investor, value, receipt, {from: externalOracle})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)
      event.args.investor.should.equal(investor)
      event.args.value.should.be.bignumber.equal(value)
      event.args.amount.should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should assign tokens to investor', async function () {
      await this.crowdsale.doExternalPurchase(investor, value, receipt, {from: externalOracle})
      const balance = await this.token.balanceOf(investor)
      balance.should.be.bignumber.equal(expectedTokenAmount)
    })
  })

  describe('finalization', function () {

    beforeEach(async function() {
      // await increaseTimeTo(this.startTime)
    })

    it('can be called only once', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize()
      await this.crowdsale.finalize().should.be.rejectedWith(EVMThrow)
    })

    it('can not be called before end', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.finalize().should.be.rejectedWith(EVMThrow)
    })

    it('can be called before end if all tokens are sold', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.register(investor, {from: externalOracle})
      await this.crowdsale.doExternalPurchase(investor, tokens.mul(rate), receipt, {from: externalOracle})
      // console.log(await this.crowdsale.tokensSold())
      // console.log(await this.crowdsale.maxTokens())
      await this.crowdsale.finalize()
    })

    it('transfers undistributed tokens to BankEx token wallet', async function () {
      await increaseTimeTo(this.afterEndTime)
      const crowdsaleBalance = await this.token.balanceOf(this.crowdsale.address)
      await this.crowdsale.finalize()
      const balance = await this.token.balanceOf(bankexTokenWallet)
      balance.should.be.bignumber.equal(crowdsaleBalance)
    })

    it('starts token circulation', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.register(investor, {from: externalOracle})
      await this.crowdsale.doExternalPurchase(investor, tokens.mul(rate), receipt, {from: externalOracle})
      await this.token.transfer(someAccount, 1, {from: investor}).should.be.rejectedWith(EVMThrow)

      await increaseTimeTo(this.afterEndTime)
      await this.crowdsale.finalize()

      await this.token.transfer(someAccount, 1, {from: investor})
      const balance = await this.token.balanceOf(someAccount)
      balance.should.be.bignumber.equal(1)
    })

    it('logs event', async function () {
      await increaseTimeTo(this.startTime)
      await this.crowdsale.register(investor, {from: externalOracle})
      await this.crowdsale.doExternalPurchase(investor, tokens.mul(rate), receipt, {from: externalOracle})
      const {logs} = await this.crowdsale.finalize()
      const event = logs.find(e => e.event === 'Finalized')
      should.exist(event)
      event.args.tokensSold.should.be.bignumber.equal(tokens)
    })
  })
})
