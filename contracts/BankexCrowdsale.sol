pragma solidity ^0.4.11;


import "./BankexToken.sol";
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "zeppelin-solidity/contracts/math/Math.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title BankexCrowdsale
 * @dev BankexCrowdsale distributes BANKEX tokens (BKX).
 *
 * The amount of tokens offered for the crowdsale is transferred to the crowdsale contract at the instantiation time.
 *
 * The tokens are sold in tranches, each tranche comprising a fixed amount of tokens at a fixed price.
 * After all the tokens in a tranche are sold out, the next tranche becomes active.
 *
 * The crowdsale starts at the specified timestamp and ends when either the specified timestamp is reached or all the tokens are sold.
 * In the former case undistributed tokens are transferred back to BANKEX.
 *
 * The crowdsale contract interoperates with the External Oracle account that is a BANKEX service authorized to:
 * 1. Distribute tokens on behalf of investor without making direct Ether transfer to the crowdsale contract.
 * 2. Register investors.
 *
 * Tokens can be purchased in 2 ways:
 * 1. By an investor via a direct Ether transfer to the crowdsale contract.
 *    The funds are instantly forwarded to the BANKEX-controlled address, and the corresponding amount of tokens is transferred from the crowdsale contract to the sender's address.
 *    To prove that the Ether collected is not used to purchase BKX tokens, BANKEX can use a time lock wallet to recieve the funds, or just avoid spending from the address.
 *    As the cost of a token subunit is intended to be orders of magnitude smaller than the cost of Ether transfer (and also for security reasons), the change isn't returned.
 *    The investor who purchases the last available tokens will be refunded manually.
 * 2. By the External Oracle account on behalf of an investor, who has purchased the tokens via non-Ether payment.
 *    In this case no Ether is collected by the contract, so the External Oracle specifies the address to transfer tokens to and the Ether equivalent of the purchase using its exchange rate, but without explicit conversion.
 *    It should also provide some kind of a receipt that will be stored on the Ethereum blockchain and can later be used to prove that the funds were actually transferred to BANKEX (e.g. BTC transaction hash).
 * In any case only registered investors can take part in the crowdsale, and the purchase amount should be greater than the specified minimum.
 */
