// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SelorahAccessControl is Ownable {
    
    struct AccessLog {
        bytes32 qrTokenHash;
        uint256 expiresAt;
        bool isValid;
    }
    
    mapping(bytes32 => AccessLog) public accessHashedTokens;
    
    event AccessGranted(bytes32 indexed qrTokenHash, uint256 expiresAt);
    event AccessRevoked(bytes32 indexed qrTokenHash);
    
    constructor() Ownable(msg.sender) {}

    function grantAccess(bytes32 _qrTokenHash, uint256 _durationSeconds) external onlyOwner {
        uint256 expiration = block.timestamp + _durationSeconds;
        accessHashedTokens[_qrTokenHash] = AccessLog({
            qrTokenHash: _qrTokenHash,
            expiresAt: expiration,
            isValid: true
        });
        emit AccessGranted(_qrTokenHash, expiration);
    }

    function revokeAccess(bytes32 _qrTokenHash) external onlyOwner {
        accessHashedTokens[_qrTokenHash].isValid = false;
        emit AccessRevoked(_qrTokenHash);
    }

    function isAccessValid(bytes32 _qrTokenHash) public view returns (bool) {
        AccessLog memory log = accessHashedTokens[_qrTokenHash];
        if (!log.isValid) return false;
        if (block.timestamp > log.expiresAt) return false;
        return true;
    }
}
