var Promise = require('ia-promise');

// Event promise constructor
function EventPromise(type, element, capture, iterations) {
  if(!type)
    throw Error('Event type is missing.');
  if(!element)
    throw Error('Element to wich attach the event is missing.');
  capture = !!capture;
  iterations = iterations || 1;

  Promise.call(this, function(success, error, progress) {
    var eventHandler = function(event) {
      iterations--;
      if(iterations < 1) {
        dispose();
        success(event);
      }
    };
    var dispose = function() {
      element.removeEventListener(type, eventHandler, capture);
    };
    element.addEventListener(type, eventHandler, capture);
    return dispose;
  });
}

EventPromise.prototype = Object.create(Promise.prototype);

module.exports = EventPromise;
