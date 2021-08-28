/*
 * This file is responsible for performing the logic of replacing
 * all occurrences of each mapped word with its emoji counterpart.
 */

import pjson from '../package.json'

let version = pjson.version;
let debugMode = version.endsWith('alpha');


if (debugMode) console.log('Checking if we can run')

if (_chemhover !== undefined) {
    return
}
var _chemhover = true


import { rnnPredict } from "./lib/rnn";
import SmilesDrawer from 'smiles-drawer';
// import browser from 'webextension-polyfill';

const options = { width: '250', height: '200' };
const smilesDrawer = new SmilesDrawer.Drawer(options);
let CID = 0;
const isolateRegex = /^[("'\[]*(.*?)[\."'\])]*$/gm;

if (debugMode) console.log('Yes, we can run!');

// Now monitor the DOM for additions and substitute emoji into new nodes.
// @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver.
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // This DOM change was new nodes being added. Run our substitution
            // algorithm on each newly added node.
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                const newNode = mutation.addedNodes[i];
                replaceText(newNode);
            }
        }
    });
});



const drawSmiles = (s, canvas_id, drawer, fxn, palette = 'dark') => {
    SmilesDrawer.parse(s, (tree) => {
        console.log('drawing', s, 'on', canvas_id);
        drawer.draw(tree, canvas_id, palette);
        fxn();
    }, (err) => {
    });
}

const threshold = 1;

function insertHTMLText(node, htmlText) {
    let replacementNode = document.createElement('span');
    replacementNode.insertAdjacentHTML('beforeend', htmlText);
    node.parentNode.insertBefore(replacementNode, node);
    node.parentNode.removeChild(node);
    return replacementNode;
}

function makeChemElem(smiles) {
    let p = document.createElement('span');
    p.innerText = smiles;
    let modal = document.createElement('div');
    p.appendChild(modal);

    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '100';
    modal.style.position = 'absolute';

    let canvas = document.createElement('canvas');
    modal.appendChild(canvas);
    canvas.width = options.width;
    canvas.height = options.height;

    canvas.id = '_ch-canvas' + CID;
    modal.id = '_ch-modal' + CID;
    p.id = '_ch-p' + CID;
    CID += 1;
    return p.outerHTML;
}

function hookup(count, sparkle) {
    for (let i = CID - count; i < CID; i++) {
        let p = document.getElementById('_ch-p' + i);
        let modal = document.getElementById('_ch-modal' + i);
        drawSmiles(p.innerText, '_ch-canvas' + i, smilesDrawer, () => { modal.style.display = 'none'; });
        modal.onmouseout = function () {
            modal.style.display = 'none';
        };
        p.onmouseover = function (e) {
            modal.style.display = 'block';
            modal.style.left = e.clientX;
            modal.style.top = e.clientY;
        }
        p.onmouseout = function () {
            modal.style.display = 'none';
        };
        let tn = p.childNodes[0];
        if (sparkle)
            tn.textContent = '✨' + tn.textContent + '✨';
    }

}
async function replaceText(node) {
    // Setting textContent on a node removes all of its children and replaces
    // them with a single text node. Since we don't want to alter the DOM aside
    // from substituting text, we only substitute on single text nodes.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    if (node.nodeType === Node.TEXT_NODE && node.parentNode && node.textContent.length > 2 && !node.parentNode.id.startsWith('_ch')) {
        // Because DOM manipulation is slow, we don't want to keep setting
        // textContent after every replacement. Instead, manipulate a copy of
        // this string outside of the DOM and then perform the manipulation
        // once, at the end.
        let content = node.textContent;

        // split on whitespace and attempt to remove enclosing quotes/paranthesis
        const ss = content.split(/\s+/).map((s) => {
            let m = isolateRegex.exec(s);
            if (m) {
                s = m[1];
            }
            return s
        });
        if (ss.length > 0) {
            let smilesCount = 0;
            const ps = await rnnPredict(ss)
            if (ps) {
                for (let i = 0; i < ss.length; i++) {
                    if (ss[i].length > 1 && ps[i] > threshold) {
                        content = content.replace(ss[i], makeChemElem(ss[i]));
                        smilesCount++;
                    }
                }
                if (!node.parentNode) {
                    return; //not sure how this can happen - guess we can trigger replaceText twice.
                }
                // don't sparkle on inputs, but inputs never work anyway
                let doSparkle = node.parentNode.nodeName !== 'TEXTAREA';
                // Now that all the replacements are done, perform the DOM manipulation.
                insertHTMLText(node, content);
                // now hook up stuff, only doing sparkle if parent is text area
                hookup(smilesCount, doSparkle);

            }
        }
    }
    else if (node.tagName && node.tagName.toUpperCase() !== 'SCRIPT' && node.tagName.toUpperCase() !== 'STYLE') {
        // skip scripts
        // This node contains more than just text, call replaceText() on each
        // of its children.
        function closure(n) {
            return function () {
                replaceText(n)
            }
        }
        for (let i = 0; i < node.childNodes.length; i++) {
            //setTimeout(closure(node.childNodes[i]), 0);
            replaceText(node.childNodes[i])
        }
    }
}

document.body.addEventListener("mouseup", (e) => {
    let srange;
    if (window.getSelection) {
        srange = window.getSelection().getRangeAt(0);
    } else if (document.selection) {
        srange = document.selection.createRange();
    }

    if (srange.startContainer)
        replaceText(srange.startContainer)
    if (srange.endContainer) {
        replaceText(srange.endContainer)
    }

}, true);

//replaceText(document.body);


//observer.observe(document.body, {
//    childList: true,
//    subtree: true,
//    characterData: true
//});