contract BankexCrowdsale is Ownable {
    using SafeMath for uint256;

    // BANKEX token contract (the token being offered at the crowdsale).
    // Is instantiated by the BankexCrowdsale contract at the construction time.
    BankexToken public token;

    // UNIX timestamp after which investments are allowed (inclusive).
    uint256 public startTime;
    // UNIX timestamp until which investments are allowed (inclusive).
    uint256 public endTime;

    // Address where the Ether collected during the crowdsale is transfered to.
    address public bankexEtherWallet;
    // Address where undistributed tokens are transfered to after the crowdsale ends.
    address public bankexTokenWallet;

    // Number of tokens in token subunits offered at the crowdsale.
    uint256 public maxTokens = 0;

    // Minimum investment possible in wei.
    uint256 public minimumContributionInWei;

    // Account that is authorized to:
    // 1. Distribute tokens on behalf of investor
    //    without making direct Ether transfer to the crowdsale contract.
    // 2. Register investors.
    address public externalOracle;

    // Set of addresses that are allowed to take part in the crowdsale.
    mapping (address => bool) public registered;

    // Flag that guarantees that the crowdsale can be finalized once only.
    bool public finalized = false;

    // Number of tokens in token subunits that has been distributed at the crowdsale.
    uint256 public tokensSold = 0;

    struct Tranche {
    // Upper bound (inclusive) in token subunits for this tranche.
    // A tranche i is active while tranches[i-1].amountUpperBound < tokensSold <= tranches[i].amountUpperBound.
    uint256 amountUpperBound;
    // Price in wei for a token subunit for this tranche.
    uint256 price;
    }

    // Array of tranches.
    Tranche[] public tranches;

    // Length of the tranches array.
    uint256 public numberOfTranches;

    // Index of the active tranche in the tranches array.
    uint256 public currentTrancheNumber = 0;

    /**
     * event for token purchase logging
     * @param investor who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed investor, uint256 value, uint256 amount);

    event ExternalOracleChanged(address indexed previousExternalOracle, address indexed newExternalOracle);

    event Finalized(uint256 tokensSold);

    event Registration(address indexed investor, bool status);

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

    function BankexCrowdsale(
    uint256[] _trancheAmounts,
    uint256[] _tranchePrices,
    uint256 _startTime,
    uint256 _endTime,
    address _presaleConversion,
    address _bankexEtherWallet,
    address _bankexTokenWallet,
    uint256 _minimumContributionInWei,
    address _externalOracle
    ) {
        require(_trancheAmounts.length == _tranchePrices.length);
        require(_trancheAmounts.length > 0);
        require(_startTime > now);
        require(_endTime > _startTime);
        require(_presaleConversion != address(0));
        require(_bankexEtherWallet != address(0));
        require(_bankexTokenWallet != address(0));
        require(_externalOracle != address(0));

        startTime = _startTime;
        endTime = _endTime;
        bankexEtherWallet = _bankexEtherWallet;
        bankexTokenWallet = _bankexTokenWallet;
        minimumContributionInWei = _minimumContributionInWei;
        externalOracle = _externalOracle;

        numberOfTranches = _trancheAmounts.length;
        tranches.length = numberOfTranches;
        for (uint256 i = 0; i < numberOfTranches; i++) {
            maxTokens = maxTokens.add(_trancheAmounts[i]);
            tranches[i].amountUpperBound = maxTokens;
            tranches[i].price = _tranchePrices[i];
        }

        token = new BankexToken(_bankexTokenWallet, _presaleConversion, maxTokens);
    }

    function register(address investor) public onlyExternalOracle {
        require(investor != address(0));
        require(!registered[investor]);
        registered[investor] = true;
        Registration(investor, true);
    }

    function() public payable {
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

    function calculatePurchase(uint256 value) private returns (uint256 purchase) {
        purchase = 0;
        for (; currentTrancheNumber < numberOfTranches; currentTrancheNumber++) {
            Tranche storage currentTranche = tranches[currentTrancheNumber];
            uint256 leftInCurrentTranche = currentTranche.amountUpperBound.sub(tokensSold);
            uint256 purchaseAtCurrentPrice = value.div(currentTranche.price);
            // truncated
            uint256 purchaseInCurrentTranche = Math.min256(purchaseAtCurrentPrice, leftInCurrentTranche);
            purchase = purchase.add(purchaseInCurrentTranche);
            tokensSold = tokensSold.add(purchaseInCurrentTranche);
            uint256 purchaseWei = purchaseInCurrentTranche.mul(currentTranche.price);
            value = value.sub(purchaseWei);
            if (purchaseInCurrentTranche == purchaseAtCurrentPrice) {
                break;
            }
        }

        assert(tokensSold <= maxTokens);
        return purchase;
    }

    /**
     * @dev Transfers undistributed tokens from the crowdsale contract back to BANKEX.
     * Can be called:
     * - only by the crowdsale contract owner
     * - only after the crowdsale has ended (either end time is reached or all tokens has been distributed)
     * - only once
     */
    function finalize() public onlyOwner {
        require(!finalized);
        require(hasEnded());
        finalized = true;
        assert(token.transfer(bankexTokenWallet, token.balanceOf(this)));
        Finalized(tokensSold);
    }

    // @dev Transfers the Ether from the crowdsale contract balance to the BANKEX wallet and terminates the contract.
    function destroy() public onlyOwner {
        selfdestruct(bankexEtherWallet);
    }

    // @return true if the crowdsale is running.
    function isRunning() public constant returns (bool) {
        return now >= startTime && now <= endTime && tokensSold < maxTokens;
    }

    // @return true if the crowdsale has ended.
    function hasEnded() public constant returns (bool) {
        return now > endTime || tokensSold >= maxTokens;
    }
}
