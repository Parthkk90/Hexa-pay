import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditManager, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * NFC Payment Integration Tests
 * 
 * These tests simulate real-world NFC payment scenarios:
 * - Customer taps phone at merchant terminal
 * - NFC bridge authenticates and executes payment
 * - Credit line is updated
 * - Merchant receives payment confirmation
 */
describe("NFC Payment Integration", function () {
  let creditManager: CreditManager;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let nfcBridge: SignerWithAddress;
  let customer: SignerWithAddress;
  let merchant: SignerWithAddress;
  let coffeShop: SignerWithAddress;
  let restaurant: SignerWithAddress;

  const CUSTOMER_BALANCE = ethers.parseUnits("5000", 6); // 5,000 USDC
  const COLLATERAL = ethers.parseUnits("1000", 6); // 1,000 USDC collateral

  beforeEach(async function () {
    [owner, nfcBridge, customer, merchant, coffeShop, restaurant] = await ethers.getSigners();

    // Deploy contracts
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();

    const CreditManagerFactory = await ethers.getContractFactory("CreditManager");
    creditManager = await CreditManagerFactory.deploy(
      await usdc.getAddress(),
      nfcBridge.address
    );

    // Setup customer with USDC and credit line
    await usdc.mint(customer.address, CUSTOMER_BALANCE);
    await usdc.connect(customer).approve(await creditManager.getAddress(), ethers.MaxUint256);
    await creditManager.connect(customer).stakeCollateral(COLLATERAL);
  });

  describe("Single NFC Payment Scenario", function () {
    it("Should process coffee shop payment via NFC tap", async function () {
      // Scenario: Customer buys coffee for $12.50
      const coffeePrice = ethers.parseUnits("12.50", 6);

      // Customer taps phone at NFC terminal
      // NFC bridge receives signal and executes payment
      const tx = await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        coffeePrice
      );

      // Verify payment was recorded
      await expect(tx)
        .to.emit(creditManager, "PaymentExecuted")
        .withArgs(customer.address, coffeePrice, coffeePrice);

      // Check customer's credit line
      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(coffeePrice);
      expect(credit.availableCredit).to.equal(
        ethers.parseUnits("787.50", 6) // 800 - 12.50
      );
    });

    it("Should process restaurant payment for larger amount", async function () {
      // Scenario: Customer pays $85.75 at restaurant
      const mealPrice = ethers.parseUnits("85.75", 6);

      await creditManager.connect(nfcBridge).executePayment(customer.address, mealPrice);

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(mealPrice);
      expect(credit.availableCredit).to.equal(
        ethers.parseUnits("714.25", 6) // 800 - 85.75
      );
    });

    it("Should reject payment when credit limit exceeded", async function () {
      // Scenario: Customer tries to make $900 purchase (over $800 limit)
      const largeAmount = ethers.parseUnits("900", 6);

      await expect(
        creditManager.connect(nfcBridge).executePayment(customer.address, largeAmount)
      ).to.be.revertedWith("credit limit exceeded");
    });

    it("Should reject payment for customer without credit line", async function () {
      // Scenario: New customer without credit line tries to pay
      const [, , , , , , newCustomer] = await ethers.getSigners();
      const amount = ethers.parseUnits("20", 6);

      await expect(
        creditManager.connect(nfcBridge).executePayment(newCustomer.address, amount)
      ).to.be.revertedWith("credit line inactive");
    });
  });

  describe("Multiple NFC Payments (Day in the Life)", function () {
    it("Should handle multiple payments throughout the day", async function () {
      // Morning: Coffee - $5.50
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("5.50", 6)
      );

      // Lunch: Restaurant - $28.75
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("28.75", 6)
      );

      // Afternoon: Snack - $8.25
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("8.25", 6)
      );

      // Evening: Groceries - $67.50
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("67.50", 6)
      );

      // Check total borrowed
      const credit = await creditManager.getCredit(customer.address);
      const totalSpent = ethers.parseUnits("110", 6); // 5.50 + 28.75 + 8.25 + 67.50
      expect(credit.amountBorrowed).to.equal(totalSpent);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("690", 6)); // 800 - 110
    });

    it("Should stop when reaching credit limit", async function () {
      // Customer makes multiple purchases approaching limit
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("300", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("250", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("200", 6)
      );

      // Total: $750, remaining: $50
      let credit = await creditManager.getCredit(customer.address);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("50", 6));

      // Next payment for $60 should fail
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("60", 6)
        )
      ).to.be.revertedWith("credit limit exceeded");

      // But payment for $50 should succeed
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("50", 6)
      );

      credit = await creditManager.getCredit(customer.address);
      expect(credit.availableCredit).to.equal(0);
    });
  });

  describe("Payment + Repayment Cycle", function () {
    it("Should handle pay-and-repay cycle with reputation increase", async function () {
      // Week 1: Customer makes purchases
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("150", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("100", 6)
      );

      let credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("250", 6));

      // Customer repays
      await usdc.mint(customer.address, ethers.parseUnits("250", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("150", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("100", 6));

      // Check reputation increased
      credit = await creditManager.getCredit(customer.address);
      expect(credit.score).to.equal(10); // +5 per repayment
      expect(credit.amountBorrowed).to.equal(0);
      expect(credit.creditLimit).to.equal(ethers.parseUnits("850", 6)); // 85% LTV now

      // Week 2: Customer can now spend more
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("840", 6)
      );

      credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("840", 6));
    });

    it("Should allow immediate repurchase after repayment", async function () {
      // Fill credit limit
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("800", 6)
      );

      let credit = await creditManager.getCredit(customer.address);
      expect(credit.availableCredit).to.equal(0);

      // Repay $100
      await usdc.mint(customer.address, ethers.parseUnits("100", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("100", 6));

      // Should now be able to spend $100 again
      credit = await creditManager.getCredit(customer.address);
      expect(credit.availableCredit).to.equal(ethers.parseUnits("100", 6));

      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("100", 6)
      );

      credit = await creditManager.getCredit(customer.address);
      expect(credit.availableCredit).to.equal(0);
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("800", 6));
    });
  });

  describe("First Use Threshold Trigger", function () {
    it("Should emit event when customer reaches 30% utilization", async function () {
      const creditLimit = ethers.parseUnits("800", 6);
      const threshold = ethers.parseUnits("240", 6); // 30% of 800

      // First payment: $100 (12.5% utilization)
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("100", 6)
      );

      // Second payment: $200 (total 37.5% utilization) - crosses threshold!
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("200", 6)
        )
      )
        .to.emit(creditManager, "FirstUseTriggered")
        .withArgs(customer.address, ethers.parseUnits("300", 6), threshold);
    });

    it("Should trigger on single payment crossing threshold", async function () {
      const threshold = ethers.parseUnits("240", 6);

      // Single payment of $300 crosses 30% threshold
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("300", 6)
        )
      )
        .to.emit(creditManager, "FirstUseTriggered")
        .withArgs(customer.address, ethers.parseUnits("300", 6), threshold);
    });

    it("Should trigger again after crossing threshold multiple times", async function () {
      const threshold = ethers.parseUnits("240", 6);

      // Cross threshold first time
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("300", 6)
        )
      ).to.emit(creditManager, "FirstUseTriggered");

      // Repay back below threshold (300 - 150 = 150)
      await usdc.mint(customer.address, ethers.parseUnits("150", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("150", 6));

      // New payment crossing threshold again SHOULD trigger
      // (we went below and now crossing above again)
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("150", 6)
        )
      ).to.emit(creditManager, "FirstUseTriggered")
       .withArgs(customer.address, ethers.parseUnits("300", 6), threshold);
    });
  });

  describe("Multi-Customer NFC Scenarios", function () {
    let customer2: SignerWithAddress;
    let customer3: SignerWithAddress;

    beforeEach(async function () {
      [, , , , , , customer2, customer3] = await ethers.getSigners();

      // Setup customer2
      await usdc.mint(customer2.address, CUSTOMER_BALANCE);
      await usdc.connect(customer2).approve(await creditManager.getAddress(), ethers.MaxUint256);
      await creditManager.connect(customer2).stakeCollateral(COLLATERAL);

      // Setup customer3
      await usdc.mint(customer3.address, CUSTOMER_BALANCE);
      await usdc.connect(customer3).approve(await creditManager.getAddress(), ethers.MaxUint256);
      await creditManager.connect(customer3).stakeCollateral(COLLATERAL);
    });

    it("Should handle payments from multiple customers simultaneously", async function () {
      // All three customers make payments
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("50", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        customer2.address,
        ethers.parseUnits("75", 6)
      );
      await creditManager.connect(nfcBridge).executePayment(
        customer3.address,
        ethers.parseUnits("100", 6)
      );

      // Verify each customer's credit independently
      const credit1 = await creditManager.getCredit(customer.address);
      const credit2 = await creditManager.getCredit(customer2.address);
      const credit3 = await creditManager.getCredit(customer3.address);

      expect(credit1.amountBorrowed).to.equal(ethers.parseUnits("50", 6));
      expect(credit2.amountBorrowed).to.equal(ethers.parseUnits("75", 6));
      expect(credit3.amountBorrowed).to.equal(ethers.parseUnits("100", 6));
    });

    it("Should maintain separate credit limits and reputation", async function () {
      // Customer1: pays and repays (builds reputation)
      await creditManager.connect(nfcBridge).executePayment(
        customer.address,
        ethers.parseUnits("200", 6)
      );
      await usdc.mint(customer.address, ethers.parseUnits("200", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("100", 6));
      await creditManager.connect(customer).repay(ethers.parseUnits("100", 6));

      // Customer2: only pays, no repayment
      await creditManager.connect(nfcBridge).executePayment(
        customer2.address,
        ethers.parseUnits("200", 6)
      );

      // Check different credit situations
      const credit1 = await creditManager.getCredit(customer.address);
      const credit2 = await creditManager.getCredit(customer2.address);

      expect(credit1.score).to.equal(10); // Repaid twice
      expect(credit2.score).to.equal(0); // Never repaid
      expect(credit1.creditLimit).to.equal(ethers.parseUnits("850", 6)); // 85% LTV
      expect(credit2.creditLimit).to.equal(ethers.parseUnits("800", 6)); // 80% LTV
    });
  });

  describe("Security & Authorization", function () {
    it("Should only allow NFC bridge to execute payments", async function () {
      const amount = ethers.parseUnits("50", 6);

      // Unauthorized user cannot execute
      await expect(
        creditManager.connect(customer).executePayment(customer.address, amount)
      ).to.be.revertedWith("Not authorized");

      // Merchant cannot execute directly
      await expect(
        creditManager.connect(merchant).executePayment(customer.address, amount)
      ).to.be.revertedWith("Not authorized");

      // Only bridge can execute
      await expect(
        creditManager.connect(nfcBridge).executePayment(customer.address, amount)
      ).to.emit(creditManager, "PaymentExecuted");
    });

    it("Should allow owner to override for emergency", async function () {
      const amount = ethers.parseUnits("50", 6);

      // Owner can execute payments
      await expect(
        creditManager.connect(owner).executePayment(customer.address, amount)
      ).to.emit(creditManager, "PaymentExecuted");
    });

    it("Should allow updating NFC bridge address", async function () {
      const [, , , , , , , , newBridge] = await ethers.getSigners();

      // Update bridge
      await creditManager.connect(owner).setNfcBridge(newBridge.address);

      // Old bridge no longer works
      await expect(
        creditManager.connect(nfcBridge).executePayment(
          customer.address,
          ethers.parseUnits("50", 6)
        )
      ).to.be.revertedWith("Not authorized");

      // New bridge works
      await expect(
        creditManager.connect(newBridge).executePayment(
          customer.address,
          ethers.parseUnits("50", 6)
        )
      ).to.emit(creditManager, "PaymentExecuted");
    });
  });

  describe("Real-World Payment Amounts", function () {
    it("Should handle typical retail amounts", async function () {
      const payments = [
        ethers.parseUnits("3.99", 6), // Snack
        ethers.parseUnits("12.50", 6), // Lunch
        ethers.parseUnits("45.99", 6), // Groceries
        ethers.parseUnits("89.99", 6), // Clothing
        ethers.parseUnits("125.00", 6), // Electronics
      ];

      let totalBorrowed = 0n;

      for (const amount of payments) {
        await creditManager.connect(nfcBridge).executePayment(customer.address, amount);
        totalBorrowed += amount;
      }

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(totalBorrowed);
      expect(totalBorrowed).to.equal(ethers.parseUnits("277.47", 6));
    });

    it("Should handle cents-level precision", async function () {
      const preciseAmount = ethers.parseUnits("12.99", 6); // $12.99

      await creditManager.connect(nfcBridge).executePayment(customer.address, preciseAmount);

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(preciseAmount);
      expect(credit.amountBorrowed).to.equal(12_990_000n); // 12.99 * 1e6
    });
  });

  describe("Stress Testing", function () {
    it("Should handle rapid sequential payments", async function () {
      const paymentAmount = ethers.parseUnits("10", 6);
      const numberOfPayments = 50;

      // Execute 50 rapid payments
      for (let i = 0; i < numberOfPayments; i++) {
        await creditManager.connect(nfcBridge).executePayment(customer.address, paymentAmount);
      }

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(paymentAmount * BigInt(numberOfPayments));
      expect(credit.amountBorrowed).to.equal(ethers.parseUnits("500", 6));
    });

    it("Should handle payment at exact credit limit", async function () {
      const exactLimit = ethers.parseUnits("800", 6);

      await creditManager.connect(nfcBridge).executePayment(customer.address, exactLimit);

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(exactLimit);
      expect(credit.availableCredit).to.equal(0);

      // One more cent should fail
      await expect(
        creditManager.connect(nfcBridge).executePayment(customer.address, 1)
      ).to.be.revertedWith("credit limit exceeded");
    });

    it("Should handle minimum payment amount", async function () {
      const minimumAmount = 1n; // 0.000001 USDC

      await creditManager.connect(nfcBridge).executePayment(customer.address, minimumAmount);

      const credit = await creditManager.getCredit(customer.address);
      expect(credit.amountBorrowed).to.equal(minimumAmount);
    });
  });
});
