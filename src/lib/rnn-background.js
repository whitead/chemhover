import * as tf from '@tensorflow/tfjs';
import config from './model_info'


const rnn = {
    model: null
}


if (typeof browser === "undefined") {
    var browser = chrome;
}

const loader = tf.loadLayersModel('https://raw.githubusercontent.com/whitead/chemhover/main/static/model-v1/model.json');
loader.then((model) => {
    rnn.model = (t) => {
        return model.predict(t);
    }
});


function tokenize(str_list) {
    // convert
    let result = [];
    let largest = 0;
    for (let i = 0; i < str_list.length; i++) {
        result.push(str_list[i].split('').map((e) => {
            return parseInt(config.stoi[e.toLowerCase()] || 0);
        }));
        largest = Math.max(largest, result[i].length);
    }
    if (largest === 0)
        return null;
    const buffer = tf.buffer([str_list.length, largest], 'int32');
    for (let i = 0; i < str_list.length; i++)
        for (let j = 0; j < result[i].length; j++)
            buffer.set(result[i][j], i, j,);
    return buffer.toTensor();
}




browser.runtime.onConnect.addListener((port) => {

    port.onMessage.addListener((data) => {
        console.log('rnn-background got message' + data);
        const mtype = data[0];
        const mid = data[1];
        let result = null;

        if (mtype === 'loading-status') {
            result = rnn.model === null
        } else {
            const t = tokenize(data[2])
            if (t) {
                result = rnn.model(t);
                t.dispose();
                result.array().then((data) => {
                    console.log('Sending away in callback' + data);
                    port.postMessage([mtype, mid, data]);
                    result.dispose();
                })
                return;
            }
        }
        console.log('Sending away ' + result);
        port.postMessage([mtype, mid, result]);
    });
});


