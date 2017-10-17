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

contract('BankexToken', function ([_, owner, bankexTokenWallet, pbkxToken, someAccount, fromAccount, toAccount, spenderAccount]) {

  beforeEach(async function () {
    this.token = await BankexToken.new(bankexTokenWallet, pbkxToken, tokensForSale, {from: owner})
    this.decimals = await this.token.decimals()
  })

  it('Bankex token wallet should be specified', async function() {
    await BankexToken.new(null, pbkxToken, tokensForSale, {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('Bankex token wallet is set', async function() {
    const _bankexTokenWallet = await this.token.bankexTokenWallet()
    _bankexTokenWallet.should.equal(bankexTokenWallet)
  })

  it('amount of tokens for sale should be positive', async function() {
    await BankexToken.new(bankexTokenWallet, pbkxToken, new BigNumber(0), {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('owner\'s balance is equal tokens for sale', async function() {
    const balance = await this.token.balanceOf(owner)
    balance.should.be.bignumber.equal(tokensForSale)
  })

  it('there should be enough tokens', async function() {
    const totalSupply = await this.token.totalSupply()
    const reservedForPbkx = await this.token.reservedForPbkx()
    const tokensForSale = totalSupply.sub(reservedForPbkx).add(1)
    await BankexToken.new(bankexTokenWallet, pbkxToken, tokensForSale, {from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('has an owner', async function() {
    const _owner = await this.token.owner()
    _owner.should.equal(owner)
  })

  it('is created frozen', async function() {
    (await this.token.frozen()).should.be.true
  })

  it('can be unfrozen by Bankex token wallet', async function() {
    await this.token.unfreeze({from: bankexTokenWallet})
    const frozen = await this.token.frozen()
    frozen.should.be.false
  })

  it('can be unfrozen only by Bankex token wallet', async function() {
    await this.token.unfreeze({from: someAccount}).should.be.rejectedWith(EVMThrow)
  })

  it('can be unfrozen only once', async function() {
    await this.token.unfreeze({from: bankexTokenWallet})
    await this.token.unfreeze({from: bankexTokenWallet}).should.be.rejectedWith(EVMThrow)
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

    it('allows transfer from Bankex token wallet', async function () {
      await this.token.transfer(toAccount, value, {from: bankexTokenWallet})
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

  describe('transferFromOwner', function () {

    it('can be called by pbkxToken', async function () {
      await this.token.transferFromOwner(toAccount, value, {from: pbkxToken})
      const balance = await this.token.balanceOf(toAccount)
      balance.should.be.bignumber.equal(value)
    })

    it('can be called only by pbkxToken', async function () {
      await this.token.transferFromOwner(toAccount, value, {from: someAccount}).should.be.rejectedWith(EVMThrow)
    })

    it('pbkxToken is authorized to distribute 3m BKX', async function () {
      const bkx3m = new BigNumber(10).pow(this.decimals).mul(3 * 10**6)
      await this.token.transferFromOwner(toAccount, bkx3m, {from: pbkxToken})
      const balance = await this.token.balanceOf(toAccount)
      balance.should.be.bignumber.equal(bkx3m)
    })

    it('pbkxToken can not distribute more than 3m BKX', async function () {
      const bkx3m = new BigNumber(10).pow(this.decimals).mul(3 * 10**6)
      await this.token.transferFromOwner(toAccount, bkx3m, {from: pbkxToken})
      await this.token.transferFromOwner(toAccount, 1, {from: pbkxToken}).should.be.rejectedWith(EVMThrow)
    })
  })
})
