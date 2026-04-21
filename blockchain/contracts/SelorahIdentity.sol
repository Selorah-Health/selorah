// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SelorahIdentity is Ownable {
    
    // Mapping from UID (string) to an provisioned wallet address
    mapping(string => address) public uidToWalletAddress;

    event IdentityProvisioned(string uid, address wallet);

    constructor() Ownable(msg.sender) {}

    function provisionIdentity(string memory _uid, address _wallet) external onlyOwner {
        require(uidToWalletAddress[_uid] == address(0), "UID already provisioned");
        uidToWalletAddress[_uid] = _wallet;
        emit IdentityProvisioned(_uid, _wallet);
    }

    function getWalletAddress(string memory _uid) external view returns (address) {
        return uidToWalletAddress[_uid];
    }
}
