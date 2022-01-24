import stateManager from "../lib/stateManager.js";

let loaderState = stateManager.getState("loader", "index.js");

let sub1 = stateManager.subscribe("loader", (p, n) => {
  console.log("sub1");
});

let sub2 = stateManager.subscribe("loader", (p, n) => {
  console.log("sub2");
});

let sub3 = stateManager.subscribe("loader", (p, n) => {
  console.log("sub3");
});

loaderState.loaders = [];
loaderState.loaders.push(1);
loaderState.b = {};
loaderState.b.c = {};
loaderState.b.c.r = 45;
loaderState.b.c.arr = [34];

console.log("unsubscribing");
stateManager.unsubscribe("loader", sub1);

console.log("Available states:");
console.log(stateManager.getStateNames());
