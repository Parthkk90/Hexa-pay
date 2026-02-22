import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockUSDC", function () {
  let usdc: MockUSDC;
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await usdc.name()).to.equal("Mock USDC");
      expect(await usdc.symbol()).to.equal("mUSDC");
    });

    it("Should have 6 decimals", async function () {
      expect(await usdc.decimals()).to.equal(6);
    });

    it("Should start with zero total supply", async function () {
      expect(await usdc.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens successfully", async function () {
      const amount = ethers.parseUnits("1000", 6); // 1000 USDC
      await usdc.mint(alice.address, amount);

      expect(await usdc.balanceOf(alice.address)).to.equal(amount);
      expect(await usdc.totalSupply()).to.equal(amount);
    });

    it("Should emit Transfer event on mint", async function () {
      const amount = ethers.parseUnits("500", 6);
      await expect(usdc.mint(alice.address, amount))
        .to.emit(usdc, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, amount);
    });

    it("Should revert when minting to zero address", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(usdc.mint(ethers.ZeroAddress, amount)).to.be.revertedWith(
        "invalid recipient"
      );
    });

    it("Should allow multiple mints", async function () {
      const amount1 = ethers.parseUnits("1000", 6);
      const amount2 = ethers.parseUnits("500", 6);

      await usdc.mint(alice.address, amount1);
      await usdc.mint(bob.address, amount2);

      expect(await usdc.balanceOf(alice.address)).to.equal(amount1);
      expect(await usdc.balanceOf(bob.address)).to.equal(amount2);
      expect(await usdc.totalSupply()).to.equal(amount1 + amount2);
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      // Mint 1000 USDC to alice
      await usdc.mint(alice.address, ethers.parseUnits("1000", 6));
    });

    it("Should transfer tokens successfully", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdc.connect(alice).transfer(bob.address, amount);

      expect(await usdc.balanceOf(alice.address)).to.equal(
        ethers.parseUnits("900", 6)
      );
      expect(await usdc.balanceOf(bob.address)).to.equal(amount);
    });

    it("Should emit Transfer event", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(usdc.connect(alice).transfer(bob.address, amount))
        .to.emit(usdc, "Transfer")
        .withArgs(alice.address, bob.address, amount);
    });

    it("Should revert when transferring more than balance", async function () {
      const amount = ethers.parseUnits("1001", 6);
      await expect(
        usdc.connect(alice).transfer(bob.address, amount)
      ).to.be.revertedWith("insufficient balance");
    });

    it("Should revert when transferring to zero address", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        usdc.connect(alice).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("invalid recipient");
    });

    it("Should allow transferring entire balance", async function () {
      const balance = await usdc.balanceOf(alice.address);
      await usdc.connect(alice).transfer(bob.address, balance);

      expect(await usdc.balanceOf(alice.address)).to.equal(0);
      expect(await usdc.balanceOf(bob.address)).to.equal(balance);
    });
  });

  describe("Approve", function () {
    it("Should approve spender successfully", async function () {
      const amount = ethers.parseUnits("500", 6);
      await usdc.connect(alice).approve(bob.address, amount);

      expect(await usdc.allowance(alice.address, bob.address)).to.equal(amount);
    });

    it("Should emit Approval event", async function () {
      const amount = ethers.parseUnits("500", 6);
      await expect(usdc.connect(alice).approve(bob.address, amount))
        .to.emit(usdc, "Approval")
        .withArgs(alice.address, bob.address, amount);
    });

    it("Should allow updating approval", async function () {
      await usdc.connect(alice).approve(bob.address, ethers.parseUnits("500", 6));
      await usdc.connect(alice).approve(bob.address, ethers.parseUnits("1000", 6));

      expect(await usdc.allowance(alice.address, bob.address)).to.equal(
        ethers.parseUnits("1000", 6)
      );
    });

    it("Should allow setting approval to zero", async function () {
      await usdc.connect(alice).approve(bob.address, ethers.parseUnits("500", 6));
      await usdc.connect(alice).approve(bob.address, 0);

      expect(await usdc.allowance(alice.address, bob.address)).to.equal(0);
    });
  });

  describe("TransferFrom", function () {
    beforeEach(async function () {
      // Mint 1000 USDC to alice and approve bob
      await usdc.mint(alice.address, ethers.parseUnits("1000", 6));
      await usdc.connect(alice).approve(bob.address, ethers.parseUnits("500", 6));
    });

    it("Should transfer tokens using allowance", async function () {
      const amount = ethers.parseUnits("100", 6);
      await usdc.connect(bob).transferFrom(alice.address, bob.address, amount);

      expect(await usdc.balanceOf(alice.address)).to.equal(
        ethers.parseUnits("900", 6)
      );
      expect(await usdc.balanceOf(bob.address)).to.equal(amount);
      expect(await usdc.allowance(alice.address, bob.address)).to.equal(
        ethers.parseUnits("400", 6)
      );
    });

    it("Should emit Transfer event", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        usdc.connect(bob).transferFrom(alice.address, bob.address, amount)
      )
        .to.emit(usdc, "Transfer")
        .withArgs(alice.address, bob.address, amount);
    });

    it("Should revert when exceeding allowance", async function () {
      const amount = ethers.parseUnits("600", 6);
      await expect(
        usdc.connect(bob).transferFrom(alice.address, bob.address, amount)
      ).to.be.revertedWith("insufficient allowance");
    });

    it("Should revert when owner has insufficient balance", async function () {
      // Approve more than balance
      await usdc.connect(alice).approve(bob.address, ethers.parseUnits("2000", 6));

      const amount = ethers.parseUnits("1500", 6);
      await expect(
        usdc.connect(bob).transferFrom(alice.address, bob.address, amount)
      ).to.be.revertedWith("insufficient balance");
    });

    it("Should allow third-party transfers", async function () {
      const amount = ethers.parseUnits("100", 6);
      const [, , , charlie] = await ethers.getSigners();

      await usdc.connect(bob).transferFrom(alice.address, charlie.address, amount);

      expect(await usdc.balanceOf(alice.address)).to.equal(
        ethers.parseUnits("900", 6)
      );
      expect(await usdc.balanceOf(charlie.address)).to.equal(amount);
    });

    it("Should revert when transferring to zero address", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(
        usdc.connect(bob).transferFrom(alice.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWith("invalid recipient");
    });
  });
});
