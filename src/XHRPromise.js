var Promise = require('ia-promise');

// XHRPromise constructor
function XHRPromise(method, url, data, async) {
  if(-1 === ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].indexOf(method)) {
    throw Error('Unsupported method.');
  }
  if(!url) {
    throw Error('URL missing.');
  }
  data = data || null;
  async = async || true;
  Promise.call(this, function(success, error, progress) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, async);
    xhr.onprogress = progress;
    xhr.onload = function(event) {
      xhr.onload = xhr.onprogress = xhr.onerror = null;
      if(0 !== ('' + xhr.status).indexOf('5')) {
        success(xhr);
      } else {
        error(xhr);
      }
    };
    xhr.onerror = error;
    try {
      xhr.send(data);
    } catch(e) {
      error(e);
    }
    var dispose = function() {
      xhr.abort();
      xhr = xhr.onload = xhr.onprogress = xhr.onerror = null;
    };
    return dispose;
  });
}

XHRPromise.prototype = Object.create(Promise.prototype);

module.exports = XHRPromise;
