# ✨chemhover✨

Using ✨AI✨ to find SMILES and draw them. Just select some part or around the SMILES string. *It does take a few seconds to start the AI.* Keep up on [Twitter](https://twitter.com/andrewwhite01) to learn more. See demo below.

## Known Issues

* Its mouseclick listener can interfere with YouTube (fullscreen, home button)
* The model loading can affect ability to select

*So enable it, try it, and then disable it.* I'm working on more granular control on where/when it runs. 

## AI

It actually runs a GRU RNN neural network over text to find SMILES (see `py/` for training/data info). This is overkill, but heh it's fun. Checkout [my book](https://whitead.github.io/dmol-book/) if you want to learn more!

## Install (pre-alpha release)

*This is very new, so be ready to disable it. Also, come back for new releases*

1. Download the [release asset zip](https://github.com/whitead/chemhover/releases)
2. Unzip it

### Chrome
1. Open the Extension Management page by navigating to chrome://extensions.
2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
3. Click the Load unpacked button and select the extension directory.

### Firefox

In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary Add-on", then select any file in your extension's directory.



## Demo

![chemhover2](https://user-images.githubusercontent.com/908389/130306740-f2040b54-123d-43b2-9094-c755d5349b00.gif)
