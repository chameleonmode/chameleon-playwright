import { Base } from "./base.js";

export class Player {
  constructor(
    readonly actor: Base, 
    readonly visited: number[] = []
  ) {}
  
  async start(dance: () => Promise<number>) {
    while (await this.actor.onTry() === undefined) {
      for (let i = 0; i < this.actor.iterations; i++) {
        console.log(`Iteration: ${i + 1} of ${this.actor.iterations}`);

        if (i > 0) await this.actor.onRetry();
        const resulto = await dance();
        this.visited.push(resulto);
      }
    }
  }
}

export default async function (actor: Base) {
  await actor.init();
  return new Player(actor );
}
