pragma solidity ^0.4.11;

// import 'zeppelin-solidity\contracts\math\SafeMath.sol';

library SafeMath {
  function mul(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a * b;
    assert(a == 0 || c / a == b);
    return c;
  }

  function div(uint256 a, uint256 b) internal constant returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  function sub(uint256 a, uint256 b) internal constant returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  function add(uint256 a, uint256 b) internal constant returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract BKXToken {
    using SafeMath for uint256;

    //global definisions

    enum ICOStateEnum {NotStarted, Started, Refunded, Successful}


    address public owner = msg.sender;

    bool public unlocked = false;
    bool public halted = false;

    uint256 public totalSupply = 0;
    uint256 public minAmountToSend = 5*(10**16); // 0.05 ETH

    uint256 public ICOstart;
    uint256 public ICOend;
    uint256 public ICOgoal;
    uint256 public ICOcollected = 0;
    // uint256 public ICOcap = 300000 ether;
    uint256 public ICOcap = 0;
    ICOStateEnum public ICOstate = ICOStateEnum.NotStarted;

    uint256 public constant decimals = 9;
    uint256 public constant DECIMAL_MULTIPLIER = 10**decimals;


    uint256[] public ICOrates;
    uint256[] public ICOcoinsLeft;

    mapping(address => uint256) weiForRefund;
    mapping(address => uint256) weiToRecover;


    function advanceState() returns (bool success) {
        transitionState();
        return true;
    }

    function transitionState() internal {
        if (ICOstart != 0 && ICOend != 0 && ICOgoal != 0) {
            if (now >= ICOstart) {
                if (ICOstate == ICOStateEnum.NotStarted) {
                    ICOstate = ICOStateEnum.Started;
                }
                if (ICOcap > 0 && ICOcollected >= ICOcap) {
                    ICOstate = ICOStateEnum.Successful;
                }
            } if (now >= ICOend) {
                if (ICOstate == ICOStateEnum.Started) {
                    if (ICOcollected >= ICOgoal) {
                        ICOstate = ICOStateEnum.Successful;
                    } else {
                        ICOstate = ICOStateEnum.Refunded;
                    }
                }
            }
        }
    }

    modifier stateTransition() {
        transitionState();
        _;
        transitionState();
    }


    modifier requireICOState(ICOStateEnum _state) {
        require(ICOstate == _state);
        _;
    }


    modifier timeLocked() {
        require(unlocked);
        _;
    }

    modifier notHalted() {
        require(!halted);
        _;
    }

    function unlockAfterSuccess() stateTransition returns (bool success) {
        require(ICOstate == ICOStateEnum.Successful);
        require(now >= ICOend);
        unlocked = true;
        return true;
    }

    // Ownership

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner {
        require(newOwner != address(0));
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }


    // ERC20 related functions

    mapping(address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;


    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Purchased(address indexed _from, uint256 _value);

    function transfer(address _to, uint256 _value) timeLocked returns (bool) {
        require(_to != address(0));
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }


    function transferFrom(address _from, address _to, uint256 _value) timeLocked returns (bool) {
        require(_to != address(0));
        var _allowance = allowed[_from][msg.sender];
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = _allowance.sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) timeLocked returns (bool) {
        require((_value == 0) || (allowed[msg.sender][_spender] == 0));
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function increaseApproval (address _spender, uint _addedValue) timeLocked
        returns (bool success) {
            allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
            Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
            return true;
    }

    function decreaseApproval (address _spender, uint _subtractedValue) timeLocked
        returns (bool success) {
            uint oldValue = allowed[msg.sender][_spender];
            if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
            } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
            }
            Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
            return true;
    }



    function BKXToken (uint _ICOstart, uint _ICOend, uint _ICOgoal) {
        require(_ICOstart > now);
        require(_ICOend > _ICOstart);
        require(_ICOgoal > 0);
        ICOstart = _ICOstart;
        ICOend = _ICOend;
        ICOgoal = _ICOgoal;
    }

    function setConverter (address _converterAddress, uint256 _allowedAmount) onlyOwner  returns (bool success) {
        require(_converterAddress != address(0));
        balances[_converterAddress] = _allowedAmount;
        return true;
    }

    function setICOparameters (uint _ICOstart, uint _ICOend, uint _ICOgoal) onlyOwner requireICOState(ICOStateEnum.NotStarted) returns (bool success) {
        require(_ICOstart > now);
        require(_ICOend > _ICOstart);
        require(_ICOgoal > 0);
        ICOstart = _ICOstart;
        ICOend = _ICOend;
        ICOgoal = _ICOgoal;
        return true;
    }

    function setICOrates (uint _rate, uint _numCoins) onlyOwner requireICOState(ICOStateEnum.NotStarted) returns (bool success) {
        require(_rate > 0);
        require(_numCoins > 0);
        ICOrates.push(_rate);
        ICOcoinsLeft.push(_numCoins);
        totalSupply = totalSupply.add(_numCoins);
        return true;
    }

    function resetICOrates () onlyOwner requireICOState(ICOStateEnum.NotStarted) returns (bool success) {
        ICOrates.length = 0;
        ICOcoinsLeft.length = 0;
        totalSupply = 0;
        return true;
    }

    function ICOratesLength () constant returns (uint len) {
        return ICOrates.length;
    }

    function () payable stateTransition notHalted {
        if (ICOstate == ICOStateEnum.Started) {
            assert(buy());
        } else {
            revert();
        }
    }


    function transferICOCollected() onlyOwner stateTransition notHalted returns (bool success) {
        require(ICOstate == ICOStateEnum.Successful);
        owner.transfer(ICOcollected);
        return true;
    }

    function setHalt(bool _halt) onlyOwner returns (bool success) {
        halted = _halt;
        return true;
    }


    function calculateAmountBought(uint256 _weisSent) internal returns (uint256 _tokensToBuy, uint256 _weisLeft) {
        uint256 value = _weisSent;
        uint256 totalPurchased = 0;
        for (uint8 i = 0; i < ICOrates.length; i++) {
            if (ICOcoinsLeft[i] == 0) {
                continue;
            }
            uint256 rate = ICOrates[i];
            uint256 forThisRate = value.div(rate);
            if (forThisRate == 0) {
                break;
            }
            if (forThisRate > ICOcoinsLeft[i]) {
                forThisRate = ICOcoinsLeft[i];
                ICOcoinsLeft[i] = 0;
            } else {
                ICOcoinsLeft[i] = ICOcoinsLeft[i].sub(forThisRate);
            }
            uint256 consumed = forThisRate.mul(rate);
            value = value.sub(consumed);
            totalPurchased = totalPurchased.add(forThisRate);
        }
        totalPurchased = totalPurchased.mul(DECIMAL_MULTIPLIER);
        return (totalPurchased, value);

    }

    function buy() internal notHalted returns (bool success) {
        require(ICOrates.length > 0 && ICOcoinsLeft.length > 0 && ICOrates.length == ICOcoinsLeft.length);
        uint256 weisSent = msg.value;
        address _for = msg.sender;
        var (tokensBought, fundsLeft) = calculateAmountBought(weisSent);
        uint256 totalSpent = weisSent.sub(fundsLeft);
        balances[_for] = balances[_for].add(tokensBought);
        weiForRefund[_for] = weiForRefund[_for].add(totalSpent);
        weiToRecover[_for] = weiToRecover[_for].add(fundsLeft);
        Purchased(_for, tokensBought);
        ICOcollected = ICOcollected.add(totalSpent);
        return true;
    }

    function recoverLeftovers() stateTransition notHalted returns (bool success) {
        require(ICOstate != ICOStateEnum.NotStarted);
        uint256 value = weiToRecover[msg.sender];
        delete weiToRecover[msg.sender];
        msg.sender.transfer(value);
        return true;
    }

    function refund() stateTransition requireICOState(ICOStateEnum.Refunded) notHalted returns (bool success) {
        uint256 value = weiForRefund[msg.sender];
        delete weiForRefund[msg.sender];
        msg.sender.transfer(value);
        return true;
    }

    function burn(){

    }

}
