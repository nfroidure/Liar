var Promise = require('ia-promise');

// Command promise constructor
function CommandPromise(commandor, command, view) {

  if(!(this instanceof CommandPromise)) {
    throw Error('Use new to intantiate !');
  }

  Promise.call(this,function(success) {
    var _attach = function(event, params, element) {
      _dispose();
      success({
        event: event,
        params: params,
        element: element
      });
    };

    var _dispose = function() {
      commandor.unsuscribe(view + '_' + command, _attach);
    };

    commandor.suscribe(view + '_' + command, _attach);

    return _dispose;
  });

  this._command = command;

}

CommandPromise.prototype=Object.create(Promise.prototype);

module.exports = CommandPromise;
