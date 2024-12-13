import { ethers } from "ethers";
import "dotenv/config";
import {
  WEEKLY_BLOCK_RANGE,
  ADDRESSES_TO_EXCLUDE_LOWERCASE,
} from "./constants.js";
import { readFile } from "fs/promises";
import { getMinters } from "./get-minters.js";

const week = process.argv[2];
if (!week) throw new Error("no week param");
if (week < 1 || week > 4) throw new Error("invalid week param");

const blockNumber = WEEKLY_BLOCK_RANGE[week] - 1;
const csv = `output/week-${week}.csv`;

const network = process.env.NETWORK || "mainnet";
const secretKey = process.env[`SECRET_KEY_WEEK_${week}`];
if (!network || !blockNumber || !secretKey) throw new Error("malformed input");

const csvStr = await readFile(csv, "utf8");
const allMints = getMinters(csvStr);

const mints = allMints.filter(
  ([_, address]) =>
    !ADDRESSES_TO_EXCLUDE_LOWERCASE.includes(address.toLowerCase())
);

console.log("\n------ RUNNING RAFFLE ------");
const uniqueAddresses = new Set(allMints.map((s) => s[1]));
console.log("  WEEK:", week);
console.log("  TOTAL_MINT_COUNT:", allMints.length);
console.log("  TOTAL_VALID_MINT_COUNT:", mints.length);
console.log("  UNIQUE_ADDRESS_COUNT:", uniqueAddresses.size);

if (mints.length < 4) {
  throw new Error("Less than 4 valid mints");
}

const { prng } = await raffle({
  network,
  blockNumber,
  secretKey,
  log: true,
});

// Shuffle the mints with Fischer-Yates
const shuffled = shuffle(prng, mints);

// Loop through each until we reach 4x winners
const WIN_AMOUNT = 4;
const winners = [];
for (let i = 0; i < shuffled.length && winners.length < WIN_AMOUNT; i++) {
  const row = shuffled[i];
  const address = row[1];
  // if this address has not won a token yet
  if (!winners.some((other) => other.toLowerCase() == address.toLowerCase())) {
    winners.push(address);
    console.log("  WINNER: %d of %d - %s", winners.length, WIN_AMOUNT, address);
  } else {
    // Skip this entry in the CSV
  }
}

console.log();

export async function raffle({
  network = "mainnet",
  blockNumber,
  secretKey,
  log = false,
} = {}) {
  const provider = new ethers.InfuraProvider(
    network,
    process.env.INFURA_API_KEY
  );

  const block = await provider.getBlock(blockNumber);

  const prevRandao = block.prevRandao;
  const blockTimeMS = block.timestamp * 1000;

  const mixA = BigInt(prevRandao);
  const mixB = BigInt(secretKey);
  const seedBigInt = mixA ^ mixB;
  const BYTE_WIDTH = 32;

  // Get a 128-bit seed composed of 4 32-bit integers
  // Just takes the first half of the mixed seed
  const bytes = ethers.toBeArray(seedBigInt);
  const rndState128Bit = new Uint32Array(4);
  const dataView = new DataView(rndState128Bit.buffer);
  for (let i = 0; i < 16; i++) {
    dataView.setUint8(i, bytes[i]);
  }

  // Seed the sfc32 PRNG
  const prng = xorshift128(rndState128Bit);

  if (log) {
    console.log("  BLOCK_NUMBER:", blockNumber);
    console.log("  BLOCK_PREVRANDAO:", ethers.toBeHex(mixA, BYTE_WIDTH));
    console.log(`  SECRET_KEY_WEEK_${week}:`, ethers.toBeHex(mixB, BYTE_WIDTH));
    console.log("  COMPUTED_SEED:", ethers.toBeHex(seedBigInt, BYTE_WIDTH));
  }

  provider.destroy();

  return {
    prng,
    prevRandao,
    blockTimestamp: blockTimeMS,
  };
}

/**
 * Fast and robust 128-bit xorshift random number generator.
 * Accepts a 'seed' state of 4 32-bit Uints.
 *
 * @license MIT
 * @author Matt DesLauriers (@mattdesl)
 **/
function xorshift128(state) {
  let xs_state = new Uint32Array(4);

  // set initial
  setState(state);

  return {
    getState() {
      return xs_state;
    },
    setState,
    // random functions
    nextUint32,
    next,
  };

  function setState(view) {
    if (view.byteLength !== 16) throw new Error("expected 128 bit state");
    xs_state.set(view);
  }

  function next() {
    return nextUint32() / 0x100000000;
  }

  function nextUint32() {
    /* Algorithm "xor128" from p. 5 of Marsaglia, "Xorshift RNGs" */
    let t = xs_state[3];
    xs_state[3] = xs_state[2];
    xs_state[2] = xs_state[1];
    xs_state[1] = xs_state[0];
    let s = xs_state[0];
    t ^= t << 11;
    t ^= t >>> 8;
    xs_state[0] = t ^ s ^ (s >>> 19);
    return xs_state[0];
  }
}

// Fisher-Yates shuffle
function shuffle(prng, arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError("Expected Array, got " + typeof arr);
  }

  var rand;
  var tmp;
  var len = arr.length;
  var ret = arr.slice();
  while (len) {
    rand = Math.floor(prng.next() * len--);
    tmp = ret[len];
    ret[len] = ret[rand];
    ret[rand] = tmp;
  }
  return ret;
}
