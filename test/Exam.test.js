const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Exam", function () {
  let TestExam;
  let testExam;
  let owner;
  let teacher;
  let invigilator;
  let student;
  let addrs;

  beforeEach(async function () {
    [owner, teacher, invigilator, student, ...addrs] = await ethers.getSigners();
    TestExam = await ethers.getContractFactory("TestExam");
    testExam = await TestExam.deploy(teacher.address, invigilator.address);
    await testExam.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner, teacher, and invigilator", async function () {
      expect(await testExam.owner()).to.equal(owner.address);
      const examDetails = await testExam.getExamDetails();
      expect(examDetails.teacher).to.equal(teacher.address);
      expect(examDetails.invigilator).to.equal(invigilator.address);
    });
  });

  describe("Exam Setup", function () {
    it("Should allow the owner or teacher to set exam details", async function () {
      const block = await ethers.provider.getBlock("latest");
      const startTime = block.timestamp + 3600; // 1 hour from now
      const endTime = startTime + 7200; // 2 hours after start
      await expect(testExam.connect(teacher).setExamDetails("Math 101", "Basic Algebra", 100, 3600, startTime, endTime))
        .to.not.be.reverted;
      const examDetails = await testExam.getExamDetails();
      expect(examDetails.examName).to.equal("Math 101");
    });

    it("Should allow the owner or teacher to register a student", async function () {
      await testExam.connect(teacher).registerStudentPublic(student.address);
      // No direct way to check registered student, will be verified in other tests
    });
  });

  describe("Exam Lifecycle", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const block = await ethers.provider.getBlock("latest");
      startTime = block.timestamp + 100; // 100 seconds from now
      endTime = startTime + 200; // 200 seconds duration
      await testExam.connect(teacher).setExamDetails("Math 101", "Basic Algebra", 100, 200, startTime, endTime);
      await testExam.connect(teacher).registerStudentPublic(student.address);
    });

    it("Should allow the owner or teacher to open the exam", async function () {
        await expect(testExam.connect(teacher).openExam(100, 200, startTime, endTime))
            .to.not.be.reverted;
        const examDetails = await testExam.getExamDetails();
        expect(examDetails.isExamOpen).to.be.true;
    });

    it("Should allow a registered student to start the exam", async function () {
        await testExam.connect(teacher).openExam(100, 200, startTime, endTime);
        await testExam.connect(student).payForExam({ value: 100 });

        // Fast forward time to be within the exam window
        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 5]);
        await ethers.provider.send("evm_mine");

        await expect(testExam.connect(student).startExam()).to.not.be.reverted;
    });

    it("Should allow a student to submit the exam", async function () {
        await testExam.connect(teacher).openExam(100, 200, startTime, endTime);
        await testExam.connect(student).payForExam({ value: 100 });

        await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 5]);
        await ethers.provider.send("evm_mine");

        await testExam.connect(student).startExam();
        await expect(testExam.connect(student).submitExamPublic()).to.not.be.reverted;
        const examDetails = await testExam.getExamDetails();
        expect(examDetails.isExamFinished).to.be.true;
    });

    it("Should allow the invigilator or teacher to mark a student as cheating", async function () {
        await testExam.connect(teacher).openExam(100, 200, startTime, endTime);

        await expect(testExam.connect(invigilator).caughtCheatingPublic()).to.not.be.reverted;
        const examDetails = await testExam.getExamDetails();
        expect(examDetails.isExamFinished).to.be.true;
    });
  });
});