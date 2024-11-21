import { ethers } from "ethers";
import "dotenv/config";

const ref = {
  networks: {
    sepolia: {},
    mainnet: {},
  },
};

for (let network in ref.networks) {
  const provider = new ethers.InfuraProvider(
    network,
    process.env.INFURA_API_KEY
  );
  const block = await provider.getBlock("latest");
  const number = block.number;
  const timestampMS = block.timestamp * 1000;
  console.error("Network:", network);
  console.error("Reference Block:", number);
  console.error("Time:", new Date(timestampMS).toUTCString());
  ref.networks[network] = {
    blockNumber: number,
    timestamp: timestampMS,
  };
  provider.destroy();
}

const curDate = new Date();
console.error("Fetched On:", curDate.toUTCString());
ref.timestamp = curDate.getTime();
console.log(JSON.stringify(ref, null, 2));
