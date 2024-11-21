import { ethers } from "ethers";
import "dotenv/config";

const argv = process.argv.slice(2);
const network = argv[0] || "mainnet";
const blockNumber = parseInt(argv[1], 10);
const secretKey = argv[2];
const count = argv[3];
if (!network || !blockNumber || !secretKey || !count)
  throw new Error("malformed input");

const { random } = await raffle({
  network,
  blockNumber,
  secretKey,
  log: true,
});

// generate N random numbers from this block
console.log(`Generating ${count} random number(s):`);
for (let i = 0; i < count; i++) {
  const u32 = random.nextUint32();
  console.log(u32);
}

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

  console.log(rndState128Bit, rndState128Bit.byteLength);

  // Seed the sfc32 PRNG
  const random = xorshift128(rndState128Bit);

  if (log) {
    console.log("Block Number:", blockNumber);
    console.log("Block PREVRANDAO:", ethers.toBeHex(mixA, BYTE_WIDTH));
    console.log("Secret Key:", ethers.toBeHex(mixB, BYTE_WIDTH));
    console.log("Seed:", ethers.toBeHex(seedBigInt, BYTE_WIDTH));
  }

  provider.destroy();

  return {
    random,
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
