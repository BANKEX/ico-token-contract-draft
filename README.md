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

### Testing
From project folder run:
```
npm install
./node_modules/.bin/testrpc
./node_modules/.bin/truffle test
```

### Test Coverage
From project folder run:
```
npm install
./node_modules/.bin/testrpc-sc
./node_modules/.bin/solidity-coverage
```

### Solidity Linter
From project folder run:
```
npm install
./node_modules/.bin/solium -d contracts
```

### Deployment
PBKX contract address
PBKX contract owner private key

1. From project folder run:
```
npm install
node ./node_modules/sol-merger/bin/sol-merger.js ./contracts/BankexCrowdsale.sol ./build/flattened
```
###### 2. Compilation
Open [Remix](http://remix.ethereum.org/#version=soljson-v0.4.17+commit.bdeb9e52.js&optimize=true),
copy-and-paste `./build/flattened/BankexCrowdsale.sol` contents into the editor pane, 
and wait for the code to be compiled.
###### 3. Deployment
In Remix go to the *Run* tab,
set *Environment* to *Injected Web3*,
and make sure that the BankexCrowdsale contract is selected in the dropdown.
Provide a comma-separated list of constructor arguments in the input next to the *Create* button. The arguments are:
1. `_trancheAmounts` &mdash; the list of tranche sizes specified in token subunits.   
2. `_tranchePrices` &mdash; the list of prices for each tranche in weis per token subunit.   
3. `_startTime` &mdash; [UNIX timestamp](https://www.unixtimestamp.com/) at which the crowdsale starts.
4. `_endTime` &mdash; [UNIX timestamp](https://www.unixtimestamp.com/) at which the crowdsale ends (if the hard cap hasn't been reached earlier).
5. `_presaleConversion` &mdash; pre-sale (PBKX) contract address.
6. `_bankexEtherWallet` &mdash; address where the Ether collected during the crowdsale is transfered to.
7. `_bankexTokenWallet` &mdash; address where BANKEX token share is hold.
8. `_minimumContributionInWei` &mdash; minimum investment possible in wei.
9. `_externalOracle` &mdash; External Oracle address.
  
Then, make sure that the right account is selected in MetaMask, push the *Create* button and wait for the transaction to succeed.
Don't close the Remix yet!
---  
For example, the crowdsale [instantiated](https://ropsten.etherscan.io/address/0x28489450d345ce706fe0cabde41ce037e472684e)
with the following parameters: 
```
[3000000000000, 2000000000000, 1000000000000], [1000000, 2000000, 3000000], 1508343600, 1508500800, "0xd1734F44aA4361515849d3384E909ceC4E2497CB", "0xDff3a68F3fA9B2BfeE10C41eDae37cf58a0Aef8c", "0xEd5F646B581AB16Fb4c8A4073D43E60F97520b78", 1000000000000000, "0x35c67d569F43eF474e163D3E859B050B8A089998"  
```
* runs from 10/18/2017 @ 4:20pm (UTC) to 10/20/2017 @ 12:00pm (UTC);
* distributes the tokens in 3 tranches: first 3000 tokens for 1 finney each, next 2000 tokens for 2 finneys each, and the last 1000 tokens for 3 finneys each;
* with 1 finney minimal contribution possible;
* and the addresses specified:
[PBKX contract,](https://ropsten.etherscan.io/address/0xd1734f44aa4361515849d3384e909cec4e2497cb)
[ether wallet,](https://ropsten.etherscan.io/address/0xdff3a68f3fa9b2bfee10c41edae37cf58a0aef8c)
[token wallet,](https://ropsten.etherscan.io/address/0xed5f646b581ab16fb4c8a4073d43e60f97520b78) and
[External Oracle.](https://ropsten.etherscan.io/address/0x35c67d569f43ef474e163d3e859b050b8a089998)
---

###### 4. Contract Code Verification
Go to the contract's page at [Etherscan](https://etherscan.io/)
(either by clicking on the transaction in MetaMask and following the link at Etherscan,
or by copying-and-pasting the address from Remix to Etherscan's search), open the *Contract Code* tab and click *Verify And Publish.*
You need to specify *Contract Name* (BankexCrowdsale), *Compiler* (0.4.17+commit.bdeb9e52), *Optimization* (Enabled), 
and copy-and-paste the contract code. Finally you need to provide the constructor arguments, you used in ABI encoding. To do that:
1. Open the transaction that created the contract at Etherscan (by clicking the transaction in MetaMask) and copy-and-paste the data 
from the *Input Data* field to a text file.
2. In Remix, go to the 'Compile' tab, make sure that the BankexCrowdsale contract is selected in the dropdown, click the 'Details' button,
and copy-and-paste the data from the *BYTECODE* field to the text file.
3. Notice that the first string is identical to the second with the exception of the last bytes. These bytes (the difference between the 2 strings)
is the ABI-encoded arguments you need.

Push 'Verify And Publish' and hopefully you are done!   