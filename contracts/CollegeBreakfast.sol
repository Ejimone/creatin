// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title CollegeBreakfast
/// @dev A smart contract for a college mess system where students can order food.
/// The contract manages student registration, food ordering, and portal status.
contract CollegeBreakfast {
    address public owner;
    address public warden;

    enum PortalStatus { Closed, Open }
    PortalStatus public portalStatus;

    struct Order {
        string foodItem;
        uint256 orderTime;
    }

    mapping(address => bool) public isStudentRegistered;
    mapping(address => Order[]) public studentOrders;
    mapping(address => uint256) public studentOrderCount;

    address[] private registeredStudentsList;
    mapping(address => uint256) private studentToIndex;

    event PortalStatusChanged(PortalStatus newStatus);
    event StudentRegistrationChanged(address indexed student, bool isRegistered);
    event FoodOrdered(address indexed student, string foodItem);
    event FoodOrderCancelled(address indexed student, string foodItem);

    modifier onlyWarden() {
        require(msg.sender == warden, "Only the warden can call this function");
        _;
    }

    modifier onlyStudent() {
        require(isStudentRegistered[msg.sender], "Only registered students can call this function");
        _;
    }

    constructor(address _warden) {
        owner = msg.sender;
        warden = _warden;
        portalStatus = PortalStatus.Closed;
    }

    /// @dev Opens the food ordering portal. Can only be called by the warden.
    function openPortal() public onlyWarden {
        require(portalStatus == PortalStatus.Closed, "Portal is already open");
        portalStatus = PortalStatus.Open;
        emit PortalStatusChanged(PortalStatus.Open);
    }

    /// @dev Closes the food ordering portal. Can only be called by the warden.
    function closePortal() public onlyWarden {
        require(portalStatus == PortalStatus.Open, "Portal is already closed");
        portalStatus = PortalStatus.Closed;
        emit PortalStatusChanged(PortalStatus.Closed);
    }

    /// @dev Registers a new student. Can only be called by the warden.
    /// @param _student The address of the student to register.
    function registerStudent(address _student) public onlyWarden {
        require(!isStudentRegistered[_student], "Student is already registered");
        isStudentRegistered[_student] = true;
        studentToIndex[_student] = registeredStudentsList.length;
        registeredStudentsList.push(_student);
        emit StudentRegistrationChanged(_student, true);
    }

    /// @dev Unregisters an existing student. Can only be called by the warden.
    /// @param _student The address of the student to unregister.
    function unregisterStudent(address _student) public onlyWarden {
        require(isStudentRegistered[_student], "Student is not registered");

        uint256 index = studentToIndex[_student];
        address lastStudent = registeredStudentsList[registeredStudentsList.length - 1];

        registeredStudentsList[index] = lastStudent;
        studentToIndex[lastStudent] = index;

        registeredStudentsList.pop();
        delete studentToIndex[_student];
        isStudentRegistered[_student] = false;

        emit StudentRegistrationChanged(_student, false);
    }

    /// @dev Allows a registered student to order a food item when the portal is open.
    /// @param _foodItem The name of the food item to order.
    function orderFood(string memory _foodItem) public {
        require(isStudentRegistered[msg.sender], "Student is not registered");
        require(portalStatus == PortalStatus.Open, "Portal is not open");
        require(studentOrderCount[msg.sender] < 4, "You have already ordered 4 times today");
        require(bytes(_foodItem).length > 0, "Food item cannot be empty");

        studentOrders[msg.sender].push(Order({
            foodItem: _foodItem,
            orderTime: block.timestamp
        }));
        studentOrderCount[msg.sender]++;

        emit FoodOrdered(msg.sender, _foodItem);
    }

    /// @dev Retrieves the last order for a given student.
    /// @param _student The address of the student.
    /// @return The last food item ordered and the time of the order.
    function getLastOrder(address _student) public view returns (string memory, uint256) {
        require(studentOrders[_student].length > 0, "Student has no orders");
        Order storage lastOrder = studentOrders[_student][studentOrders[_student].length - 1];
        return (lastOrder.foodItem, lastOrder.orderTime);
    }


    function getStudentOrderCount(address _student) public view returns (uint256) {
        require(isStudentRegistered[_student], "student is not registered");
        return studentOrderCount[_student];
    }


    /// @dev Returns the total number of food orders made by all registered students
    function getTotalOrders() public view returns (uint256 totalOrders) {
        address[] memory registeredStudents = getAllRegisteredStudents();
        for (uint256 i = 0; i < registeredStudents.length; i++) {
            totalOrders += studentOrders[registeredStudents[i]].length;
        }
        return totalOrders;
    }
    
    /// @dev Returns an array of all registered student addresses
    function getAllRegisteredStudents() internal view returns (address[] memory) {
        return registeredStudentsList;
    }


    /// @dev the student can cancel order, only if the time of the order is not upto 5 mins
    function cancelOrder() private {
        require(isStudentRegistered[msg.sender], "student is not registered");
        require(studentOrderCount[msg.sender] > 0, "No orders to cancel");
        Order[] storage orders = studentOrders[msg.sender];
        require(orders.length > 0, "No orders to cancel");
        Order storage lastOrder = orders[orders.length - 1];
        require(block.timestamp - lastOrder.orderTime <= 5 minutes, "Cannot cancel order after 5 minutes");
        orders.pop();
        studentOrders[msg.sender] = orders;
        studentOrderCount[msg.sender]--;
        emit FoodOrderCancelled(msg.sender, lastOrder.foodItem);

    }
}
    