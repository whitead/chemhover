/*
 * This file is responsible for performing the logic of replacing
 * all occurrences of each mapped word with its emoji counterpart.
 */

import { rnnPredict } from "./lib/rnn";
import SmilesDrawer from 'smiles-drawer';
import { model } from "@tensorflow/tfjs";

const options = { width: '250', height: '200' };
const smilesDrawer = new SmilesDrawer.Drawer(options);
let CID = 0;




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
    replacementNode.innerHTML = htmlText;
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
    return p.outerHTML
}

function hookup(count, sparkle) {
    for (let i = CID - count; i < CID; i++) {
        let p = document.getElementById('_ch-p' + i)
        let modal = document.getElementById('_ch-modal' + i)
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

/**
 * Substitutes emojis into text nodes.
 * If the node contains more than just text (ex: it has child nodes),
 * call replaceText() on each of its children.
 *
 * @param  {Node} node    - The target DOM Node.
 * @return {void}         - Note: the emoji substitution is done inline.
 */
async function replaceText(node) {
    // Setting textContent on a node removes all of its children and replaces
    // them with a single text node. Since we don't want to alter the DOM aside
    // from substituting text, we only substitute on single text nodes.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    if (node.nodeType === Node.TEXT_NODE && node.parentNode && node.textContent.length > 2) {
        // Because DOM manipulation is slow, we don't want to keep setting
        // textContent after every replacement. Instead, manipulate a copy of
        // this string outside of the DOM and then perform the manipulation
        // once, at the end.
        let content = node.textContent;
        let newNode = node;

        //console.log(content);

        const ss = content.split(/\s+/);
        if (content.length > 0 && ss.length > 0) {
            let smilesCount = 0;
            const ps = await rnnPredict(ss)
            if (ps) {
                for (let i = 0; i < ss.length; i++) {
                    if (ss[i].length > 1 && ps[i] > threshold) {
                        content = content.replace(ss[i], makeChemElem(ss[i]))
                        smilesCount++;
                    }
                }
                // Now that all the replacements are done, perform the DOM manipulation.
                newNode = insertHTMLText(node, content);
                // now hook up stuff, only doing sparkle if parent is text area
                hookup(smilesCount, newNode.parentNode.nodeName !== 'TEXTAREA');

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
            setTimeout(closure(node.childNodes[i]), 0);
        }
    }
}




replaceText(document.body);


//observer.observe(document.body, {
//    childList: true,
//    subtree: true,
//    characterData: true
//});
