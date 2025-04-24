/**
 * Utility functions for various tasks.
 * @module utils
 */

/**
 * sleeps for a specified number of milliseconds.
 * @example
 * // Sleeps for 1000 milliseconds (1 second)
 * await sleep(1000);
 * console.log("Slept for 1 second");
 * // => Slept for 1 second
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified time.
 */
export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generates a random number between min and max.
 * @example
 * // Returns a random number between 1 and 10
 * const randomNum = random(1, 10);
 * console.log(randomNum);
 * // => 5
 */
export function random(...values: number[]): number {
  const smallest = Math.min(...values);
  const largest = Math.max(...values);
  const floor = Math.floor(Math.random() * (largest - smallest + 1) + smallest);
  return floor;
}

/**
 * Generates a random boolean or a random element from an array.
 * @example
 * // Returns a random boolean
 * const randomBool = rando();
 * console.log(randomBool);
 * // => true
 *
 * // Returns a random number between 1 and 10
 * const randomNum = rando(10);
 * console.log(randomNum);
 * // => 7
 *
 * // Returns a random element from the array
 * const randomElement = rando([1, 2, 3, 4, 5]);
 * console.log(randomElement);
 * // => 3
 */
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


export async function sleepRandom(args: { min?: number; max?: number; multiplier?: number } = {}) {
  const { min = 256, max = 512, multiplier = random(2, 4) } = args;
  const delay = random(min, max) * multiplier;
  await sleep(delay);
  return delay;
}

export async function tryForEach<T>(promises: Promise<T>[]) {
  const fulfilled: T[] = [];
  const errors: unknown[] = [];

  await Promise.allSettled(promises).then((outcomes) =>
    outcomes.forEach((outcome, index) => {
      if (outcome.status === "fulfilled") {
        fulfilled.push(outcome.value);
      } else {
        errors.push(outcome.reason);
      }
    })
  );

  return { fulfilled, errors };
}

export function deepMerge(target: any, source: any) {
  if (!source) return target;
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object && key in target) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });
  
  return output;
}