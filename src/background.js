import browser from 'webextension-polyfill';

var config = {
    active: [],
    urlFilters: []
}

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon(active) {
    browser.browserAction.setIcon({
        path: active ? {
            '48': 'icons/icon.png'
        } : {
            '48': 'icons/icon-disable.png'
        }
    });
}

function checkUrl(u) {
    let hostname = null;
    try {
        hostname = new URL(u).hostname;
    } catch (error) {
        return false;
    }
    if (hostname)
        for (let i = 0; i < config.urlFilters.length; i++)
            if (config.urlFilters[i].hostEquals === hostname)
                return true;
    return false;
}

function doRun(tabId, changeinfo, tab) {
    if (checkUrl(tab.url)) {
        console.log('Doing run on completed', tabId, tab.url);
        config.active[tabId] = true;
        browser.tabs.executeScript({ file: 'replace.js' });
    } else {
        config.active[tabId] = false;
        console.log('Not running on ', tab.url);
    }
    updateIcon(config.active[tabId]);
}

function addURL(u) {
    let hostname = new URL(u).hostname;
    console.log('ADDING NEW URL', hostname);
    for (let i = 0; i < config.urlFilters.length; i++) {
        if (config.urlFilters[i].hostEquals === hostname) {
            console.log('WAIT, it is already there!');
            return;
        }
    }
    const filter = { hostEquals: hostname }

    config.urlFilters.push(filter)
    browser.storage.sync.set({
        filters: config.urlFilters
    });
}

function removeURL(u) {
    let hostname = new URL(u).hostname;
    console.log('REMOVING URL', hostname);
    config.urlFilters = config.urlFilters.filter((f) => f.hostEquals !== hostname)
    console.log('new filters', config.urlFilters)
    browser.storage.sync.set({
        filters: config.urlFilters
    });
}

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        let tab = tabs[0]; // Safe to assume there will only be one result
        console.log('button pressed and we were', config.active[tab.tabId])
        if (config.active[tab.tabId]) {
            config.active[tab.tabId] = false;
            removeURL(tab.url);
        } else {
            config.active[tab.tabId] = true;
            addURL(tab.url);
            browser.tabs.executeScript({ file: 'replace.js' })
        }
        updateIcon(config.active[tab.tabId]);
    }, console.error);
});

let storageItem =
    browser.storage.sync.get('filters').then((res) => {
        if (Array.isArray(res))
            config.urlFilters = res;
        else
            browser.storage.sync.set({
                filters: []
            });
        console.log('STARTING WITH THESE FILTERS', config.urlFilters);
        browser.tabs.onUpdated.addListener(doRun)
    });