import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const BankexToken = artifacts.require('BankexToken')

const tokensForSale = new BigNumber(1000)
const fromAccountBalance = new BigNumber(100)
const value = new BigNumber(10)

contract('BankexToken', function ([_, owner, bankexTokenWallet, pbkxConversion, someAccount, fromAccount, toAccount, spenderAccount]) {

  beforeEach(async function () {
    this.token = await BankexToken.new(bankexTokenWallet, pbkxConversion, tokensForSale, {from: owner})
  })

  it('Bankex token wallet should be specified', async function() {
    await BankexToken.new(null, pbkxConversion, tokensForSale, {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('amount of tokens for sale should be positive', async function() {
    await BankexToken.new(bankexTokenWallet, pbkxConversion, new BigNumber(0), {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('owner\'s balance is equal tokens for sale', async function() {
    const balance = await this.token.balanceOf(owner)
    balance.should.be.bignumber.equal(tokensForSale)
  })

  it('has an owner', async function() {
    const _owner = await this.token.owner()
    _owner.should.equal(owner)
  })

  it('is created frozen', async function() {
    (await this.token.frozen()).should.be.true
  })

  it('can be unfrozen by the owner', async function() {
    await this.token.unfreeze({from: owner})
    const frozen = await this.token.frozen()
    frozen.should.be.false
  })

  it('can be unfrozen only by the owner', async function() {
    await this.token.unfreeze({from: someAccount}).should.be.rejectedWith(EVMThrow)
  })

  it('can be unfrozen only once', async function() {
    await this.token.unfreeze({from: owner})
    await this.token.unfreeze({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  describe('when frozen', function () {

    beforeEach(async function() {
      await this.token.transfer(fromAccount, fromAccountBalance, {from: owner})      
    })

    it('does not allow transfer', async function () {
      await this.token.transfer(toAccount, value, {from: fromAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('allows transfer from owner', async function () {
      await this.token.transfer(toAccount, value, {from: owner})
      const balance = await this.token.balanceOf(toAccount)
      balance.should.be.bignumber.equal(value)
    })

    it('does not allow transferFrom', async function () {
      await this.token.approve(spenderAccount, value, {from: fromAccount}).should.be.rejectedWith(EVMThrow)
      await this.token.transferFrom(fromAccount, toAccount, value, {from: spenderAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('does not allow approve', async function () {
      await this.token.approve(spenderAccount, value, {from: fromAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('does not allow increaseApproval', async function () {
      await this.token.increaseApproval(spenderAccount, value, {from: fromAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('does not allow decreaseApproval', async function () {
      await this.token.decreaseApproval(spenderAccount, value, {from: fromAccount}).should.be.rejectedWith(EVMThrow)
    })
  })

  describe('when unfrozen', function () {

    beforeEach(async function() {
      await this.token.transfer(fromAccount, fromAccountBalance, {from: owner})
      const {logs} = await this.token.unfreeze({from: owner})
      this.logs = logs
    })

    it('logs an event', async function () {
      should.exist(this.logs.find(e => e.event === 'Unfrozen'))
    })

    it('allows transfer', async function () {
      await this.token.transfer(toAccount, value, {from: fromAccount})
      const balance = await this.token.balanceOf(toAccount)
      balance.should.be.bignumber.equal(value)
    })

    it('allows transferFrom', async function () {
      await this.token.approve(spenderAccount, value, {from: fromAccount})
      await this.token.transferFrom(fromAccount, toAccount, value, {from: spenderAccount})
      const balance = await this.token.balanceOf(toAccount)
      balance.should.be.bignumber.equal(value)
    })

    it('allows approve', async function () {
      await this.token.approve(spenderAccount, value, {from: fromAccount})
      const allowance = await this.token.allowance(fromAccount, spenderAccount)
      allowance.should.be.bignumber.equal(value)
    })

    it('allows increaseApproval', async function () {
      await this.token.increaseApproval(spenderAccount, value, {from: fromAccount})
      const allowance = await this.token.allowance(fromAccount, spenderAccount)
      allowance.should.be.bignumber.equal(value)
    })

    it('allows decreaseApproval', async function () {
      await this.token.approve(spenderAccount, value, {from: fromAccount})
      await this.token.decreaseApproval(spenderAccount, value, {from: fromAccount})
      const allowance = await this.token.allowance(fromAccount, spenderAccount)
      allowance.should.be.bignumber.equal(0)
    })
  })
})
