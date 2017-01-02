chrome.webRequest.onBeforeRequest.addListener(
    function(info) {
        console.table(info);
        return {
          redirectUrl: chrome.extension.getURL('js/Core_Compressed.js')
       }
    }, {
        urls: [
            "https://services.geolearning.com/courseware/scripts/Core_Compressed.js*",
        ]
    }, ["blocking"]
);
