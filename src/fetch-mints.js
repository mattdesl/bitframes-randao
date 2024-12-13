import { ethers } from "ethers";
import "dotenv/config";
import { writeFile } from "fs/promises";
import ABI_SeedUpdate from "./contracts/SeedUpdate.ABI.js";
import { CONTRACTS_MAINNET, WEEKLY_BLOCK_RANGE } from "./constants.js";

const WEEK = process.argv[2] || 1;

// The "from" is the last week's ending block, or the origin in week 1
const fromBlock =
  WEEK == 1
    ? CONTRACTS_MAINNET.CROWDFUND.fromBlock
    : WEEKLY_BLOCK_RANGE[WEEK - 1];

// The "to" is this week's ending block, exclusive (it will be counted for the next week)
// or the terminal block in week 4 (given manually)
let toBlock;
if (WEEK == 4) {
  toBlock = parseInt(process.argv[3], 10);
  if (!toBlock) throw new Error("week 4 must specify block manually");
} else {
  toBlock = WEEKLY_BLOCK_RANGE[WEEK] - 1;
}

const dry = process.argv.includes("--dry");
const network = process.env.NETWORK || "mainnet";

console.log("\n------ FETCHING MINTS ------");
console.log(`  WEEK:`, WEEK);
console.log(`  FROM_BLOCK:`, fromBlock);
console.log(`  TO_BLOCK:`, toBlock);
console.log(`  CONTRACT:`, CONTRACTS_MAINNET.CROWDFUND.address);

if (!dry) {
  const provider = new ethers.InfuraProvider(
    network,
    process.env.INFURA_API_KEY
  );
  const contract = new ethers.Contract(
    CONTRACTS_MAINNET.CROWDFUND.address,
    ABI_SeedUpdate,
    provider
  );

  const logs = await provider.getLogs({
    fromBlock,
    toBlock,
    address: CONTRACTS_MAINNET.CROWDFUND.address,
    topics: [
      ethers.id(
        "SeedUpdate(address,address,uint256,bytes32,bool,address,uint32,uint256)"
      ),
    ],
  });

  const mints = [];
  for (let log of logs) {
    // in case we get any pending events, just ignore
    if (log.transactionHash == null) {
      console.warn("WARN: Skipping pending...");
      continue;
    }

    const removed = log.removed;
    if (removed) {
      console.warn("WARN: Skipping { removed } log with data:", log);
      continue;
    }
    const data = contract.interface.parseLog(log);
    const { nftContract, invoker, tokenId, isMint, mintRecipient } = data.args;
    if (isMint && nftContract == CONTRACTS_MAINNET.NFT_OPEN.address) {
      mints.push([Number(tokenId), String(invoker), String(mintRecipient)]);
    }
  }

  console.log("  TOTAL_MINTS:", mints.length);
  if (mints.length >= 2) {
    // ensure token IDs are all consecutive
    const first = mints[0];
    const startID = first[0];
    for (let i = 0; i < mints.length; i++) {
      const expectedID = startID + i;
      if (expectedID !== mints[i][0]) {
        throw new Error(
          "Non-consecutive Token ID #%s minted by %s",
          mints[i][0],
          mints[i][1]
        );
      }
    }
  }

  const csv = mints.map((args) => args.join(",")).join("\n");
  await writeFile(`output/week-${WEEK}.csv`, csv);
}
