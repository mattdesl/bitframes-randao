export default [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "nftContract",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "invoker",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "newSeed",
        type: "bytes32",
      },
      { indexed: false, internalType: "bool", name: "isMint", type: "bool" },
      {
        indexed: false,
        internalType: "address",
        name: "mintRecipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "numMinted",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paymentAmount",
        type: "uint256",
      },
    ],
    name: "SeedUpdate",
    type: "event",
  },
];
