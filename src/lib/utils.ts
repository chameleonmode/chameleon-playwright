export async function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

