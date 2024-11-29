# bitframes-randao

This repository will hold some of the scripts for a trust-minimized random raffle ceremony using Ethereum's RANDAO block attribute.

It will follow the same protocol as outlined here:

https://github.com/mattdesl/meridian-discord-voting

SHA-256 commitments will be posted soon to this repo, some days before the ceremony will begin, to ensure no party (not even me) can game the raffle.

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
- Using the event args, create a CSV file with `token_id,invoker_address` in each line (row)
- Query the PREVRANDAO of the block number associated with the last mint in that week, i.e. the week's ending toBlock as described above. For example, block `21294591` for Week 1.
- Query the `SECRET_KEY_WEEK_*` from the `process.env`, which is held by the artist in secret and revealed upon each weekly raffle execution.
- XOR the two BigInts by doing `PREVRANDAO ^ SECRET_KEY`; from the resulting number, take the first 128 bits and use this as a seed state for xorshift128, a strong pseudo random number generator (PRNG).
- Read the CSV file and turn it into a list of rows, filtering out (i.e. excluding) any rows associated with "Team" addresses (artist, filmmakers, platform).
- Using the PRNG, apply Fisher–Yates shuffle to this new filtered list.
- Sample the first 4 rows from the shuffled list, the addresses in these rows will win one token each in that order.
- If any further conflict arises (e.g. a wallet is deemed to be associated with the Team and it hadn't been excluded), keep sampling the next elements in the list until a valid user address is found.

## Commitments

Cryptographic commitments to the `SECRET_KEY_*` environment variables. The random variables were computed by the artist using [random-256bit.js](./src/random-256bit.js) and the SHA-256 hashes for each is shown below.

```sh
# echo -n 0x... | shasum -a 256
SECRET_KEY_WEEK_1="49fe17ea30574aadf1643389397b8141771d3995faec34c2c9a89ad8954e6fc5"
SECRET_KEY_WEEK_2="d0534541a4572afc3378e6fda1f3c115ced173f9a3ab4dc1d0bacd021a40564b"
SECRET_KEY_WEEK_3="d43ec69168f9cf485aa3455c32fe7bca3f0ee497624d24b527b10fc9b74e4316"
SECRET_KEY_WEEK_4="f49c77733d839d666e699b50e2f2b44cf01a27e99e44067154d3d49da27b3756"
```

## Running Locally

To run the script locally, first clone the repository, `cd` into it, then `npm install` its dependencies with a new version of Node.js (tested with v20.13.1). Then add an `.env` file in the folder, with the following variables (secrets will be revealed each week after raffle execution).

```sh
INFURA_API_KEY="YOUR_API_KEY"
SECRET_KEY_WEEK_1="0x..."
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

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/bitframes-randao/blob/master/LICENSE.md) for details.

```

```
