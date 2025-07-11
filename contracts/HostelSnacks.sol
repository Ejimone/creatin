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
}