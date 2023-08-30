// Inject an external script into the web page's context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('alphabill-object.js');
console.log(script.src, script);
document.documentElement.appendChild(script);
window.alphabill = {
  someMethod: function() {
    console.log("Injected alphabill object method called!");
  }
};
script.remove();
