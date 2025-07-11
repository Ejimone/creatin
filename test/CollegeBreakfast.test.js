const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CollegeBreakfast", function () {
  let CollegeBreakfast;
  let collegeBreakfast;
  let owner;
  let warden;
  let student1;
  let student2;
  let addrs;

  beforeEach(async function () {
    [owner, warden, student1, student2, ...addrs] = await ethers.getSigners();
    CollegeBreakfast = await ethers.getContractFactory("CollegeBreakfast");
    collegeBreakfast = await CollegeBreakfast.deploy(warden.address);
    await collegeBreakfast.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await collegeBreakfast.owner()).to.equal(owner.address);
    });

    it("Should set the right warden", async function () {
      expect(await collegeBreakfast.warden()).to.equal(warden.address);
    });

    it("Should start with the portal closed", async function () {
      expect(await collegeBreakfast.portalStatus()).to.equal(0); // 0 is PortalStatus.Closed
    });
  });

  describe("Portal Management", function () {
    it("Should allow the warden to open the portal", async function () {
      await expect(collegeBreakfast.connect(warden).openPortal())
        .to.emit(collegeBreakfast, "PortalStatusChanged")
        .withArgs(1); // 1 is PortalStatus.Open
      expect(await collegeBreakfast.portalStatus()).to.equal(1);
    });

    it("Should allow the warden to close the portal", async function () {
      await collegeBreakfast.connect(warden).openPortal();
      await expect(collegeBreakfast.connect(warden).closePortal())
        .to.emit(collegeBreakfast, "PortalStatusChanged")
        .withArgs(0); // 0 is PortalStatus.Closed
      expect(await collegeBreakfast.portalStatus()).to.equal(0);
    });

    it("Should prevent non-warden from opening the portal", async function () {
      await expect(collegeBreakfast.connect(student1).openPortal())
        .to.be.revertedWith("Only the warden can call this function");
    });

    it("Should prevent non-warden from closing the portal", async function () {
      await collegeBreakfast.connect(warden).openPortal();
      await expect(collegeBreakfast.connect(student1).closePortal())
        .to.be.revertedWith("Only the warden can call this function");
    });

    it("Should prevent opening an already open portal", async function () {
        await collegeBreakfast.connect(warden).openPortal();
        await expect(collegeBreakfast.connect(warden).openPortal())
            .to.be.revertedWith("Portal is already open");
    });

    it("Should prevent closing an already closed portal", async function () {
        await expect(collegeBreakfast.connect(warden).closePortal())
            .to.be.revertedWith("Portal is already closed");
    });
  });

  describe("Student Registration", function () {
    it("Should allow the warden to register a student", async function () {
      await expect(collegeBreakfast.connect(warden).registerStudent(student1.address))
        .to.emit(collegeBreakfast, "StudentRegistrationChanged")
        .withArgs(student1.address, true);
      expect(await collegeBreakfast.isStudentRegistered(student1.address)).to.be.true;
    });

    it("Should allow the warden to unregister a student", async function () {
      await collegeBreakfast.connect(warden).registerStudent(student1.address);
      await expect(collegeBreakfast.connect(warden).unregisterStudent(student1.address))
        .to.emit(collegeBreakfast, "StudentRegistrationChanged")
        .withArgs(student1.address, false);
      expect(await collegeBreakfast.isStudentRegistered(student1.address)).to.be.false;
    });

    it("Should prevent non-warden from registering a student", async function () {
      await expect(collegeBreakfast.connect(owner).registerStudent(student1.address))
        .to.be.revertedWith("Only the warden can call this function");
    });

    it("Should prevent registering an already registered student", async function () {
        await collegeBreakfast.connect(warden).registerStudent(student1.address);
        await expect(collegeBreakfast.connect(warden).registerStudent(student1.address))
            .to.be.revertedWith("Student is already registered");
    });

    it("Should prevent unregistering a non-registered student", async function () {
        await expect(collegeBreakfast.connect(warden).unregisterStudent(student1.address))
            .to.be.revertedWith("Student is not registered");
    });
  });

  describe("Food Ordering", function () {
    beforeEach(async function () {
      await collegeBreakfast.connect(warden).registerStudent(student1.address);
      await collegeBreakfast.connect(warden).openPortal();
    });

    it("Should allow a registered student to order food when the portal is open", async function () {
      await expect(collegeBreakfast.connect(student1).orderFood("Pizza"))
        .to.emit(collegeBreakfast, "FoodOrdered")
        .withArgs(student1.address, "Pizza");
      const orderCount = await collegeBreakfast.getStudentOrderCount(student1.address);
      expect(orderCount).to.equal(1);
    });

    it("Should prevent ordering with an empty food item", async function () {
        await expect(collegeBreakfast.connect(student1).orderFood(""))
            .to.be.revertedWith("Food item cannot be empty");
    });

    it("Should prevent unregistered students from ordering", async function () {
      await expect(collegeBreakfast.connect(student2).orderFood("Burger"))
        .to.be.revertedWith("Student is not registered");
    });

    it("Should prevent ordering when the portal is closed", async function () {
      await collegeBreakfast.connect(warden).closePortal();
      await expect(collegeBreakfast.connect(student1).orderFood("Pasta"))
        .to.be.revertedWith("Portal is not open");
    });

    it("Should prevent a student from ordering more than 4 times", async function () {
      await collegeBreakfast.connect(student1).orderFood("Dosa");
      await collegeBreakfast.connect(student1).orderFood("Idli");
      await collegeBreakfast.connect(student1).orderFood("Vada");
      await collegeBreakfast.connect(student1).orderFood("Puri");
      await expect(collegeBreakfast.connect(student1).orderFood("Upma"))
        .to.be.revertedWith("You have already ordered 4 times today");
    });
  });

  describe("Order Retrieval", function () {
    beforeEach(async function () {
        await collegeBreakfast.connect(warden).registerStudent(student1.address);
        await collegeBreakfast.connect(warden).openPortal();
        await collegeBreakfast.connect(student1).orderFood("Coffee");
    });

    it("Should get the last order of a student", async function () {
        const [foodItem, orderTime] = await collegeBreakfast.getLastOrder(student1.address);
        expect(foodItem).to.equal("Coffee");
        expect(orderTime).to.be.gt(0);
    });

    it("Should revert when getting last order for a student with no orders", async function () {
        await expect(collegeBreakfast.getLastOrder(student2.address))
            .to.be.revertedWith("Student has no orders");
    });

    it("Should get the correct student order count", async function () {
        expect(await collegeBreakfast.getStudentOrderCount(student1.address)).to.equal(1);
        await collegeBreakfast.connect(student1).orderFood("Tea");
        expect(await collegeBreakfast.getStudentOrderCount(student1.address)).to.equal(2);
    });

    it("Should revert when getting order count for an unregistered student", async function () {
        await expect(collegeBreakfast.getStudentOrderCount(student2.address))
            .to.be.revertedWith("student is not registered");
    });

    it("Should get the total number of orders", async function () {
        await collegeBreakfast.connect(warden).registerStudent(student2.address);
        await collegeBreakfast.connect(student2).orderFood("Milk");
        const totalOrders = await collegeBreakfast.getTotalOrders();
        expect(totalOrders).to.equal(2);
    });
  });

  // The cancelOrder function is private, so it cannot be directly tested from here.
  // Its functionality would need to be tested indirectly through other public functions
  // if any were to call it, or by making it internal/public for testing purposes.

});