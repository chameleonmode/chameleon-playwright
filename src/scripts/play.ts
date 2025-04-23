import { Base } from "./page.js";

export class Player {
  constructor(readonly actor: Base, readonly threads: number[] = [], readonly times: number = 1) {}
  async start(dance: (rano: number[]) => Promise<number>) {
    for (let i = 0; i < this.times; i++) {
      console.log(`
         Step: ${i + 1} of ${this.times}`);

      if (i > 0) {
        this.actor.nap();
        this.actor.page.goBack();
      }
      const resulto = await dance(this.threads);
      this.threads.push(resulto);
    }
  }
}
