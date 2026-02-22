import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditManager, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CreditManager", function () {
  let creditManager: CreditManager;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let nfcBridge: SignerWithAddress;
  let borrower: SignerWithAddress;
  let merchant: SignerWithAddress;
  let otherUser: SignerWithAddress;

  const INITIAL_BALANCE = ethers.parseUnits("10000", 6); // 10,000 USDC
  const COLLATERAL_AMOUNT = ethers.parseUnits("1000", 6); // 1,000 USDC

  beforeEach(async function () {
    [owner, nfcBridge, borrower, merchant, otherUser] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();

    // Deploy CreditManager
    const CreditManagerFactory = await ethers.getContractFactory("CreditManager");
    creditManager = await CreditManagerFactory.deploy(
      await usdc.getAddress(),
      nfcBridge.address
    );

    // Mint USDC to borrower and approve CreditManager
    await usdc.mint(borrower.address, INITIAL_BALANCE);
    await usdc.connect(borrower).approve(await creditManager.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set correct owner", async function () {
      expect(await creditManager.owner()).to.equal(owner.address);
    });

    it("Should set correct USDC address", async function () {
      expect(await creditManager.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set correct NFC bridge address", async function () {
      expect(await creditManager.nfcBridge()).to.equal(nfcBridge.address);
    });

    it("Should revert with invalid USDC address", async function () {
      const CreditManagerFactory = await ethers.getContractFactory("CreditManager");
      await expect(
        CreditManagerFactory.deploy(ethers.ZeroAddress, nfcBridge.address)
      ).to.be.revertedWith("invalid usdc");
    });

    it("Should revert with invalid bridge address", async function () {
      const CreditManagerFactory = await ethers.getContractFactory("CreditManager");
      await expect(
        CreditManagerFactory.deploy(await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("invalid bridge");
    });
  });

  describe("Opening Credit Lines", function () {
    it("Should open credit line with stakeCollateral", async function () {
      await expect(creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT))
        .to.emit(creditManager, "CreditLineOpened")
        .withArgs(borrower.address, COLLATERAL_AMOUNT, ethers.parseUnits("800", 6)); // 80% LTV

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.collateralAmount).to.equal(COLLATERAL_AMOUNT);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("800", 6)); // 80% of 1000
      expect(credit.amountBorrowed).to.equal(0);
      expect(credit.isActive).to.equal(true);
      expect(credit.score).to.equal(0); // Initial reputation
    });

    it("Should open credit line with openCreditLine", async function () {
      await expect(creditManager.connect(borrower).openCreditLine(COLLATERAL_AMOUNT))
        .to.emit(creditManager, "CreditLineOpened");

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.isActive).to.equal(true);
    });

    it("Should transfer collateral to contract", async function () {
      const contractBalanceBefore = await usdc.balanceOf(await creditManager.getAddress());
      const borrowerBalanceBefore = await usdc.balanceOf(borrower.address);

      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);

      expect(await usdc.balanceOf(await creditManager.getAddress())).to.equal(
        contractBalanceBefore + COLLATERAL_AMOUNT
      );
      expect(await usdc.balanceOf(borrower.address)).to.equal(
        borrowerBalanceBefore - COLLATERAL_AMOUNT
      );
    });

    it("Should revert when opening with zero amount", async function () {
      await expect(
        creditManager.connect(borrower).stakeCollateral(0)
      ).to.be.revertedWith("amount must be > 0");
    });

    it("Should revert when credit line already exists", async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);

      await expect(
        creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT)
      ).to.be.revertedWith("credit line already active");
    });

    it("Should revert when insufficient USDC balance", async function () {
      const largeAmount = ethers.parseUnits("20000", 6);
      await expect(
        creditManager.connect(borrower).stakeCollateral(largeAmount)
      ).to.be.revertedWith("insufficient balance");
    });
  });

  describe("Reputation System & LTV Tiers", function () {
    beforeEach(async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
    });

    it("Should start with 80% LTV (score 0)", async function () {
      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("800", 6));
      expect(credit.score).to.equal(0);
    });

    it("Should increase to 85% LTV at score 10", async function () {
      // Repay twice to get score to 10
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("100", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("100", 6));
      await creditManager.connect(borrower).repay(ethers.parseUnits("50", 6)); // score +5
      await creditManager.connect(borrower).repay(ethers.parseUnits("50", 6)); // score +5 = 10

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(10);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("850", 6)); // 85% of 1000
    });

    it("Should increase to 90% LTV at score 25", async function () {
      // Repay 5 times to get score to 25
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("250", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("250", 6));
      
      for (let i = 0; i < 5; i++) {
        await creditManager.connect(borrower).repay(ethers.parseUnits("50", 6));
      }

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(25);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("900", 6)); // 90% of 1000
    });

    it("Should increase to 95% LTV at score 50", async function () {
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("500", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("500", 6));
      
      for (let i = 0; i < 10; i++) {
        await creditManager.connect(borrower).repay(ethers.parseUnits("50", 6));
      }

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(50);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("950", 6)); // 95% of 1000
    });

    it("Should increase to 100% LTV at score 100", async function () {
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("500", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("1000", 6));
      
      for (let i = 0; i < 20; i++) {
        await creditManager.connect(borrower).repay(ethers.parseUnits("25", 6));
      }

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(100);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("1000", 6)); // 100% of 1000
    });

    it("Should decrease reputation on late repayment (>30 days)", async function () {
      // Build up reputation
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("300", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("300", 6));
      
      for (let i = 0; i < 6; i++) {
        await creditManager.connect(borrower).repay(ethers.parseUnits("50", 6));
      }

      let credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(30);

      // Borrow more and wait 31 days
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("100", 6));
      await time.increase(31 * 24 * 60 * 60);

      // Repay after 30 days - should decrease reputation
      await usdc.mint(borrower.address, ethers.parseUnits("100", 6));
      await creditManager.connect(borrower).repay(ethers.parseUnits("100", 6));

      credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(20); // 30 - 10 = 20
    });

    it("Should not go below 0 reputation", async function () {
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("100", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("100", 6));
      
      // Get score to 5
      await creditManager.connect(borrower).repay(ethers.parseUnits("100", 6));

      // Fast forward and repay late
      await time.increase(31 * 24 * 60 * 60);
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("10", 6));
      await usdc.mint(borrower.address, ethers.parseUnits("10", 6));
      await creditManager.connect(borrower).repay(ethers.parseUnits("10", 6));

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.score).to.equal(0); // Should be 0, not negative
    });
  });

  describe("NFC Payment Execution", function () {
    beforeEach(async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
    });

    it("Should execute payment via NFC bridge", async function () {
      const paymentAmount = ethers.parseUnits("50", 6);

      await expect(
        creditManager.connect(nfcBridge).executePayment(borrower.address, paymentAmount)
      )
        .to.emit(creditManager, "PaymentExecuted")
        .withArgs(borrower.address, paymentAmount, paymentAmount);

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(paymentAmount);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("750", 6)); // 800 - 50
    });

    it("Should allow owner to execute payments", async function () {
      const paymentAmount = ethers.parseUnits("100", 6);

      await expect(
        creditManager.connect(owner).executePayment(borrower.address, paymentAmount)
      ).to.emit(creditManager, "PaymentExecuted");

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(paymentAmount);
    });

    it("Should revert when unauthorized user tries to execute payment", async function () {
      const paymentAmount = ethers.parseUnits("50", 6);

      await expect(
        creditManager.connect(otherUser).executePayment(borrower.address, paymentAmount)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert when payment amount is zero", async function () {
      await expect(
        creditManager.connect(nfcBridge).executePayment(borrower.address, 0)
      ).to.be.revertedWith("invalid amount");
    });

    it("Should revert when credit line is inactive", async function () {
      await expect(
        creditManager.connect(nfcBridge).executePayment(otherUser.address, ethers.parseUnits("50", 6))
      ).to.be.revertedWith("credit line inactive");
    });

    it("Should revert when exceeding credit limit", async function () {
      const largeAmount = ethers.parseUnits("900", 6); // More than 800 limit

      await expect(
        creditManager.connect(nfcBridge).executePayment(borrower.address, largeAmount)
      ).to.be.revertedWith("credit limit exceeded");
    });

    it("Should allow multiple payments up to limit", async function () {
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("200", 6));
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("300", 6));
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("100", 6));

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("600", 6));
      expect(credit.availableCredit).to.equal(ethers.parseUnits("200", 6));
    });

    it("Should emit FirstUseTriggered when crossing 30% threshold", async function () {
      const creditLimit = ethers.parseUnits("800", 6);
      const threshold = ethers.parseUnits("240", 6); // 30% of 800

      // Payment just under threshold - no event
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("200", 6));

      // Payment crossing threshold - should emit event
      await expect(
        creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("50", 6))
      )
        .to.emit(creditManager, "FirstUseTriggered")
        .withArgs(borrower.address, ethers.parseUnits("250", 6), threshold);
    });

    it("Should not emit FirstUseTriggered on second crossing", async function () {
      // Cross threshold
      await creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("300", 6));

      // Additional payment should not trigger event again
      await expect(
        creditManager.connect(nfcBridge).executePayment(borrower.address, ethers.parseUnits("100", 6))
      ).to.not.emit(creditManager, "FirstUseTriggered");
    });
  });

  describe("Repayment", function () {
    const paymentAmount = ethers.parseUnits("500", 6);

    beforeEach(async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
      await creditManager.connect(nfcBridge).executePayment(borrower.address, paymentAmount);
    });

    it("Should repay borrowed amount successfully", async function () {
      const repayAmount = ethers.parseUnits("100", 6);

      await expect(creditManager.connect(borrower).repay(repayAmount))
        .to.emit(creditManager, "Repayment")
        .withArgs(borrower.address, repayAmount, 5, ethers.parseUnits("800", 6));

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(paymentAmount - repayAmount);
      expect(credit.score).to.equal(5); // +5 for repayment
    });

    it("Should transfer USDC from borrower to contract", async function () {
      const repayAmount = ethers.parseUnits("100", 6);
      const contractBalanceBefore = await usdc.balanceOf(await creditManager.getAddress());
      const borrowerBalanceBefore = await usdc.balanceOf(borrower.address);

      await creditManager.connect(borrower).repay(repayAmount);

      expect(await usdc.balanceOf(await creditManager.getAddress())).to.equal(
        contractBalanceBefore + repayAmount
      );
      expect(await usdc.balanceOf(borrower.address)).to.equal(
        borrowerBalanceBefore - repayAmount
      );
    });

    it("Should update lastRepaymentTime", async function () {
      const repayAmount = ethers.parseUnits("100", 6);
      const timeBefore = await time.latest();

      await creditManager.connect(borrower).repay(repayAmount);

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.lastRepaymentTime).to.be.greaterThan(timeBefore);
    });

    it("Should allow full repayment", async function () {
      await creditManager.connect(borrower).repay(paymentAmount);

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(0);
      expect(credit.availableCredit).to.equal(credit.creditLimit);
    });

    it("Should revert when repaying zero amount", async function () {
      await expect(creditManager.connect(borrower).repay(0)).to.be.revertedWith(
        "invalid amount"
      );
    });

    it("Should revert when credit line is inactive", async function () {
      await expect(
        creditManager.connect(otherUser).repay(ethers.parseUnits("100", 6))
      ).to.be.revertedWith("credit line inactive");
    });

    it("Should revert when repaying more than borrowed", async function () {
      const tooMuch = paymentAmount + ethers.parseUnits("1", 6);

      await expect(creditManager.connect(borrower).repay(tooMuch)).to.be.revertedWith(
        "repay too much"
      );
    });

    it("Should increase credit limit with better reputation", async function () {
      // Multiple repayments to build reputation
      await usdc.mint(borrower.address, ethers.parseUnits("500", 6));

      await creditManager.connect(borrower).repay(ethers.parseUnits("100", 6)); // score 5
      const credit1 = await creditManager.getCredit(borrower.address);
      expect(credit1.score).to.equal(5);
      expect(credit1.creditLimit).to.equal(ethers.parseUnits("800", 6)); // Still 80%

      await creditManager.connect(borrower).repay(ethers.parseUnits("100", 6)); // score 10
      const credit2 = await creditManager.getCredit(borrower.address);
      expect(credit2.score).to.equal(10);
      expect(credit2.creditLimit).to.equal(ethers.parseUnits("850", 6)); // Now 85%
    });
  });

  describe("Collateral Withdrawal", function () {
    beforeEach(async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
    });

    it("Should withdraw collateral when no debt", async function () {
      const borrowerBalanceBefore = await usdc.balanceOf(borrower.address);

      await expect(creditManager.connect(borrower).withdrawCollateral())
        .to.emit(creditManager, "CollateralWithdrawn")
        .withArgs(borrower.address, COLLATERAL_AMOUNT);

      expect(await usdc.balanceOf(borrower.address)).to.equal(
        borrowerBalanceBefore + COLLATERAL_AMOUNT
      );

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.isActive).to.equal(false);
      expect(credit.collateralAmount).to.equal(0);
    });

    it("Should revert when withdrawing with outstanding debt", async function () {
      await creditManager.connect(nfcBridge).executePayment(
        borrower.address,
        ethers.parseUnits("100", 6)
      );

      await expect(creditManager.connect(borrower).withdrawCollateral()).to.be.revertedWith(
        "outstanding debt"
      );
    });

    it("Should revert when credit line is inactive", async function () {
      await expect(creditManager.connect(otherUser).withdrawCollateral()).to.be.revertedWith(
        "credit line inactive"
      );
    });

    it("Should allow withdrawal after full repayment", async function () {
      const paymentAmount = ethers.parseUnits("500", 6);
      await creditManager.connect(nfcBridge).executePayment(borrower.address, paymentAmount);
      
      await usdc.mint(borrower.address, paymentAmount);
      await creditManager.connect(borrower).repay(paymentAmount);

      await creditManager.connect(borrower).withdrawCollateral();

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.isActive).to.equal(false);
    });
  });

  describe("NFC Bridge Management", function () {
    it("Should allow owner to update NFC bridge", async function () {
      await expect(creditManager.connect(owner).setNfcBridge(otherUser.address))
        .to.emit(creditManager, "NfcBridgeUpdated")
        .withArgs(nfcBridge.address, otherUser.address);

      expect(await creditManager.nfcBridge()).to.equal(otherUser.address);
    });

    it("Should revert when non-owner tries to update bridge", async function () {
      await expect(
        creditManager.connect(borrower).setNfcBridge(otherUser.address)
      ).to.be.revertedWith("owner only");
    });

    it("Should revert when setting bridge to zero address", async function () {
      await expect(
        creditManager.connect(owner).setNfcBridge(ethers.ZeroAddress)
      ).to.be.revertedWith("invalid bridge");
    });

    it("Should allow new bridge to execute payments", async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
      await creditManager.connect(owner).setNfcBridge(otherUser.address);

      await expect(
        creditManager.connect(otherUser).executePayment(
          borrower.address,
          ethers.parseUnits("100", 6)
        )
      ).to.emit(creditManager, "PaymentExecuted");
    });

    it("Should prevent old bridge from executing payments", async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
      await creditManager.connect(owner).setNfcBridge(otherUser.address);

      await expect(
        creditManager.connect(nfcBridge).executePayment(
          borrower.address,
          ethers.parseUnits("100", 6)
        )
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Credit View Function", function () {
    beforeEach(async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
    });

    it("Should return correct credit data", async function () {
      const credit = await creditManager.getCredit(borrower.address);

      expect(credit.collateralAmount).to.equal(COLLATERAL_AMOUNT);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("800", 6));
      expect(credit.amountBorrowed).to.equal(0);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("800", 6));
      expect(credit.score).to.equal(0);
      expect(credit.isActive).to.equal(true);
      expect(credit.lastRepaymentTime).to.equal(0);
    });

    it("Should calculate available credit correctly", async function () {
      await creditManager.connect(nfcBridge).executePayment(
        borrower.address,
        ethers.parseUnits("300", 6)
      );

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("500", 6)); // 800 - 300
    });

    it("Should return zero for non-existent credit line", async function () {
      const credit = await creditManager.getCredit(otherUser.address);

      expect(credit.collateralAmount).to.equal(0);
      expect(credit.creditLimit).to.equal(0);
      expect(credit.isActive).to.equal(false);
    });
  });

  describe("Edge Cases & Integration Tests", function () {
    it("Should handle complete lifecycle: stake → borrow → repay → withdraw", async function () {
      // 1. Stake collateral
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);
      let credit = await creditManager.getCredit(borrower.address);
      expect(credit.isActive).to.equal(true);

      // 2. Execute payments (simulating NFC payments)
      await creditManager.connect(nfcBridge).executePayment(
        borrower.address,
        ethers.parseUnits("100", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        borrower.address,
        ethers.parseUnits("200", 6)
      );
      credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("300", 6));

      // 3. Repay in parts
      await usdc.mint(borrower.address, ethers.parseUnits("300", 6));
      await creditManager.connect(borrower).repay(ethers.parseUnits("150", 6));
      await creditManager.connect(borrower).repay(ethers.parseUnits("150", 6));
      credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(0);
      expect(credit.score).to.equal(10); // 2 repayments = +10

      // 4. Withdraw collateral
      await creditManager.connect(borrower).withdrawCollateral();
      credit = await creditManager.getCredit(borrower.address);
      expect(credit.isActive).to.equal(false);
    });

    it("Should handle maximum credit utilization", async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);

      // Use entire credit limit
      await creditManager.connect(nfcBridge).executePayment(
        borrower.address,
        ethers.parseUnits("800", 6)
      );

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("800", 6));
      expect(credit.availableCredit).to.equal(0);

      // Should not allow any more payments
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          borrower.address,
          ethers.parseUnits("1", 6)
        )
      ).to.be.revertedWith("credit limit exceeded");
    });

    it("Should handle micropayments", async function () {
      await creditManager.connect(borrower).stakeCollateral(COLLATERAL_AMOUNT);

      // Execute many small payments
      for (let i = 0; i < 10; i++) {
        await creditManager.connect(nfcBridge).executePayment(
          borrower.address,
          ethers.parseUnits("1", 6)
        );
      }

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("10", 6));
    });

    it("Should handle large collateral amounts", async function () {
      const largeCollateral = ethers.parseUnits("100000", 6); // 100,000 USDC
      await usdc.mint(borrower.address, largeCollateral);
      await usdc.connect(borrower).approve(await creditManager.getAddress(), largeCollateral);

      await creditManager.connect(borrower).stakeCollateral(largeCollateral);

      const credit = await creditManager.getCredit(borrower.address);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("80000", 6)); // 80% LTV
    });
  });
});
