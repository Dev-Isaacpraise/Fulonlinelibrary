const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LibrarySystem Smart Contract", function () {
  let librarySystem;
  let admin, student1, student2, student3, stranger;
  const BORROW_PERIOD_DAYS = 14; // 14 days
  const FINE_RATE_PER_DAY = ethers.parseUnits("50", "gwei"); // 50 gwei or units per day

  beforeEach(async function () {
    [admin, student1, student2, student3, stranger] = await ethers.getSigners();

    const LibrarySystemFactory = await ethers.getContractFactory("LibrarySystem");
    librarySystem = await LibrarySystemFactory.deploy(BORROW_PERIOD_DAYS, FINE_RATE_PER_DAY);
    await librarySystem.waitForDeployment();
  });

  describe("Initialization & Deployment", function () {
    it("should set deployer as admin and initialize parameters", async function () {
      expect(await librarySystem.admin()).to.equal(admin.address);
      expect(await librarySystem.borrowPeriodDays()).to.equal(BORROW_PERIOD_DAYS);
      expect(await librarySystem.fineRatePerDay()).to.equal(FINE_RATE_PER_DAY);
      expect(await librarySystem.bookCount()).to.equal(0);
      expect(await librarySystem.memberCount()).to.equal(0);
      expect(await librarySystem.totalBorrows()).to.equal(0);
    });
  });

  describe("1. Registration & Access Control", function () {
    it("allows admin to register a new member and emits MemberRegistered", async function () {
      await expect(librarySystem.connect(admin).registerMember(student1.address, "Amina Bello"))
        .to.emit(librarySystem, "MemberRegistered")
        .withArgs(student1.address, "Amina Bello", 3);

      const member = await librarySystem.getMemberDetails(student1.address);
      expect(member.isRegistered).to.be.true;
      expect(member.name).to.equal("Amina Bello");
      expect(member.currentBorrows).to.equal(0);
      expect(member.maxBorrows).to.equal(3);
      expect(await librarySystem.memberCount()).to.equal(1);
    });

    it("prevents non-admin from registering a member (Access Control)", async function () {
      await expect(
        librarySystem.connect(stranger).registerMember(student2.address, "Chinedu Okafor")
      ).to.be.revertedWithCustomError(librarySystem, "OnlyAdminAllowed");
    });

    it("prevents registering the same member twice", async function () {
      await librarySystem.connect(admin).registerMember(student1.address, "Amina Bello");
      await expect(
        librarySystem.connect(admin).registerMember(student1.address, "Amina Bello Again")
      ).to.be.revertedWithCustomError(librarySystem, "MemberAlreadyRegistered");
    });

    it("prevents non-admin from adding a book", async function () {
      await expect(
        librarySystem.connect(stranger).addBook("Introduction to Algorithms", "CLRS")
      ).to.be.revertedWithCustomError(librarySystem, "OnlyAdminAllowed");
    });

    it("prevents non-admin from updating borrow period or fine rate", async function () {
      await expect(
        librarySystem.connect(stranger).updateBorrowPeriod(21)
      ).to.be.revertedWithCustomError(librarySystem, "OnlyAdminAllowed");

      await expect(
        librarySystem.connect(stranger).updateFineRate(100)
      ).to.be.revertedWithCustomError(librarySystem, "OnlyAdminAllowed");
    });
  });

  describe("Book Management", function () {
    it("allows admin to add books and emits BookAdded", async function () {
      await expect(librarySystem.connect(admin).addBook("Clean Architecture", "Robert C. Martin"))
        .to.emit(librarySystem, "BookAdded")
        .withArgs(1, "Clean Architecture", "Robert C. Martin");

      const book = await librarySystem.getBookDetails(1);
      expect(book.id).to.equal(1);
      expect(book.title).to.equal("Clean Architecture");
      expect(book.author).to.equal("Robert C. Martin");
      expect(book.isAvailable).to.be.true;
      expect(book.currentBorrower).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Borrowing & Borrow Limits", function () {
    beforeEach(async function () {
      await librarySystem.connect(admin).registerMember(student1.address, "Amina Bello");
      await librarySystem.connect(admin).addBook("Book 1", "Author 1");
      await librarySystem.connect(admin).addBook("Book 2", "Author 2");
      await librarySystem.connect(admin).addBook("Book 3", "Author 3");
      await librarySystem.connect(admin).addBook("Book 4", "Author 4");
    });

    it("prevents unregistered user from borrowing", async function () {
      await expect(
        librarySystem.connect(stranger).borrowBook(1)
      ).to.be.revertedWithCustomError(librarySystem, "OnlyRegisteredMemberAllowed");
    });

    it("allows registered member to borrow an available book", async function () {
      const tx = await librarySystem.connect(student1).borrowBook(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const expectedDueDate = block.timestamp + BORROW_PERIOD_DAYS * 86400;

      await expect(tx)
        .to.emit(librarySystem, "BookBorrowed")
        .withArgs(1, 1, student1.address, expectedDueDate);

      const book = await librarySystem.getBookDetails(1);
      expect(book.isAvailable).to.be.false;
      expect(book.currentBorrower).to.equal(student1.address);

      const member = await librarySystem.getMemberDetails(student1.address);
      expect(member.currentBorrows).to.equal(1);

      const history = await librarySystem.getMemberHistory(student1.address);
      expect(history.length).to.equal(1);
      expect(history[0]).to.equal(1);
    });

    it("enforces borrowing limit (max 3 books)", async function () {
      await librarySystem.connect(student1).borrowBook(1);
      await librarySystem.connect(student1).borrowBook(2);
      await librarySystem.connect(student1).borrowBook(3);

      const member = await librarySystem.getMemberDetails(student1.address);
      expect(member.currentBorrows).to.equal(3);

      // Attempting 4th borrow must revert with BorrowLimitReached
      await expect(
        librarySystem.connect(student1).borrowBook(4)
      ).to.be.revertedWithCustomError(librarySystem, "BorrowLimitReached");
    });

    it("prevents borrowing an unavailable book", async function () {
      await librarySystem.connect(student1).borrowBook(1);

      await librarySystem.connect(admin).registerMember(student2.address, "Emeka Eze");

      // Attempting to borrow book 1 which is already borrowed
      await expect(
        librarySystem.connect(student2).borrowBook(1)
      ).to.be.revertedWithCustomError(librarySystem, "BookNotAvailable");
    });
  });

  describe("Returning & Fines", function () {
    beforeEach(async function () {
      await librarySystem.connect(admin).registerMember(student1.address, "Amina Bello");
      await librarySystem.connect(admin).registerMember(student2.address, "Emeka Eze");
      await librarySystem.connect(admin).addBook("Distributed Systems", "Tanenbaum");
      await librarySystem.connect(student1).borrowBook(1); // recordId = 1
    });

    it("allows on-time return with zero fine and frees the book", async function () {
      // Advance time by 5 days (less than 14 days)
      await time.increase(5 * 86400);

      const tx = await librarySystem.connect(student1).returnBook(1);
      await expect(tx)
        .to.emit(librarySystem, "BookReturned")
        .withArgs(1, 1, student1.address, 0);

      const record = await librarySystem.getBorrowRecord(1);
      expect(record.returned).to.be.true;
      expect(record.fineAmount).to.equal(0);
      expect(record.returnTimestamp).to.be.gt(0);

      const book = await librarySystem.getBookDetails(1);
      expect(book.isAvailable).to.be.true;
      expect(book.currentBorrower).to.equal(ethers.ZeroAddress);

      const member = await librarySystem.getMemberDetails(student1.address);
      expect(member.currentBorrows).to.equal(0);
    });

    it("accurately calculates fine on overdue return", async function () {
      const recordBefore = await librarySystem.getBorrowRecord(1);
      // Set next block timestamp exactly to 3 days past dueDate
      const targetTime = recordBefore.dueDate + (3n * 86400n);
      await time.setNextBlockTimestamp(targetTime);

      const expectedFine = 3n * BigInt(FINE_RATE_PER_DAY);

      const tx = await librarySystem.connect(student1).returnBook(1);
      await expect(tx)
        .to.emit(librarySystem, "BookReturned")
        .withArgs(1, 1, student1.address, expectedFine);

      const record = await librarySystem.getBorrowRecord(1);
      expect(record.returned).to.be.true;
      expect(record.fineAmount).to.equal(expectedFine);
    });

    it("prevents double return of the same record", async function () {
      await librarySystem.connect(student1).returnBook(1);

      await expect(
        librarySystem.connect(student1).returnBook(1)
      ).to.be.revertedWithCustomError(librarySystem, "RecordAlreadyReturned");
    });

    it("prevents wrong borrower from returning someone else's book", async function () {
      await expect(
        librarySystem.connect(student2).returnBook(1)
      ).to.be.revertedWithCustomError(librarySystem, "NotRecordBorrower");
    });
  });
});
