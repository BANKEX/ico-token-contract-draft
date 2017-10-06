pragma solidity ^0.4.11;

import "./BankExToken.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "zeppelin-solidity/contracts/math/Math.sol";

contract BankExCrowdsale is Ownable {

  struct Tranche {
    uint256 amountUpperBound;
    uint256 price;
  }

  // The token being sold
  BankExToken public token;

  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;

  // address where funds are collected
  address public bankexEtherWallet;

  // account that is authorized to:
  // - distribute tokens on behalf of investor without making Ether transfer
  // - register investors
  address public externalOracle;

  Tranche[] public tranches;
  uint256 public numberOfTranches;

  uint256 public minimumContributionInWei;

  uint256 public currentTrancheNumber = 0;
  uint256 public tokensSold = 0;
  uint256 public maxTokens = 0;

  bool public finalized = false;

  mapping(address => bool) public registered;

  /**
   * event for token purchase logging
   * @param investor who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed investor, uint256 value, uint256 amount);

  event ExternalOracleChanged(address indexed previousExternalOracle, address indexed newExternalOracle);

  /**
   * @dev Allows to be called by the external oracle account only.
   */
  modifier onlyExternalOracle() {
    require(msg.sender == externalOracle);
    _;
  }

  /**
   * @dev Allows the owner to change the external oracle account.
   * Can be used in case of emergency, e.g. the current external oracle is compromised.
   * @param newExternalOracle Address of the new external oracle account.
   */
  function changeExternalOracle(address newExternalOracle) public onlyOwner {
    require(newExternalOracle != address(0));
    ExternalOracleChanged(externalOracle, newExternalOracle);
    externalOracle = newExternalOracle;
  }

  function BankExCrowdsale(uint256[] _trancheAmounts, uint256[] _tranchePrices, uint256 _startTime, uint256 _endTime, address _presaleConversion, address _bankexEtherWallet, uint256 _minimumContributionInWei, address _externalOracle) {
    require(_trancheAmounts.length == _tranchePrices.length);
    numberOfTranches = _trancheAmounts.length;
    require(_startTime > now);
    require(_endTime > _startTime);
    require(_presaleConversion != address(0));
    require(_bankexEtherWallet != address(0));
    /*require(_minimumContributionInWei >= uint256(10) ** 15);*/
    require(_externalOracle != address(0));

    token = new BankExToken(_presaleConversion);
    startTime = _startTime;
    endTime = _endTime;
    bankexEtherWallet = _bankexEtherWallet;
    minimumContributionInWei = _minimumContributionInWei;
    externalOracle = _externalOracle;

    tranches.length = numberOfTranches;
    for(uint256 i = 0; i < numberOfTranches; i++) {
      maxTokens += _trancheAmounts[i];
      tranches[i].amountUpperBound = maxTokens;
      tranches[i].price = _tranchePrices[i];
    }
  }

  function calculatePurchase(uint256 value) private returns(uint256 purchase) {
    // TODO: safe math?
    purchase = 0;
    for (; currentTrancheNumber < numberOfTranches; currentTrancheNumber++) {
      Tranche storage currentTranche = tranches[currentTrancheNumber];
      uint256 leftInCurrentTranche = currentTranche.amountUpperBound - tokensSold;
      uint256 purchaseAtCurrentPrice = value / currentTranche.price; // truncated
      uint256 purchaseInCurrentTranche = Math.min256(purchaseAtCurrentPrice, leftInCurrentTranche);
      purchase += purchaseInCurrentTranche;
      tokensSold += purchaseInCurrentTranche;
      value -= purchaseInCurrentTranche * currentTranche.price;
      if (purchaseInCurrentTranche == purchaseAtCurrentPrice) {
        break;
      }
    }

    assert(tokensSold <= maxTokens);
    return purchase;
    // TODO: if (value > 0)
    // this m we have unspent ether. Either give the change, or give premial tokens
  }

  event Registration(address indexed investor, bool status);

  function register(address investor) public onlyExternalOracle {
    require(investor != address(0));
    require(!registered[investor]);
    registered[investor] = true;
    Registration(investor, true);
  }

  function () public payable {
    doPurchase(msg.sender, msg.value);
    bankexEtherWallet.transfer(msg.value);
  }

  function doExternalPurchase(address investor, uint256 value, uint256 receipt) public onlyExternalOracle {
    require(receipt != 0);
    doPurchase(investor, value);
  }

  function doPurchase(address investor, uint256 value) private {
    require(registered[investor]);
    require(value >= minimumContributionInWei);
    require(isRunning());

    uint256 tokens = calculatePurchase(value);
    assert(token.transfer(investor, tokens));
    TokenPurchase(investor, value, tokens);
  }

  function finalize() public { //TODO: why onlyOwner?
    require(!finalized);
    require(hasEnded());
    finalized = true;
    assert(token.transfer(bankexEtherWallet, token.balanceOf(this))); //TODO: which bankexEtherWallet?
    assert(token.unfreeze());
    // selfdestruct(bankexEtherWallet); // TODO: should we?
  }

  function isRunning() public constant returns (bool) {
    return now >= startTime && now <= endTime && tokensSold < maxTokens;
  }

  function hasEnded() public constant returns (bool) {
    return now > endTime || tokensSold == maxTokens;
  }
}
