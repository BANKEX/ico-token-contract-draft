pragma solidity ^0.4.11;

import "./BankExToken.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

contract BankExCrowdsale is Crowdsale {

  function BankExCrowdsale(uint256 _startBlock, uint256 _endBlock, uint256 _rate, address _wallet) Crowdsale(_startBlock, _endBlock, _rate, _wallet) {

  }

  function () payable {    
  }

  // creates the token to be sold.
  // override this method to have crowdsale of a specific MintableToken token.
  function createTokenContract() internal returns (MintableToken) {
    return new BankExToken();
  }
}
