
Ethereum smart contract that distributes BANKEX tokens (BKX).

The amount of tokens offered for the crowdsale is transferred to the crowdsale contract at the instantiation time.

The tokens are sold in tranches, each tranche comprising a fixed amount of tokens at a fixed price.
After all the tokens in a tranche are sold out, the next tranche becomes active.

The crowdsale starts at the specified timestamp and ends when either the specified timestamp is reached or all the tokens are sold.
In the former case undistributed tokens are transferred back to BANKEX.

The crowdsale contract interoperates with the External Oracle account that is a BANKEX service authorized to:
1. Distribute tokens on behalf of investor without making direct Ether transfer to the crowdsale contract.
2. Register investors.

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
