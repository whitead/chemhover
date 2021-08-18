const resolvers = {};
let id = 0;
const MAX_ID = 2 ** 10

if (typeof browser === "undefined") {
    var browser = chrome;
}

let port = browser.runtime.connect({ name: "rnn" });

port.onMessage.addListener((data) => {
    console.log('rnn got message' + data[2]);
    const mid = data[1];
    const result = data[2];
    resolvers[mid](result);
    delete resolvers[mid];
});

export function rnnPredict(s) {
    id = (id + 1) % MAX_ID;
    port.postMessage(['predict', id, s]);
    return new Promise(resolve => resolvers[id] = resolve);
}

export function checkStatus() {
    id = (id + 1) % MAX_ID;
    port.postMessage(['loading-status', id, null]);
    return new Promise(resolve => resolvers[id] = resolve);
}