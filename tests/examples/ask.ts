import { generation } from "../../src/lib/ask.js";
(async () => {
  const search = await generation({
    type: "search",
    
    amount: 3,
    keyword: "chameleon",
    feature: "reddit",
  });
  console.log(search);
})();
