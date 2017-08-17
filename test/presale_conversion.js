const TokenEscrow = artifacts.require("TokenEscrow.sol");
const BankExToken = artifacts.require("BankExToken.sol");
const BankExCrowdsale = artifacts.require("BankExCrowdsale.sol");

contract('BankExToken', function([pbkxTokenOwner, pbkxInvestor, _]) {
  it("should convert PBKX to BKX", async function() {
    const pbkxToken = await TokenEscrow.deployed();
    await pbkxToken.sendTransaction({from: pbkxInvestor, value: web3.toWei(1, "ether")});
    const pbkxInvestorBalance = await pbkxToken.balanceOf(pbkxInvestor);
    const bkxCrowdsale = await BankExCrowdsale.deployed();
    const bkxTokenAddress = await bkxCrowdsale.token();
    const bkxToken = await BankExToken.at(bkxTokenAddress);
    await pbkxToken.setToken(bkxTokenAddress);
    await pbkxToken.setRate(1);
    await pbkxToken.convert({from: pbkxInvestor});
    const balance = await bkxToken.balanceOf(pbkxInvestor);
    assert.equal(pbkxInvestorBalance, balance.toNumber());
  });
});
