const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const TokenEscrow = artifacts.require('test/TokenEscrow.sol') // PBKX token
const BankexToken = artifacts.require('BankexToken')

contract('PresaleConversion', function ([_, bankexTokenWallet, pbkxToken, pbkxInvestor]) {

  beforeEach(async function() {
    this.pbkxToken = await TokenEscrow.new()
    this.bkxToken = await BankexToken.new(bankexTokenWallet, this.pbkxToken.address, 1)
    this.pbkxDecimals = await this.pbkxToken.decimals()
    this.bkxDecimals = await this.bkxToken.decimals()
    await this.pbkxToken.setToken(this.bkxToken.address)
    await this.pbkxToken.setRate(new BigNumber(10).pow(this.bkxDecimals.sub(this.pbkxDecimals)))
  })

  it('should convert 1 PBKX to 1 BKX', async function() {
    await this.pbkxToken.sendTransaction({from: pbkxInvestor, value: web3.toWei(1, 'ether')})
    const pbkxBalance = await this.pbkxToken.balanceOf(pbkxInvestor)
    const pbkxTokens = pbkxBalance.div(new BigNumber(10).pow(this.pbkxDecimals))
    await this.pbkxToken.convert({from: pbkxInvestor})
    const bkxBalance = await this.bkxToken.balanceOf(pbkxInvestor)
    const bkxTokens = bkxBalance.div(new BigNumber(10).pow(this.bkxDecimals))
    bkxTokens.should.be.bignumber.equal(pbkxTokens)
  })
})
