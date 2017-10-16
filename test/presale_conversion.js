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
    await this.pbkxToken.setToken(this.bkxToken.address)
    await this.pbkxToken.setRate(10 ** 16)
  })

  it('should convert 1 PBKX to 1 BKX', async function() {
    await this.pbkxToken.sendTransaction({from: pbkxInvestor, value: web3.toWei(1, 'ether')})
    const pbkxBalance = await this.pbkxToken.balanceOf(pbkxInvestor)
    const pbkxDecimals = await this.pbkxToken.decimals()
    const pbkxTokens = pbkxBalance.div(new BigNumber(10).pow(pbkxDecimals))
    await this.pbkxToken.convert({from: pbkxInvestor})
    const bkxBalance = await this.bkxToken.balanceOf(pbkxInvestor)
    const bkxDecimals = await this.bkxToken.decimals()
    const bkxTokens = bkxBalance.div(new BigNumber(10).pow(bkxDecimals))
    bkxTokens.should.be.bignumber.equal(pbkxTokens)
  })
})
