// from: https://etherscan.io/chart/blocktime
// https://etherscan.io/block/countdown/N gives us something that is closer to this number
const AVG_BLOCK_TIME_MS = 12.097 * 1000; // N seconds in milliseconds

// Reference block number and times from ./fetch-block-refs.js
const REFERENCE = {
  networks: {
    sepolia: {
      blockNumber: 7123397,
      timestamp: 1732202628000,
    },
    mainnet: {
      blockNumber: 21236977,
      timestamp: 1732202627000,
    },
  },
  timestamp: 1732202635304,
};

// Given a date, predict its block number
export function predictBlock(date, network = "mainnet", reference = REFERENCE) {
  const ref = reference.networks[network];
  // Reference block number and its corresponding timestamp (in milliseconds)
  const refBlockNumber = ref.blockNumber;
  const refTimestamp = ref.timestamp;

  // Convert the input date to a timestamp (in milliseconds)
  const targetTimestamp = new Date(date).getTime();

  // Calculate the time difference in milliseconds
  const timeDifference = targetTimestamp - refTimestamp;

  // Calculate the difference in blocks
  const blockDifference = Math.round(timeDifference / AVG_BLOCK_TIME_MS);

  // Estimate the block number
  const estimatedBlockNumber = refBlockNumber + blockDifference;

  return estimatedBlockNumber;
}

// Given a block number, predict its date
export function predictDate(
  blockNumber,
  network = "mainnet",
  reference = REFERENCE
) {
  const ref = reference.networks[network];
  // Reference block number and its corresponding timestamp (in milliseconds)
  const refBlockNumber = ref.blockNumber; // Approximate block number on October 1, 2023
  const refTimestamp = ref.timestamp; // Timestamp of reference block (ms)

  // Calculate the difference in blocks from the reference block
  const blockDifference = blockNumber - refBlockNumber;

  // Calculate the time difference in milliseconds
  const timeDifference = blockDifference * AVG_BLOCK_TIME_MS;

  // Estimate the timestamp of the target block
  const estimatedTimestamp = refTimestamp + timeDifference;

  // Return the estimated date as a JavaScript Date object
  return new Date(estimatedTimestamp);
}

export function addTimeToBlock(blockNumber, deltaTimeMs) {
  // Calculate the number of blocks to add, rounding to the nearest block slot
  const blocksToAdd = Math.round(deltaTimeMs / AVG_BLOCK_TIME_MS);

  // Compute the final block number
  return blockNumber + blocksToAdd;
}

// 7 days in milliseconds
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

const network = "mainnet";
const SALE_START_DATE = new Date("2024-11-22T17:00:00Z");
console.log("Crowdfund Start:", SALE_START_DATE.toUTCString());
const saleStartPredictedBlock = predictBlock(SALE_START_DATE, network);
console.log("Predicted Block:", saleStartPredictedBlock);

// const SALE_START_DATE = new Date("2024-10-10T17:00:00Z");
const blocks = [saleStartPredictedBlock];
const weekCount = 4;
for (let i = 0; i < weekCount; i++) {
  const nextBlock = addTimeToBlock(blocks[blocks.length - 1], SEVEN_DAYS_IN_MS);
  blocks.push(nextBlock);
}

console.log("BLOCKS");
console.log(blocks);

for (let b of blocks) {
  console.log(b, predictDate(b, network).toUTCString());
}
