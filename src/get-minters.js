import { BRIDGE_ADDRESS_LOWERCASE } from "./constants.js";

export function getMinters(csv) {
  const list = csv
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [a, b, c] = s.split(",");
      return [parseInt(a, 10), b, c];
    });

  // if the invoker is the bridge relay address, instead use the recipient
  // otherwise we typically want to stick to the invoker, i.e. in case somebody
  // is minting gifts to others, we want the invoker to be the source of the contribution
  const mints = [];
  for (let [id, minter, receiver] of list) {
    let userMinter = minter;
    if (minter.toLowerCase() == BRIDGE_ADDRESS_LOWERCASE) {
      userMinter = receiver;
    }
    mints.push([id, userMinter]);
  }
  return mints;
}
