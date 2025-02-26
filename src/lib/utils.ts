export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export async function sleepRandom({ minMs = 256, maxMs = 512, multiplier = 1 }) {
  const delay = await random(minMs, maxMs);
  await sleep(delay * multiplier);
}
