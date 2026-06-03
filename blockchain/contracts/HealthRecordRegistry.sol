// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthRecordRegistry {
    struct Record {
        string patientId;
        string ipfsHash;
        string fileHash; // Keccak256 hash or SHA256 of the file content
        uint256 timestamp;
        address registeredBy;
    }

    // mapping from recordId (UUID string) to Record struct
    mapping(string => Record) private _records;
    
    // mapping from recordId to existence boolean
    mapping(string => bool) private _recordExists;

    event RecordRegistered(
        string indexed recordId,
        string indexed patientId,
        string ipfsHash,
        string fileHash,
        uint256 timestamp,
        address registeredBy
    );

    error RecordAlreadyRegistered(string recordId);
    error RecordNotFound(string recordId);

    /**
     * @dev Register a new health record on the blockchain.
     * @param recordId The unique identifier of the health record (typically a UUID).
     * @param patientId The identifier of the patient (UUID).
     * @param ipfsHash The IPFS hash where the file and metadata are stored.
     * @param fileHash The integrity hash of the uploaded file.
     */
    function registerRecord(
        string calldata recordId,
        string calldata patientId,
        string calldata ipfsHash,
        string calldata fileHash
    ) external {
        if (_recordExists[recordId]) {
            revert RecordAlreadyRegistered(recordId);
        }

        _records[recordId] = Record({
            patientId: patientId,
            ipfsHash: ipfsHash,
            fileHash: fileHash,
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });
        
        _recordExists[recordId] = true;

        emit RecordRegistered(
            recordId,
            patientId,
            ipfsHash,
            fileHash,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Retrieve the record details.
     * @param recordId The unique identifier of the health record.
     */
    function getRecord(string calldata recordId)
        external
        view
        returns (
            string memory patientId,
            string memory ipfsHash,
            string memory fileHash,
            uint256 timestamp,
            address registeredBy
        )
    {
        if (!_recordExists[recordId]) {
            revert RecordNotFound(recordId);
        }

        Record memory rec = _records[recordId];
        return (
            rec.patientId,
            rec.ipfsHash,
            rec.fileHash,
            rec.timestamp,
            rec.registeredBy
        );
    }
}
