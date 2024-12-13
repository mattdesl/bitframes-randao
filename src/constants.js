export const CONTRACTS_MAINNET = {
  CROWDFUND: {
    address: "0x642fEd40AeD8e7A7CF7c4CFf77F2529a4348ccC3",
    fromBlock: 21215952,
  },
  NFT_OPEN: {
    type: "open",
    id: "673b4d388cec5b07a4b6d4bf",
    address: "0x2c7f335460fB9dF460FF7AD6CC64cb7Dd4064862",
    mechanicVectorId:
      "0x15a6cd191610404c0d149688accc6b481cd673b8b00e75ad00511e082f279e1b",
    fromBlock: 21215165,
  },
  NFT_LIMITED: {
    type: "limited",
    id: "673b4dfa884babe951adfc82",
    address: "0xd4621fc799B88605A4a00B0D2A3415aba9EAc5Dc",
    mechanicVectorId:
      "0x6608408c1eb5727ec0af52329893a0f0ce1036a762df6b10e07dd3283ee80308",
    fromBlock: 21215183,
  },
};

// The computed and predicted blocks
// The first and last are 'null' as they should be counted from the
// beginning of the minting, and end of the minting, respectively, rather than a set block number
// Note these are the 'ending' ranges for each week, so number at index 1 == Week 1 ending block (exclusive)
export const WEEKLY_BLOCK_RANGE = [null, 21294592, 21344588, 21394584, null];

// The bridge address
export const BRIDGE_ADDRESS_LOWERCASE =
  "0xb90ed4c123843cbFD66b11411Ee7694eF37E6E72".toLowerCase();

// The 'team' (any user/wallet directly involved with creating the Bitframes project)
// are excluded from being able to win one of the 32 bit editions
export const ADDRESSES_TO_EXCLUDE_LOWERCASE = [
  "0x26EE3dfcA1108Ac16d6fcBcc8da61a2E837BDAF5",
  "0x0Ac5c458958ee68834b7542F8c0e555b6dE64501",
  "0x694e46301e36a18577308CB548fd94E99c302AdE",
  "0x721d33bF4029c84DBeDfC328a0292ea99CdfAA0C",
  "0x86521454067C91CEEaAE357bc6BD2037c804A719",
  "0x2635F0Dd2B8e8d1f044336882dcdccAc7D1E4B8B",
  "0x7Cc5051313C91F83119C2AdE70509A5214c53970",
  "0x6E52A35372065f65c8EBB4ea25DB574f884fF2c1",
  "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833",
  "0x32262672C6D1B814019f4Ca4e2fc53285a919704",
  "0xA49958fa14309F3720159c83cD92C5F38B1e3306",
  BRIDGE_ADDRESS_LOWERCASE,
].map((n) => n.toLowerCase());
