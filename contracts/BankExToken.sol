pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/MintableToken.sol";

contract BankExToken is MintableToken {

  string public constant name = "BankEx Token";
  string public constant symbol = "BKX";
  uint8 public constant decimals = 18;

  uint256 public constant multiplier = 10 ** uint256(decimals);

  uint256 public constant reservedForPbkx  = 3000000 * multiplier;
  uint256 public constant reservedForWaves = 2500000 * multiplier; // TODO: finalize

  address public pbkxConversion;

  function BankExToken(address _pbkxConversion) {
    require(_pbkxConversion != address(0));
    pbkxConversion = _pbkxConversion;
    balances[pbkxConversion] = reservedForPbkx;
    balances[msg.sender] = reservedForWaves; // TODO: do we need a special account to distribute WAVES?
    totalSupply = reservedForPbkx + reservedForWaves;
  }

  modifier icoFinished() {
    require(mintingFinished || msg.sender == pbkxConversion); //TODO
    _;
  }

  function transfer(address _to, uint256 _value) public icoFinished returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public icoFinished returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public icoFinished returns (bool) {
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint _addedValue) public icoFinished returns (bool success) {
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public icoFinished returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue);
  }
}
