// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LibrarySystem
 * @dev Smart contract for Federal University Lokoja Library Book Borrowing and Tracking System.
 */
contract LibrarySystem {
    // --- Custom Errors ---
    error OnlyAdminAllowed();
    error OnlyRegisteredMemberAllowed();
    error MemberAlreadyRegistered();
    error InvalidAddress();
    error InvalidParameters();
    error BookNotFound();
    error BookNotAvailable();
    error BorrowLimitReached();
    error RecordNotFound();
    error NotRecordBorrower();
    error RecordAlreadyReturned();

    // --- Structs ---
    struct Member {
        bool isRegistered;
        string name;
        uint256 currentBorrows;
        uint256 maxBorrows;
    }

    struct Book {
        uint256 id;
        string title;
        string author;
        bool isAvailable;
        address currentBorrower;
    }

    struct BorrowRecord {
        uint256 bookId;
        address borrower;
        uint256 borrowTimestamp;
        uint256 dueDate;
        uint256 returnTimestamp;
        uint256 fineAmount;
        bool returned;
    }

    // --- State Variables ---
    address public admin;
    uint256 public borrowPeriodDays;
    uint256 public fineRatePerDay; // in wei or local fine units (e.g., 500000000000000 wei / 0.0005 ETH per day or token units)
    uint256 public bookCount;
    uint256 public memberCount;
    uint256 public totalBorrows; // total borrow records created

    // --- Mappings ---
    mapping(address => Member) public members;
    mapping(uint256 => Book) public books;
    mapping(uint256 => BorrowRecord) public borrowRecords;
    mapping(address => uint256[]) private memberHistory;

    // --- Events ---
    event MemberRegistered(address indexed memberAddress, string name, uint256 maxBorrows);
    event BookAdded(uint256 indexed bookId, string title, string author);
    event BookBorrowed(uint256 indexed recordId, uint256 indexed bookId, address indexed borrower, uint256 dueDate);
    event BookReturned(uint256 indexed recordId, uint256 indexed bookId, address indexed borrower, uint256 fineAmount);
    event BorrowPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event FineRateUpdated(uint256 oldRate, uint256 newRate);

    // --- Modifiers ---
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert OnlyAdminAllowed();
        }
        _;
    }

    modifier onlyRegisteredMember() {
        if (!members[msg.sender].isRegistered) {
            revert OnlyRegisteredMemberAllowed();
        }
        _;
    }

    modifier isBookAvailable(uint256 _bookId) {
        if (_bookId == 0 || _bookId > bookCount) {
            revert BookNotFound();
        }
        if (!books[_bookId].isAvailable) {
            revert BookNotAvailable();
        }
        _;
    }

    constructor(uint256 _borrowPeriodDays, uint256 _fineRatePerDay) {
        if (_borrowPeriodDays == 0) {
            revert InvalidParameters();
        }
        admin = msg.sender;
        borrowPeriodDays = _borrowPeriodDays;
        fineRatePerDay = _fineRatePerDay;
    }

    // --- Admin Operations ---

    /**
     * @notice Registers a new library member with a default borrowing limit of 3 books.
     */
    function registerMember(address _memberAddress, string calldata _name) external onlyAdmin {
        if (_memberAddress == address(0)) {
            revert InvalidAddress();
        }
        if (bytes(_name).length == 0) {
            revert InvalidParameters();
        }
        if (members[_memberAddress].isRegistered) {
            revert MemberAlreadyRegistered();
        }

        members[_memberAddress] = Member({
            isRegistered: true,
            name: _name,
            currentBorrows: 0,
            maxBorrows: 3
        });

        memberCount++;
        emit MemberRegistered(_memberAddress, _name, 3);
    }

    /**
     * @notice Adds a new book to the library catalog.
     */
    function addBook(string calldata _title, string calldata _author) external onlyAdmin returns (uint256) {
        if (bytes(_title).length == 0 || bytes(_author).length == 0) {
            revert InvalidParameters();
        }

        bookCount++;
        uint256 newBookId = bookCount;

        books[newBookId] = Book({
            id: newBookId,
            title: _title,
            author: _author,
            isAvailable: true,
            currentBorrower: address(0)
        });

        emit BookAdded(newBookId, _title, _author);
        return newBookId;
    }

    function updateBorrowPeriod(uint256 _days) external onlyAdmin {
        if (_days == 0) {
            revert InvalidParameters();
        }
        uint256 oldPeriod = borrowPeriodDays;
        borrowPeriodDays = _days;
        emit BorrowPeriodUpdated(oldPeriod, _days);
    }

    function updateFineRate(uint256 _rate) external onlyAdmin {
        uint256 oldRate = fineRatePerDay;
        fineRatePerDay = _rate;
        emit FineRateUpdated(oldRate, _rate);
    }

    // --- Member Operations ---

    /**
     * @notice Borrows an available book for the caller.
     */
    function borrowBook(uint256 _bookId) external onlyRegisteredMember isBookAvailable(_bookId) returns (uint256) {
        Member storage member = members[msg.sender];
        if (member.currentBorrows >= member.maxBorrows) {
            revert BorrowLimitReached();
        }

        totalBorrows++;
        uint256 recordId = totalBorrows;
        uint256 dueDate = block.timestamp + (borrowPeriodDays * 1 days);

        // Update book status
        books[_bookId].isAvailable = false;
        books[_bookId].currentBorrower = msg.sender;

        // Update member active borrows
        member.currentBorrows++;

        // Create record
        borrowRecords[recordId] = BorrowRecord({
            bookId: _bookId,
            borrower: msg.sender,
            borrowTimestamp: block.timestamp,
            dueDate: dueDate,
            returnTimestamp: 0,
            fineAmount: 0,
            returned: false
        });

        memberHistory[msg.sender].push(recordId);

        emit BookBorrowed(recordId, _bookId, msg.sender, dueDate);
        return recordId;
    }

    /**
     * @notice Returns a borrowed book, calculates fine if overdue, and updates state.
     */
    function returnBook(uint256 _recordId) external returns (uint256 fine) {
        if (_recordId == 0 || _recordId > totalBorrows) {
            revert RecordNotFound();
        }

        BorrowRecord storage record = borrowRecords[_recordId];
        if (record.returned) {
            revert RecordAlreadyReturned();
        }
        if (record.borrower != msg.sender) {
            revert NotRecordBorrower();
        }

        uint256 bookId = record.bookId;
        uint256 returnTime = block.timestamp;
        fine = calculateFine(record.dueDate, returnTime);

        // Update record
        record.returned = true;
        record.returnTimestamp = returnTime;
        record.fineAmount = fine;

        // Free book
        books[bookId].isAvailable = true;
        books[bookId].currentBorrower = address(0);

        // Decrement member's current borrows
        if (members[msg.sender].currentBorrows > 0) {
            members[msg.sender].currentBorrows--;
        }

        emit BookReturned(_recordId, bookId, msg.sender, fine);
        return fine;
    }

    // --- Internal Calculation ---

    /**
     * @notice Calculates fine based on overdue days.
     * Overdue days are calculated by dividing overdue seconds by 1 day (with ceiling for partial days).
     */
    function calculateFine(uint256 _dueDate, uint256 _returnTime) internal view returns (uint256) {
        if (_returnTime <= _dueDate) {
            return 0;
        }
        uint256 overdueSeconds = _returnTime - _dueDate;
        // Ceiling division: any fraction of a day counts as 1 day overdue
        uint256 daysOverdue = (overdueSeconds + 1 days - 1) / 1 days;
        return daysOverdue * fineRatePerDay;
    }

    // --- View Functions ---

    /**
     * @notice Live estimate of fine for an active borrow record.
     */
    function estimateLiveFine(uint256 _recordId) external view returns (uint256) {
        if (_recordId == 0 || _recordId > totalBorrows) {
            revert RecordNotFound();
        }
        BorrowRecord memory record = borrowRecords[_recordId];
        if (record.returned) {
            return record.fineAmount;
        }
        return calculateFine(record.dueDate, block.timestamp);
    }

    function getBookDetails(uint256 _bookId) external view returns (
        uint256 id,
        string memory title,
        string memory author,
        bool isAvailable,
        address currentBorrower
    ) {
        if (_bookId == 0 || _bookId > bookCount) {
            revert BookNotFound();
        }
        Book memory b = books[_bookId];
        return (b.id, b.title, b.author, b.isAvailable, b.currentBorrower);
    }

    function getBorrowRecord(uint256 _recordId) external view returns (
        uint256 bookId,
        address borrower,
        uint256 borrowTimestamp,
        uint256 dueDate,
        uint256 returnTimestamp,
        uint256 fineAmount,
        bool returned
    ) {
        if (_recordId == 0 || _recordId > totalBorrows) {
            revert RecordNotFound();
        }
        BorrowRecord memory r = borrowRecords[_recordId];
        return (
            r.bookId,
            r.borrower,
            r.borrowTimestamp,
            r.dueDate,
            r.returnTimestamp,
            r.fineAmount,
            r.returned
        );
    }

    function getMemberHistory(address _member) external view returns (uint256[] memory) {
        return memberHistory[_member];
    }

    function getTotalCirculation() external view returns (uint256) {
        return totalBorrows;
    }

    function getMemberDetails(address _member) external view returns (
        bool isRegistered,
        string memory name,
        uint256 currentBorrows,
        uint256 maxBorrows
    ) {
        Member memory m = members[_member];
        return (m.isRegistered, m.name, m.currentBorrows, m.maxBorrows);
    }
}
