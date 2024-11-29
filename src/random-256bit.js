import webcrypto from "crypto";

// Used by the artist at setup to generate a random 256 bit integer
// https://stackoverflow.com/questions/63163468/generate-a-256-bit-random-number
function rnd256() {
  const bytes = new Uint8Array(32);

  // load cryptographically random bytes into array
  webcrypto.getRandomValues(bytes);

  // convert byte array to hexademical representation
  const bytesHex = bytes.reduce(
    (o, v) => o + ("00" + v.toString(16)).slice(-2),
    ""
  );

  // convert hexademical value to a decimal string
  return "0x" + bytesHex;
}

console.log(rnd256());
