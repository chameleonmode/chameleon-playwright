export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function rando(): boolean;
export function rando(number: number): number;
export function rando<T>(list: T[]): T;
export function rando<T>(list?: T[] | number): T | boolean | number {
  return Array.isArray(list)
    ? list[Math.floor(Math.random() * list.length)]
    : list
    ? Math.floor(Math.random() * list)
    : Math.random() < 0.5;
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export async function sleepRandom(args: { minMs?: number; maxMs?: number; multiplier?: number } = {}) {
  const { minMs = 256, maxMs = 512, multiplier = random(2, 4) } = args;
  const delay = random(minMs, maxMs);
  await sleep(delay * multiplier);
}

export async function tryForEach<T>(promises: Promise<T>[]) {
  const fulfilled: T[] = [];
  const errors: unknown[] = [];

  await Promise.allSettled(promises).then((outcomes) =>
    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        fulfilled[index] = outcome.value;
      } else {
        errors.push(outcome.reason);
      }
    })
  );

  return { fulfilled, errors };
}
