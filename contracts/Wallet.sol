// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



/// @title a smart contract for sending and receiving funds
/// @author Evidence Ejimone
/// @notice This contract allows users to deposit and withdraw funds
/// @dev This contract uses the receive function to handle incoming Ether transfers

contract Wallet {
    address payable public owner;
    uint256 public balance;
    address[] public depositors;
    
    // Mapping to track if an address has deposited before
    mapping(address => bool) public hasDeposited;
    
    // Mapping to track individual depositor balances
    mapping(address => uint256) public depositorBalances;
    
    // Counter for total number of deposits
    uint256 public totalDeposits;

    // Events
    event Deposited(address indexed depositor, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed owner, uint256 amount, uint256 newBalance);
    event DepositRefunded(address indexed depositor, uint256 amount);

    /// @notice Constructor to set the owner of the contract
    constructor() {
        owner = payable(msg.sender);
        balance = 0;
        // Don't add owner to depositors array initially
    }



    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        require(msg.sender != address(0), "Invalid sender address");
        require(msg.sender != owner, "Owner cannot deposit to their own wallet");
        require(msg.sender != address(this), "Contract cannot deposit to itself");

        // Update contract balance
        balance += msg.value;
        
        // Update depositor's individual balance
        depositorBalances[msg.sender] += msg.value;
        
        // Only add to depositors array if first-time depositor
        if (!hasDeposited[msg.sender]) {
            depositors.push(msg.sender);
            hasDeposited[msg.sender] = true;
        }
        // Increment total deposits counter
        totalDeposits++;
        
        // Emit deposit event
        emit Deposited(msg.sender, msg.value, balance);
    }


    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        require(amount > 0, "Withdrawal amount must be greater than zero");
        require(amount <= balance, "cant withdraw more than balance");
        // the withdrawal logic
        balance -= amount;
        owner.transfer(amount);
        emit Withdrawn(owner, amount, balance);
    }


    function refundDeposit(address payable depositor) external {
        require(msg.sender == owner, "only the owner can refund deposits");
        require(!hasDeposited[depositor], "Depositor has not made a deposit");
        require(depositorBalances[depositor] > 0, "Depositor has no balance to refund");

        uint256 refundAmount = depositorBalances[depositor];
        if (balance >= refundAmount) {
            balance -= refundAmount;
            depositor.transfer(refundAmount);
            
            emit DepositRefunded(depositor, refundAmount);
        }
    }


    function getDepositors() external view returns (address[] memory) {
        return depositors;
    }

}