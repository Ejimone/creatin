// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OwnedToken.sol";

contract TokenCreator {
    function createToken(bytes32 name) public returns (OwnedToken tokenAddress) {
        return new OwnedToken(name);
    }

    function changeName(OwnedToken tokenAddress, bytes32 name) public {
        tokenAddress.changeName(name);
    }

    function isTokenTransferOK(address currentAddress, address newOwner) public pure returns (bool ok) {
        return keccak256(abi.encodePacked(currentAddress)) != keccak256(abi.encodePacked(newOwner));
    }
}