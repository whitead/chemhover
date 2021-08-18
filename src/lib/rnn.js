import * as tf from '@tensorflow/tfjs';
import config from './model_info.json';

const rnn_mod = {
    startLoad: () => {
        const loader = tf.loadLayersModel('https://raw.githubusercontent.com/whitead/chemhover/main/static/model/model.json');
        return loader.then((model) => {
            rnn_mod.model = (t) => {
                return model.predict(t);
            }
            rnn_mod.resetStates = () => {
                model.resetStates();
            }
        });
    }
};


rnn_mod.tokenize = (str_list) => {
    // convert
    let result = [];
    let largest = 0;
    for (let i = 0; i < str_list.length; i++) {
        result.push(str_list[i].split('').map((e, i) => {
            parseInt(config.stoi[e] || 0);
        }));
        largest = Math.max(largest, result[i].length);
    }
    const buffer = tf.buffer([str_list.length, largest], 'int32');
    for (let i = 0; i < str_list.length; i++)
        for (let j = 0; j < result[i].length; j++)
            buffer.set(i, j, result[i][j]);
    return buffer.toTensor();
}

export default rnn_mod;
