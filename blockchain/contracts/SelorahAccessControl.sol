// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * SelorahAccessControl
 *
 * Time-bound sharing primitives for the Selorah patient flow.
 *
 * The application hashes each generated QR token before calling this contract.
 * A patient grants access for a duration, can revoke it at any time, and a
 * reader can verify validity before serving a record. A duration of zero means
 * "no expiry" and matches the "None" option in the QR screen.
 */
contract SelorahAccessControl is Ownable {
    struct AccessGrant {
        address patient;
        uint256 grantedAt;
        uint256 expiresAt;
        bool revoked;
        bool exists;
    }

    /// @notice Sentinel used by grants that do not expire.
    uint256 public constant NO_EXPIRY = type(uint256).max;

    mapping(bytes32 => AccessGrant) private _grants;

    event AccessGranted(
        bytes32 indexed tokenHash,
        address indexed patient,
        uint256 expiresAt
    );
    event AccessRevoked(
        bytes32 indexed tokenHash,
        address indexed patient,
        address indexed revokedBy
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create or replace a grant for a hashed QR token.
     * @dev Callable by any patient wallet, not only the contract owner.
     *      A token that already belongs to another patient cannot be taken over.
     * @param tokenHash keccak256 hash of the QR token.
     * @param durationSeconds Lifetime in seconds. Zero means no expiry.
     * @return expiresAt Absolute expiry timestamp, or NO_EXPIRY.
     */
    function grantAccess(
        bytes32 tokenHash,
        uint256 durationSeconds
    ) external returns (uint256 expiresAt) {
        require(tokenHash != bytes32(0), "Empty token");

        AccessGrant storage grant = _grants[tokenHash];
        require(
            !grant.exists || grant.patient == msg.sender,
            "Token belongs to another patient"
        );

        uint256 expiry = durationSeconds == 0
            ? NO_EXPIRY
            : block.timestamp + durationSeconds;

        grant.patient = msg.sender;
        grant.grantedAt = block.timestamp;
        grant.expiresAt = expiry;
        grant.revoked = false;
        grant.exists = true;

        emit AccessGranted(tokenHash, msg.sender, expiry);
        return expiry;
    }

    /**
     * @notice Revoke a grant immediately.
     * @dev The patient who created the grant can revoke it. The contract owner
     *      can also revoke as an emergency safety measure.
     */
    function revokeAccess(bytes32 tokenHash) external {
        AccessGrant storage grant = _grants[tokenHash];
        require(grant.exists, "Grant not found");
        require(
            grant.patient == msg.sender || msg.sender == owner(),
            "Not allowed to revoke"
        );
        require(!grant.revoked, "Already revoked");

        grant.revoked = true;
        emit AccessRevoked(tokenHash, grant.patient, msg.sender);
    }

    /**
     * @notice True only while the grant is active and has not expired.
     */
    function isAccessValid(bytes32 tokenHash) public view returns (bool) {
        AccessGrant storage grant = _grants[tokenHash];
        if (!grant.exists || grant.revoked) return false;
        if (grant.expiresAt == NO_EXPIRY) return true;
        return block.timestamp < grant.expiresAt;
    }

    /**
     * @notice Seconds remaining before expiry. Zero when invalid or expired.
     */
    function remainingSeconds(bytes32 tokenHash) external view returns (uint256) {
        AccessGrant storage grant = _grants[tokenHash];
        if (!isAccessValid(tokenHash)) return 0;
        if (grant.expiresAt == NO_EXPIRY) return NO_EXPIRY;
        return grant.expiresAt - block.timestamp;
    }

    /**
     * @notice Read the full grant for a token hash.
     */
    function getGrant(bytes32 tokenHash) external view returns (AccessGrant memory) {
        return _grants[tokenHash];
    }
}
