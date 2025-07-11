// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TokenCreator.sol";

contract OwnedToken {
    TokenCreator creator;
    address owner;
    bytes32 name;



    constructor(bytes32 name_) {
        owner = msg.sender;
        creator = TokenCreator(msg.sender);
        name = name_;
    }


    function changeName(bytes32 newName) public {
        if (msg.sender != owner) return;
        name = newName;
    }


    function transfer(address newOwner) public {
        if (msg.sender != owner) return;
        owner = newOwner;
    }    
}