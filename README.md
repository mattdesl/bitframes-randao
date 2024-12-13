# bitframes-randao

This repository will hold some of the scripts for a trust-minimized random raffle ceremony using Ethereum's RANDAO block attribute, used in [Bitframes 32 Bit Editions](https://bitframes.io/editions) selection.

It builds upon the protocol I set up [for Meridian](https://github.com/mattdesl/meridian-discord-voting).

## How it Works

To create a fair raffle, I've decided to use a bit of cryptography and single leader election driven by Ethereum's Proof of Stake RANDAO mechanism[^1]. In Ethereum, each new block proposed to the network includes a `PREVRANDAO` field, which is a pseudo-random 256-bit integer[^2]. This integer will be used as a seed to select the raffle winners randomly from the list of eligible users.

The goal of this ceremony is to ensure that no single party, even myself, can significantly bias and influence the raffle results, and to ensure this can be verified after the fact using cryptography and math.

> ###### 🎨✨ Consider this ceremony partly an artistic performance using the blockchain, and partly a multi-party computation scheme for a cryptographically verifiable random raffle.

### The Block Key

One contribution of randomness is from Ethereum's RANDAO mechanism, which is very hard to game. Somebody attempting to influence RANDAO would need to be a validator (which itself is costly) and the chance of them being selected as a block producer at a given slot is very low, unless they control a massive percentage of all staked Ether. Block producers cannot choose a specific RANDAO integer, but they can choose to opt-out of producing a block, and so they have a very limited 1 bit of biasability.

### The Artist Key

Theoretically, it _is_ possible (albeit extremely unlikely) that a colluding group of Ethereum block producers could slightly bias the RANDAO value to their benefit in this raffle. To mitigate against this theoretical biasing, I am also keeping a `SECRET_KEY`, which is a random 256-bit integer that will be XORed with the RANDAO value to produce a final state for randomness. I will only publicly reveal this `SECRET_KEY` value after each weekly raffle.

This means that even though a validator could potentially bias RANDAO, they would not be able to predict in which way their bias would affect the raffle output.

Because of this, the ceremony is not _completely_ trust-minimized, as you also have to trust that I am not staking so much ETH that I can influence the raffle (the cost of reliably biasing RANDAO is in the order of hundreds of millions of USD).[^3]

## Special Conditions

Although this will use a cryptographically strong PRNG and accumulates events from the distributed ledger, some contributions will be manually omitted from the raffle, such as addresses relating to the artist and/or crowdfund organizers (mattdesl.eth, bitframes.eth, generativefilmfund.eth, etc).

## Block Range

Instead of using timestamps, the project uses block ranges between weeks, which allowed the website and backend to operate smoothly without having to fetch a timestmap for each mint operation. The ranges are shown below, and are inclusive. The block ranges start from the first mint on the crowdfund contract, and ends with the block that processed the last mint.

| Week | From             | To               |
| ---- | ---------------- | ---------------- |
| 1    | 22/11 17:00 GMT  | block `21294591` |
| 2    | block `21294592` | block `21344587` |
| 3    | block `21344588` | block `21394583` |
| 4    | block `21394584` | 20/12 17:00 GMT  |

## Full Specification

- Using the crowdfund contract:
  - [0x642fEd40AeD8e7A7CF7c4CFf77F2529a4348ccC3](https://etherscan.io/address/0x642fEd40AeD8e7A7CF7c4CFf77F2529a4348ccC3#events)
- Capture all `SeedUpdate` events from the contract with the given range, as shown in the [Block Range](#block-range) table above. Considerations:
  - Only updates with `isMint=true` and `nftContract=0x2c7f335460fB9dF460FF7AD6CC64cb7Dd4064862` are considered
  - In Week 1, `fromBlock` is the origin of the contract
  - In Week 4, `toBlock` is the block that processed the last mint
  - Be sure to capture both the `tokenId`, `invoker` and `mintRecipient`
- Using the event args, create a CSV file with `token_id,invoker_address,recipient_address` in each line (row)
- Query the `PREVRANDAO` of the block number associated with the last mint in that week, i.e. the week's ending toBlock as described above. For example, block `21294591` for Week 1.
- Query the `SECRET_KEY_WEEK_*` from the `process.env`, which is held by the artist in secret and revealed upon each weekly raffle execution.
- XOR the two BigInts by doing `PREVRANDAO ^ SECRET_KEY`; from the resulting number, take the first 128 bits and use this as a seed state for xorshift128, a strong pseudo random number generator (PRNG).
- Read the CSV file and turn it into a list of rows of "valid mints and their minters":
  - For any rows where `invoker_address` is equal to the bridge relay (`0xb90ed4c123843cbFD66b11411Ee7694eF37E6E72`), use instead the `recipient_address`, otherwise use the `invoker_address`
  - Then filter out (i.e. excluding) any rows associated with "Team" addresses (artist, filmmakers, platform).
- Using the PRNG, apply Fisher–Yates shuffle to this new filtered list.
- In sequence, sample the first 4 winning (unique) addresses from the shuffled list. Considerations:
  - Keep track of which minter addresses have been marked as won, and skip those if they arise again, to ensure each address can only win one token in a given week.
  - If any further conflict arises (e.g. a wallet is deemed to be associated with the Team and it hadn't been excluded), keep sampling the next elements in the list until a valid user address is found.

## Commitments

Cryptographic commitments to the `SECRET_KEY_*` environment variables, posted before the raffle, so that the artist cannot change them after the fact. The random variables were computed by the artist using [random-256bit.js](./src/random-256bit.js) and the SHA-256 hashes for each is shown below.

```sh
# echo -n 0x... | shasum -a 256
SECRET_KEY_WEEK_1="49fe17ea30574aadf1643389397b8141771d3995faec34c2c9a89ad8954e6fc5"
SECRET_KEY_WEEK_2="d0534541a4572afc3378e6fda1f3c115ced173f9a3ab4dc1d0bacd021a40564b"
SECRET_KEY_WEEK_3="d43ec69168f9cf485aa3455c32fe7bca3f0ee497624d24b527b10fc9b74e4316"
SECRET_KEY_WEEK_4="f49c77733d839d666e699b50e2f2b44cf01a27e99e44067154d3d49da27b3756"
```

See the [Running Locally](#running-locally) for the revealed secrets each week.

This git repo and its SHA hashes also acts as a form of commitment to the current raffle logic and scripts.

## Running Locally

To run the scripts locally, first clone the repository, `cd` into it, then `npm install` its dependencies with a new version of Node.js (tested with v20.13.1). Then add an `.env` file in the folder, with the following variables (secrets will be revealed each week after raffle execution).

```sh
INFURA_API_KEY="YOUR_API_KEY"
SECRET_KEY_WEEK_1="0x0f97dbae7ad36d83e9530767f7681daaf2890d950431d734d28d1875e17bd200"
SECRET_KEY_WEEK_2="0x..."
SECRET_KEY_WEEK_3="0x..."
SECRET_KEY_WEEK_4="0x..."
```

Then run one of the scripts:

```sh
npm run raffle:1
npm run raffle:2
npm run raffle:3
npm run raffle:4
```

## Changelog

- Dec 12, 2024 - a change was made to have cross-chain mints included in the raffle. The `invoker` in these cases will be the relay address, and so in these cases the `mintRecipient` has to instead be considered.
  - It so happens that the first two weeks raffles' PRNGs did not select any rows in the CSV that were initiated by the bridge relay contract; so this change in the script is not something that would have affected the results of previous weeks. However, it might affect the results of future weeks, i.e. with this new change in place, a user who minted on Base L2 can actually receive one of the 32 Bit Editions if the PRNG selects that row.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/bitframes-randao/blob/master/LICENSE.md) for details.

[^1]: You can read more about the mechanics of RANDAO [here](https://eth2book.info/capella/part2/building_blocks/randomness/).
[^2]: This integer is computed by aggregating the BLS signature of each block producer.
[^3]: Statistical analysis on Ethereum k-consecutive block proposal probabilities: https://alrevuelta.github.io/posts/ethereum-mev-multiblock
