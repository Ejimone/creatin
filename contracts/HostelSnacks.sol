// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

    
//  a simple contract for a hostel snack ordering system, payment will be made in form of tokens
contract HostelSnacks {

    address public owner;

    Seller[] public sellersList;
    struct Snack{
        string name;
        uint256 price;
        uint256 quantity;
        string id;
    }

    mapping (string => Snack) snacks;
    mapping (string => uint256) name;
    mapping (address => Buyer) buyers;
    mapping (address => Seller) sellers;


    struct Buyer {
        address payable buyerAddress;
        string buyerUsername;
        uint256 amountSpent;
        string[] purchasedSnacks;
        string[] snackIds;
    }



    struct Seller {
        address payable sellerAddress;
        string sellerUsername;
        uint256 amountEarnings;
        string[] snackIds;
        string[] soldSnacks;
        uint256 totalSnacksSold;
        uint256 totalEarnings;
    }


    modifier onlySeller() {
        require(msg.sender == sellers[msg.sender].sellerAddress, "Only seller can perform this action");
        _;
    }

    modifier onlyBuyer() {
        require(msg.sender == buyers[msg.sender].buyerAddress, "Only buyer can perform this action");
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }


    event SnackAdded(string snackId, string name, uint256 price, uint256 quantity);
    event SnackPurchased(address buyer, string snackId, uint256 quantity, uint256 totalPrice);
    event SellerRegistered(address seller, string username);
    event BuyerRegistered(address buyer, string username);
    event SnackUpdated(string snackId, uint256 newPrice, uint256 newQuantity);
    event SnackDeleted(string snackId);
    event SnackSold(address seller, string snackId, uint256 quantity, uint256 totalEarnings);


    function registerSeller() public {
        require(sellers[msg.sender].sellerAddress == address(0), "Seller already registered");
        sellers[msg.sender] = Seller({
            sellerAddress: payable(msg.sender),
            sellerUsername: "",
            amountEarnings: 0,
            snackIds: new string[](0),
            soldSnacks: new string[](0),
            totalSnacksSold: 0,
            totalEarnings: 0
        });
        sellersList.push(sellers[msg.sender]);
        emit SellerRegistered(msg.sender, sellers[msg.sender].sellerUsername);
    }


    function registerBuyer(string memory _username) public {
        require(buyers[msg.sender].buyerAddress == address(0), "Buyer already registered");
        buyers[msg.sender] = Buyer({
            buyerAddress: payable(msg.sender),
            buyerUsername: _username,
            amountSpent: 0,
            purchasedSnacks: new string[](0),
            snackIds: new string[](0)
        });
        emit BuyerRegistered(msg.sender, _username);
    }


    function deleteBuyer() onlyOwner public {
        require(buyers[msg.sender].buyerAddress != address(0), "Buyer not registered");
        delete buyers[msg.sender];
    }
    function deleteSeller() onlyOwner public {
        require(sellers[msg.sender].sellerAddress != address(0), "Seller not registered");
        delete sellers[msg.sender];
        for (uint256 i = 0; i < sellersList.length; i++) {
            if (sellersList[i].sellerAddress == msg.sender) {
                sellersList[i] = sellersList[sellersList.length - 1];
                sellersList.pop();
                break;
            }
        }
    }


    function addSnack(string memory _name, uint256 _price, uint256 _quantity, string memory _id) onlySeller public {
        require(bytes(_name).length > 0, "Snack name cannot be empty");
        require(_price > 0, "Price cannot be zero");
        require(_quantity > 0, "Quantity cannot be zero");
        require(bytes(_id).length > 0, "Snack ID cannot be empty");
        require(snacks[_id].quantity == 0, "Snack with this ID already exists");
        snacks[_id] = Snack({
            name: _name, 
            price: _price,
            quantity: _quantity,
            id: _id
        });
        name[_name] = _price;
        sellers[msg.sender].snackIds.push(_id);
        sellers[msg.sender].totalSnacksSold += _quantity;
        emit SnackAdded(_id, _name, _price, _quantity);
    }

    function buySnack(string memory _snackId, uint256 _quantity) onlyBuyer public payable {
        require(bytes(_snackId).length > 0, "Snack ID cannot be empty");
        require(snacks[_snackId].quantity >= _quantity, "Not enough quantity available");
        require(msg.value >= snacks[_snackId].price * _quantity, "Insufficient payment");
        require(buyers[msg.sender].buyerAddress != address(0), "Buyer not registered");
        snacks[_snackId].quantity -= _quantity;
        buyers[msg.sender].amountSpent += snacks[_snackId].price * _quantity;
        buyers[msg.sender].purchasedSnacks.push(snacks[_snackId].name);
        buyers[msg.sender].snackIds.push(_snackId);
        sellers[msg.sender].amountEarnings += snacks[_snackId].price * _quantity;
        sellers[msg.sender].soldSnacks.push(snacks[_snackId].name);
        sellers[msg.sender].totalEarnings += snacks[_snackId].price * _quantity;
        sellers[msg.sender].totalSnacksSold += _quantity;
        emit SnackPurchased(msg.sender, _snackId, _quantity, snacks[_snackId].price * _quantity);
        emit SnackSold(msg.sender, _snackId, _quantity, snacks[_snackId].price * _quantity);
        emit SnackUpdated(_snackId, snacks[_snackId].price, snacks[_snackId].quantity);
    }

    function updateSnack(string memory _snackId, uint256 _newPrice, uint256 _newQuantity) onlySeller public {
        require(bytes(_snackId).length > 0, "Snack ID cannot be empty");
        require(snacks[_snackId].quantity > 0, "Snack does not exist");
        require(_newPrice > 0, "New price cannot be zero");
        require(_newQuantity >= 0, "New quantity cannot be negative");
        snacks[_snackId].price = _newPrice;
        snacks[_snackId].quantity = _newQuantity;
        emit SnackUpdated(_snackId, _newPrice, _newQuantity);
    }


    function deleteSnack(string memory _snackId) onlySeller public {
        require(bytes(_snackId).length > 0, "Snack ID cannot be empty");
        require(snacks[_snackId].quantity > 0, "Snack does not exist");
        delete snacks[_snackId];
        for (uint256 i = 0; i < sellers[msg.sender].snackIds.length; i++) {
            if (keccak256(abi.encodePacked(sellers[msg.sender].snackIds[i])) == keccak256(abi.encodePacked(_snackId))) {
                sellers[msg.sender].snackIds[i] = sellers[msg.sender].snackIds[sellers[msg.sender].snackIds.length - 1];
                sellers[msg.sender].snackIds.pop();
                break;
            }
        }
        emit SnackDeleted(_snackId);
    }


    function getSnack(string memory _snackId) public view returns (string memory, uint256, uint256) {
        require(bytes(_snackId).length > 0, "Snack ID cannot be empty");
        require(snacks[_snackId].quantity > 0, "Snack does not exist");
        Snack memory snack = snacks[_snackId];
        return (snack.name, snack.price, snack.quantity);
    }

    function getSeller(address _sellerAddress) public view returns (string memory, uint256, string[] memory, string[] memory, uint256, uint256) {
        require(sellers[_sellerAddress].sellerAddress != address(0), "Seller not registered");
        Seller memory seller = sellers[_sellerAddress];
        return (seller.sellerUsername, seller.amountEarnings, seller.snackIds, seller.soldSnacks, seller.totalSnacksSold, seller.totalEarnings);
    }


    function getBuyer(address _buyerAddress) public view returns (string memory, uint256, string[] memory, string[] memory) {
        require(buyers[_buyerAddress].buyerAddress != address(0), "Buyer not registered");
        Buyer memory buyer = buyers[_buyerAddress];
        return (buyer.buyerUsername, buyer.amountSpent, buyer.purchasedSnacks, buyer.snackIds);
    }

    function getAllSellers() public view returns (Seller[] memory) {
        return sellersList;
    }

    function getAllSnacks() public view returns (Snack[] memory) {
        Snack[] memory allSnacks = new Snack[](sellersList.length);
        for (uint256 i = 0; i < sellersList.length; i++) {
            allSnacks[i] = snacks[sellersList[i].snackIds[0]]; // Assuming each seller has at least one snack
        }
        return allSnacks;
    }

    function refundBuyer(address payable _buyerAddress, uint256 _amount) onlyOwner public {
        require(buyers[_buyerAddress].buyerAddress != address(0), "Buyer not registered");
        require(_amount > 0, "Refund amount must be greater than zero");
        require(buyers[_buyerAddress].amountSpent >= _amount, "Insufficient amount spent by buyer");
        buyers[_buyerAddress].amountSpent -= _amount;
        _buyerAddress.transfer(_amount);
    }
    
}
