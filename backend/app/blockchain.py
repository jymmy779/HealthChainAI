import json
from web3 import Web3
from .config import settings

# Human-readable ABI for HealthRecordRegistry
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "recordId", "type": "string"},
            {"internalType": "string", "name": "patientId", "type": "string"},
            {"internalType": "string", "name": "ipfsHash", "type": "string"},
            {"internalType": "string", "name": "fileHash", "type": "string"}
        ],
        "name": "registerRecord",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "recordId", "type": "string"}
        ],
        "name": "getRecord",
        "outputs": [
            {"internalType": "string", "name": "patientId", "type": "string"},
            {"internalType": "string", "name": "ipfsHash", "type": "string"},
            {"internalType": "string", "name": "fileHash", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "registeredBy", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

def get_web3_client():
    rpc_url = getattr(settings, "BLOCKCHAIN_RPC_URL", "http://localhost:8545")
    if not rpc_url:
        return None
    try:
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        if w3.is_connected():
            return w3
    except Exception as e:
        print(f"Blockchain node connection warning: {e}")
    return None

def register_record_on_blockchain(
    record_id: str,
    patient_id: str,
    ipfs_hash: str,
    file_hash: str
) -> str:
    w3 = get_web3_client()
    if not w3:
        print("Blockchain node not connected. Generating mock transaction hash...")
        import uuid
        return f"0xmock{uuid.uuid4().hex}{uuid.uuid4().hex[:8]}"

    try:
        contract_address = getattr(settings, "CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
        private_key = getattr(settings, "BLOCKCHAIN_PRIVATE_KEY", "")

        if not private_key:
            print("BLOCKCHAIN_PRIVATE_KEY is empty. Generating mock transaction hash...")
            import uuid
            return f"0xmock{uuid.uuid4().hex}{uuid.uuid4().hex[:8]}"

        # Clean private key format
        if private_key.startswith("0x"):
            private_key_bytes = bytes.fromhex(private_key[2:])
        else:
            private_key_bytes = bytes.fromhex(private_key)

        account = w3.eth.account.from_key(private_key_bytes)
        sender_address = account.address

        # Instantiate contract
        contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=CONTRACT_ABI)

        # Build transaction
        nonce = w3.eth.get_transaction_count(sender_address)
        
        # Estimate gas or use default
        try:
            gas_estimate = contract.functions.registerRecord(
                record_id, patient_id, ipfs_hash, file_hash
            ).estimate_gas({"from": sender_address})
        except Exception:
            gas_estimate = 300000

        tx = contract.functions.registerRecord(
            record_id, patient_id, ipfs_hash, file_hash
        ).build_transaction({
            'chainId': w3.eth.chain_id,
            'gas': int(gas_estimate * 1.2),
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })

        # Sign transaction
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key_bytes)
        
        # Send raw transaction
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        # Wait for transaction receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
        return receipt.transactionHash.hex()

    except Exception as e:
        print(f"Failed to submit transaction to blockchain: {e}")
        import uuid
        return f"0xmockerr{uuid.uuid4().hex[:32]}"

def get_record_from_blockchain(record_id: str) -> dict:
    """Truy vấn thông tin record đã đăng ký trên blockchain."""
    w3 = get_web3_client()
    if not w3:
        print("Blockchain node not connected. Returning None...")
        return None

    try:
        contract_address = getattr(settings, "CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3")
        contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=CONTRACT_ABI)
        
        # Gọi view function getRecord
        record_data = contract.functions.getRecord(record_id).call()
        return {
            "patient_id": record_data[0],
            "ipfs_hash": record_data[1],
            "file_hash": record_data[2],
            "timestamp": record_data[3],
            "registered_by": record_data[4]
        }
    except Exception as e:
        print(f"Failed to fetch record from blockchain: {e}")
        return None
