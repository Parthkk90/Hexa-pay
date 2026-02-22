// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract CreditManager {
    struct CreditLine {
        uint256 collateralAmount;
        uint256 creditLimit;
        uint256 amountBorrowed;
        uint256 lastRepaymentTime;
        bool isActive;
        address nfcAuthorizedWallet;
    }

    IERC20 public immutable usdc;
    address public immutable owner;
    address public nfcBridge;

    mapping(address => CreditLine) public creditLines;
    mapping(address => uint256) public reputationScore;

    event CreditLineOpened(address indexed wallet, uint256 collateral, uint256 creditLimit);
    event PaymentExecuted(address indexed borrower, uint256 amount, uint256 totalBorrowed);
    event FirstUseTriggered(address indexed borrower, uint256 totalBorrowed, uint256 threshold);
    event Repayment(address indexed wallet, uint256 amount, uint256 newScore, uint256 newLimit);
    event CollateralWithdrawn(address indexed wallet, uint256 amount);
    event NfcBridgeUpdated(address indexed previousBridge, address indexed newBridge);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    modifier onlyAuthorizedExecutor() {
        require(msg.sender == nfcBridge || msg.sender == owner, "Not authorized");
        _;
    }

    constructor(address _usdc, address _nfcBridge) {
        require(_usdc != address(0), "invalid usdc");
        require(_nfcBridge != address(0), "invalid bridge");

        owner = msg.sender;
        usdc = IERC20(_usdc);
        nfcBridge = _nfcBridge;
    }

    function stakeCollateral(uint256 amount) external {
        _openCreditLine(msg.sender, amount);
    }

    function openCreditLine(uint256 amount) external {
        _openCreditLine(msg.sender, amount);
    }

    function executePayment(address borrower, uint256 amount) external onlyAuthorizedExecutor {
        require(amount > 0, "invalid amount");

        CreditLine storage credit = creditLines[borrower];
        require(credit.isActive, "credit line inactive");

        uint256 newBorrowed = credit.amountBorrowed + amount;
        require(newBorrowed <= credit.creditLimit, "credit limit exceeded");

        uint256 threshold = (credit.creditLimit * 30) / 100;
        if (credit.amountBorrowed < threshold && newBorrowed >= threshold) {
            emit FirstUseTriggered(borrower, newBorrowed, threshold);
        }

        credit.amountBorrowed = newBorrowed;
        emit PaymentExecuted(borrower, amount, newBorrowed);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "invalid amount");

        CreditLine storage credit = creditLines[msg.sender];
        require(credit.isActive, "credit line inactive");
        require(amount <= credit.amountBorrowed, "repay too much");

        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "repayment transfer failed");

        credit.amountBorrowed -= amount;
        _updateReputationOnRepay(msg.sender, credit);

        credit.lastRepaymentTime = block.timestamp;
        credit.creditLimit = _calculateCreditLimit(credit.collateralAmount, reputationScore[msg.sender]);

        emit Repayment(msg.sender, amount, reputationScore[msg.sender], credit.creditLimit);
    }

    function withdrawCollateral() external {
        CreditLine memory credit = creditLines[msg.sender];
        require(credit.isActive, "credit line inactive");
        require(credit.amountBorrowed == 0, "outstanding debt");

        delete creditLines[msg.sender];

        bool success = usdc.transfer(msg.sender, credit.collateralAmount);
        require(success, "withdraw transfer failed");

        emit CollateralWithdrawn(msg.sender, credit.collateralAmount);
    }

    function setNfcBridge(address bridge) external onlyOwner {
        require(bridge != address(0), "invalid bridge");
        address previousBridge = nfcBridge;
        nfcBridge = bridge;
        emit NfcBridgeUpdated(previousBridge, bridge);
    }

    function getCredit(address wallet)
        external
        view
        returns (
            uint256 collateralAmount,
            uint256 creditLimit,
            uint256 amountBorrowed,
            uint256 availableCredit,
            uint256 score,
            bool isActive,
            uint256 lastRepaymentTime
        )
    {
        CreditLine memory credit = creditLines[wallet];

        collateralAmount = credit.collateralAmount;
        creditLimit = credit.creditLimit;
        amountBorrowed = credit.amountBorrowed;
        availableCredit = credit.creditLimit > credit.amountBorrowed ? credit.creditLimit - credit.amountBorrowed : 0;
        score = reputationScore[wallet];
        isActive = credit.isActive;
        lastRepaymentTime = credit.lastRepaymentTime;
    }

    function _openCreditLine(address wallet, uint256 amount) internal {
        require(amount > 0, "amount must be > 0");

        CreditLine storage existingCredit = creditLines[wallet];
        require(!existingCredit.isActive, "credit line already active");

        bool success = usdc.transferFrom(wallet, address(this), amount);
        require(success, "collateral transfer failed");

        uint256 initialLimit = _calculateCreditLimit(amount, reputationScore[wallet]);
        creditLines[wallet] = CreditLine({
            collateralAmount: amount,
            creditLimit: initialLimit,
            amountBorrowed: 0,
            lastRepaymentTime: 0,
            isActive: true,
            nfcAuthorizedWallet: wallet
        });

        emit CreditLineOpened(wallet, amount, initialLimit);
    }

    function _calculateCreditLimit(uint256 collateralAmount, uint256 score) internal pure returns (uint256) {
        uint256 ltv = 80;

        if (score >= 100) {
            ltv = 100;
        } else if (score >= 50) {
            ltv = 95;
        } else if (score >= 25) {
            ltv = 90;
        } else if (score >= 10) {
            ltv = 85;
        }

        return (collateralAmount * ltv) / 100;
    }

    function _updateReputationOnRepay(address wallet, CreditLine memory credit) internal {
        if (credit.lastRepaymentTime != 0 && block.timestamp > credit.lastRepaymentTime + 30 days) {
            uint256 currentScore = reputationScore[wallet];
            reputationScore[wallet] = currentScore > 10 ? currentScore - 10 : 0;
            return;
        }

        reputationScore[wallet] += 5;
    }
}
