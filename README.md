# BANKEX Token Crowdsale Contracts

Ethereum smart contracts that distribute BANKEX tokens (BKX).

### BANKEX Token (BKX)

BKX is an ERC-20 compatible token.

* The token contract is created by the crowdsale contract.
* BKX has fixed total supply
* Tokens offered for the crowdsale are transferred to the crowdsale contract at creation time
* 3,000,000 BKX are reserved fro pre-sale (PBKX) investors
* All remaining tokens are stored on BANKEX balance

BKX movement is restricted until explicitly allowed.
Only parties authorized to transfer BKX until that are:
1. The crowdsale contract -- to distribute tokens purchased at the crowdsale
2. PBKX conversion contract -- to perform conversion 
3. Bankex -- to distribute among the team and pre-sale investors (non-PBKX)

### Pre-Sale Token Conversion
3,000,000 of tokens, known as [PBKX,](https://etherscan.io/token/0x5aC0197C944c961F58bb02F3d0Df58a74FDC15B6) 
has been distributed during the pre-sale phase. These tokens can and should be converted to BKX tokens. In order to do that,
each PBKX holder should run [`convert`](https://github.com/BankEx/pre-ico-token-contract/blob/ac55d1c2b8b56d6801a84e9d486e731e94855d3c/bankexpresaleescrow.sol#L107-L117)
function of the [PBKX contract.](https://etherscan.io/address/0x5aC0197C944c961F58bb02F3d0Df58a74FDC15B6) After the transaction is executed,
the holder's PBKX balance will be set to 0, and her BKX balance will be increased by the corresponding amount. The conversion rate is established by BANKEX using
[`setRate`](https://github.com/BankEx/pre-ico-token-contract/blob/ac55d1c2b8b56d6801a84e9d486e731e94855d3c/bankexpresaleescrow.sol#L54-L56) function.
Conversion respects tokens' decimals, i.e. if the conversion rate is set to 1, for 1 PBKX (10 ** 2 token subunits) the investor will get 1 BKX (10 ** 18 token subunits).
Partial conversion is not supported.

### Crowdsale Contract
The amount of tokens offered for the crowdsale is transferred to the crowdsale contract at the instantiation time.
The crowdsale starts at the specified timestamp and ends when either the specified timestamp is reached or all the tokens are sold.
In the former case undistributed tokens are transferred back to BANKEX.

#### Pricing
The tokens are sold in tranches, each tranche comprising a fixed amount of tokens at a fixed price.
After all the tokens in a tranche are sold out, the next tranche becomes active.

#### External Oracle
The crowdsale contract interoperates with the External Oracle account that is a BANKEX service authorized to:
1. Distribute tokens on behalf of investor without making direct Ether transfer to the crowdsale contract.
2. Register investors.

BANKEX crowdsale distributes tokens in a semi-trustless manner.    

#### KYC
Only registered investors are allowed to take part in the crowdsale. 

#### Purchase
Tokens can be purchased in 2 ways:
1. By an investor via a direct Ether transfer to the crowdsale contract.
   The funds are instantly forwarded to the BANKEX-controlled address, and the corresponding amount of tokens is transferred from the crowdsale contract to the sender's address.
   To prove that the Ether collected is not used to purchase BKX tokens, BANKEX can use a time lock wallet to receive the funds, or just avoid spending from the address.
   As the cost of a token subunit is intended to be orders of magnitude smaller than the cost of Ether transfer (and also for security reasons), the change isn't returned.
   The investor who purchases the last available tokens will be refunded manually.
2. By the External Oracle account on behalf of an investor, who has purchased the tokens via non-Ether payment.
   In this case no Ether is collected by the contract, so the External Oracle specifies the address to transfer tokens to and the Ether equivalent of the purchase using its exchange rate, but without explicit conversion.
   It should also provide some kind of a receipt that will be stored on the Ethereum blockchain and can later be used to prove that the funds were actually transferred to BANKEX (e.g. BTC transaction hash).
In any case only registered investors can take part in the crowdsale, and the purchase amount should be greater than the specified minimum.

#### Refund
No change as tokens are sold in token subunits and the price of a subunit is infinitesimal.
If some investor hits the hard cap, her change will be refunded with a manual Ether transfer.  

#### Finalization
If the crowdsale ends, but not all the tokens offered are sold out,
the crowdsale contract owner should call `finalize()` function of the crowdsale contract.
Then all the remaining tokens are transferred to BANKEX.

#### Unfreezing Token
To start free token circulation BANKEX should call `unfreeze()` function of the token contract.
After that BANKEX has no ability to freeze it any more.

### Test Coverage
From project folder run:
```
./node_modules/.bin/testrpc-sc
./node_modules/.bin/solidity-coverage
```