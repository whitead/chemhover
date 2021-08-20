import * as tf from '@tensorflow/tfjs';
import config from './tiny-v1-info'


if (typeof browser === "undefined") {
    var browser = chrome;
}


const rnn = {
    model: null
}

function tokenize(str_list) {
    // convert chars to intgers
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
    // now package into array
    const buffer = tf.buffer([str_list.length, largest], 'int32');
    for (let i = 0; i < str_list.length; i++)
        for (let j = 0; j < result[i].length; j++)
            buffer.set(result[i][j], i, j,);
    return buffer.toTensor();
}


export async function rnnPredict(s) {
    if (rnn.model === null) {
        const model = await tf.loadLayersModel(config.url);
        rnn.model = (t) => { return model.predict(t) };
    }
    const t = tokenize(s)
    if (t) {
        const result = rnn.model(t);
        t.dispose();
        const v = await result.array();
        result.dispose();
        return v;
    }
    return null;
}