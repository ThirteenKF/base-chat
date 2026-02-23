export const EncryptedBaseChatABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct inEuint32",
        "name": "encryptedContent",
        "type": "tuple"
      }
    ],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ctHash",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "securityZone",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "utype",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct inEuint32[]",
        "name": "encryptedContents",
        "type": "tuple[]"
      }
    ],
    "name": "sendBatchMessages",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "messageId",
        "type": "uint256"
      }
    ],
    "name": "getMessage",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user2",
        "type": "address"
      }
    ],
    "name": "getConversation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "euint32",
            "name": "encryptedContent",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct EncryptedBaseChat.Message[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalMessages",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "messages",
    "outputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "euint32",
        "name": "encryptedContent",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];