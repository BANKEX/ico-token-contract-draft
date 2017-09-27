pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";

contract BankExToken is MintableToken {

  string public constant name = "BankEx Token";
  string public constant symbol = "BKX";
  uint8 public constant decimals = 18;

  uint256 public constant multiplier = 10 ** uint256(decimals);  

  uint256 public constant reservedForPbkx  = 3000000 * multiplier;
  uint256 public constant reservedForWaves = 2500000 * multiplier; // TODO: finalize

  function BankExToken(address pbkxConversion) {
    require(pbkxConversion != address(0));
    balances[pbkxConversion] = reservedForPbkx;
    balances[msg.sender] = reservedForWaves; // TODO: do we need a special account to distribute WAVES?
    totalSupply = reservedForPbkx + reservedForWaves;
  }
}
