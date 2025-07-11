const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HostelSnacks", function () {
  let HostelSnacks;
  let hostelSnacks;
  let owner;
  let seller;
  let buyer;
  let addrs;

  beforeEach(async function () {
    [owner, seller, buyer, ...addrs] = await ethers.getSigners();
    HostelSnacks = await ethers.getContractFactory("HostelSnacks");
    hostelSnacks = await HostelSnacks.deploy();
    await hostelSnacks.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await hostelSnacks.owner()).to.equal(owner.address);
    });
  });

  describe("User Registration", function () {
    it("Should allow a user to register as a seller", async function () {
      await expect(hostelSnacks.connect(seller).registerSeller())
        .to.emit(hostelSnacks, "SellerRegistered")
        .withArgs(seller.address, "");
      const sellerInfo = await hostelSnacks.getSeller(seller.address);
      expect(sellerInfo[0]).to.equal("");
    });

    it("Should allow a user to register as a buyer", async function () {
      await expect(hostelSnacks.connect(buyer).registerBuyer("testbuyer"))
        .to.emit(hostelSnacks, "BuyerRegistered")
        .withArgs(buyer.address, "testbuyer");
      const buyerInfo = await hostelSnacks.getBuyer(buyer.address);
      expect(buyerInfo[0]).to.equal("testbuyer");
    });

    it("Should prevent a user from registering as a seller twice", async function () {
      await hostelSnacks.connect(seller).registerSeller();
      await expect(hostelSnacks.connect(seller).registerSeller())
        .to.be.revertedWith("Seller already registered");
    });

    it("Should prevent a user from registering as a buyer twice", async function () {
      await hostelSnacks.connect(buyer).registerBuyer("testbuyer");
      await expect(hostelSnacks.connect(buyer).registerBuyer("testbuyer"))
        .to.be.revertedWith("Buyer already registered");
    });
  });

  describe("Snack Management", function () {
    beforeEach(async function () {
      await hostelSnacks.connect(seller).registerSeller();
    });

    it("Should allow a seller to add a snack", async function () {
      await expect(hostelSnacks.connect(seller).addSnack("Chips", 10, 20, "chips1"))
        .to.emit(hostelSnacks, "SnackAdded")
        .withArgs("chips1", "Chips", 10, 20);
      const snack = await hostelSnacks.getSnack("chips1");
      expect(snack[0]).to.equal("Chips");
    });

    it("Should prevent a non-seller from adding a snack", async function () {
      await expect(hostelSnacks.connect(buyer).addSnack("Chips", 10, 20, "chips1"))
        .to.be.revertedWith("Only seller can perform this action");
    });

    it("Should allow a seller to update a snack", async function () {
      await hostelSnacks.connect(seller).addSnack("Chips", 10, 20, "chips1");
      await expect(hostelSnacks.connect(seller).updateSnack("chips1", 12, 15))
        .to.emit(hostelSnacks, "SnackUpdated")
        .withArgs("chips1", 12, 15);
      const snack = await hostelSnacks.getSnack("chips1");
      expect(snack[1]).to.equal(12);
      expect(snack[2]).to.equal(15);
    });

    it("Should allow a seller to delete a snack", async function () {
      await hostelSnacks.connect(seller).addSnack("Chips", 10, 20, "chips1");
      await expect(hostelSnacks.connect(seller).deleteSnack("chips1"))
        .to.emit(hostelSnacks, "SnackDeleted")
        .withArgs("chips1");
      await expect(hostelSnacks.getSnack("chips1")).to.be.revertedWith("Snack does not exist");
    });
  });

  describe("Snack Purchase", function () {
    beforeEach(async function () {
      await hostelSnacks.connect(seller).registerSeller();
      await hostelSnacks.connect(buyer).registerBuyer("testbuyer");
      await hostelSnacks.connect(seller).addSnack("Chips", 10, 20, "chips1");
    });

    it("Should allow a buyer to purchase a snack", async function () {
      const purchaseTx = await hostelSnacks.connect(buyer).buySnack("chips1", 2, { value: ethers.parseEther("0.000000000000000020") });
      await expect(purchaseTx)
        .to.emit(hostelSnacks, "SnackPurchased")
        .withArgs(buyer.address, "chips1", 2, 20);
      const snack = await hostelSnacks.getSnack("chips1");
      expect(snack[2]).to.equal(18);
    });

    it("Should prevent a buyer from purchasing with insufficient payment", async function () {
      await expect(hostelSnacks.connect(buyer).buySnack("chips1", 2, { value: ethers.parseEther("0.000000000000000010") }))
        .to.be.revertedWith("Insufficient payment");
    });

    it("Should prevent purchasing more snacks than available", async function () {
      await expect(hostelSnacks.connect(buyer).buySnack("chips1", 21, { value: ethers.parseEther("0.000000000000000210") }))
        .to.be.revertedWith("Not enough quantity available");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      await hostelSnacks.connect(seller).registerSeller();
      await hostelSnacks.connect(buyer).registerBuyer("testbuyer");
      await hostelSnacks.connect(seller).addSnack("Chips", 10, 20, "chips1");
      await hostelSnacks.connect(buyer).buySnack("chips1", 2, { value: ethers.parseEther("0.000000000000000020") });
    });

    it("Should allow the owner to refund a buyer", async function () {
        const initialBalance = await ethers.provider.getBalance(buyer.address);
        const refundAmount = ethers.parseEther("0.000000000000000010");
        
        const refundTx = await hostelSnacks.connect(owner).refundBuyer(buyer.address, 10);
        await refundTx.wait();
        
        const finalBalance = await ethers.provider.getBalance(buyer.address);
        
        expect(finalBalance).to.be.closeTo(initialBalance + refundAmount, ethers.parseEther("0.0001"));
    });

    it("Should prevent non-owner from refunding a buyer", async function () {
      await expect(hostelSnacks.connect(seller).refundBuyer(buyer.address, 10))
        .to.be.revertedWith("Only owner can perform this action");
    });
  });
});