/*
 * This file is responsible for performing the logic of replacing
 * all occurrences of each mapped word with its emoji counterpart.
 */

import rnn_mod from "./lib/rnn";



/**
 * Substitutes emojis into text nodes.
 * If the node contains more than just text (ex: it has child nodes),
 * call replaceText() on each of its children.
 *
 * @param  {Node} node    - The target DOM Node.
 * @return {void}         - Note: the emoji substitution is done inline.
 */
function replaceText(node) {
    // Setting textContent on a node removes all of its children and replaces
    // them with a single text node. Since we don't want to alter the DOM aside
    // from substituting text, we only substitute on single text nodes.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    if (node.nodeType === Node.TEXT_NODE) {
        // This node only contains text.
        // @see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType.

        // Skip textarea nodes due to the potential for accidental submission
        if (node.parentNode &&
            node.parentNode.nodeName === 'TEXTAREA') {
            return;
        }

        // Because DOM manipulation is slow, we don't want to keep setting
        // textContent after every replacement. Instead, manipulate a copy of
        // this string outside of the DOM and then perform the manipulation
        // once, at the end.
        let content = node.textContent;

        const ss = content.split();
        const vec = rnn_mod.tokenize(ss);
        const ps = rnn_mod.predict(vec);

        // Now that all the replacements are done, perform the DOM manipulation.
        node.textContent = content;
    }
    else {
        // This node contains more than just text, call replaceText() on each
        // of its children.
        for (let i = 0; i < node.childNodes.length; i++) {
            replaceText(node.childNodes[i]);
        }
    }
}



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


rnn_mod.startLoad().then(() => {
    // Start the recursion from the body tag.
    replaceText(document.body);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})


