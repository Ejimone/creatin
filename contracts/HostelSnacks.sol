// spdx-license-identifier: MIT
pragma solidity ^0.8.0;


//  a simple contract for a hostel snack ordering system, payment will be made in form of tokens
contract HostelSnacks {
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


}