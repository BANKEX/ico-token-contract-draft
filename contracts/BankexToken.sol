pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract BankexToken is StandardToken, Ownable {

  string public constant name = "BankEx Token";
  string public constant symbol = "BKX";
  uint8 public constant decimals = 18;

  uint256 private constant multiplier = 10 ** uint256(decimals);

  uint256 public constant totalSupply = 222387500 * multiplier; //TODO: finalize

  uint256 public constant reservedForPbkx  = 3000000 * multiplier; //TODO: finalize

  address public pbkxConversion;

  function BankexToken(address _bankexTokenWallet, address _pbkxConversion, uint256 _tokensForSale) {
    require(_bankexTokenWallet != address(0));
    require(_pbkxConversion != address(0));
    require(_tokensForSale > 0);
    pbkxConversion = _pbkxConversion;
    balances[pbkxConversion] = reservedForPbkx;
    balances[msg.sender] = totalSupply - reservedForPbkx;
  }

  bool public frozen = true;

  event Unfrozen();

  function unfreeze() public onlyOwner  returns (bool) {
    require(frozen);
    frozen = false;
    Unfrozen();
    return true;
  }

  modifier notFrozen() {
    require(!frozen);
    _;
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(!frozen || msg.sender == owner || msg.sender == pbkxConversion);
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public notFrozen returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public notFrozen returns (bool) {
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint _addedValue) public notFrozen returns (bool success) {
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public notFrozen returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue);
  }
}
