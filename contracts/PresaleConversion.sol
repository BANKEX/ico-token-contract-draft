pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "./BankExToken.sol";

contract PresaleConversion is Ownable {

  uint256 public constant pbkxDecimals = 2;
  uint256 public constant bkxDecimals = 18;

  uint256 public constant pbkxToBkxExchangeRate = 1;
  uint256 public constant pbkxTotalSupply = 300000000;
  uint256 public constant multiplier = pbkxToBkxExchangeRate * (10 ** (bkxDecimals - pbkxDecimals));

  address public pbkxAddress; //TODO: constant
  BankExToken public bkxContract; //TODO: constant

  event Conversion(address indexed investor, uint256 pbkxValue, uint256 bkxValue);

  function PresaleConversion(address _pbkxAddress) {
    require(_pbkxAddress != address(0));
    pbkxAddress = _pbkxAddress;
  }

  function setBkxAddress(address _bkxAddress) onlyOwner {
    require(_bkxAddress != address(0));
    bkxContract = BankExToken(_bkxAddress);
  }

   /**
   * @dev Transfer tokens from BankEx presale contract balance to a specified address
   * @param to The address to transfer tokens to.
   * @param pbkxValue The amount of tokens to be transferred.
   * @return success/failure
   */
  function transferFromOwner(address to, uint256 pbkxValue) returns (bool success) {
    require(msg.sender == pbkxAddress);
    require(pbkxValue != 0);
    uint256 bkxValue = pbkxValue * multiplier;
    success = bkxContract.transfer(to, bkxValue);
    if (success) {
      Conversion(to, pbkxValue, bkxValue);
    }
    return success;
  }
}
