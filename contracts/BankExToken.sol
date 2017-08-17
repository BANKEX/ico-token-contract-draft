pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";

contract BankExToken is MintableToken {

  string public constant name = "BankEx Token";
  string public constant symbol = "BKX";
  uint256 public constant decimals = 2;

  // Presale (PBKX token) contract params:
  address public PBKX_CONTRACT; // TODO: address constant public PBKX_CONTRACT = 0x5aC0197C944c961F58bb02F3d0Df58a74FDC15B6;
  uint256 public constant PBKX_TO_BKX_EXCHANGE_RATE = 1;
  uint256 public constant PBKX_TOTAL_SUPPLY = 300000000;

  uint256 public constant BKX_INITIAL_SUPPLY = PBKX_TOTAL_SUPPLY * PBKX_TO_BKX_EXCHANGE_RATE;

  function BankExToken() {
    /*balances[PBKX_CONTRACT] = BKX_INITIAL_SUPPLY;*/
    totalSupply = BKX_INITIAL_SUPPLY;
  }

  function setPbkx(address pbkx) {
    PBKX_CONTRACT = pbkx;
    balances[PBKX_CONTRACT] = BKX_INITIAL_SUPPLY;
  }

   /**
   * @dev Transfer tokens from BankEx presale contract balance to a specified address
   * @param _to The address to transfer tokens to.
   * @param _value The amount of tokens to be transferred.
   * @return success/failure
   */
  function transferFromOwner(address _to, uint256 _value) returns (bool success) {
    require(msg.sender == PBKX_CONTRACT);
    return transfer(_to, _value);
  }
}
