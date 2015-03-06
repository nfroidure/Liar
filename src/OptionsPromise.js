var Promise = require('ia-promise');
var ViewPromise = require('./ViewPromise');
var CommandPromise = require('./CommandPromise');

// OptionsPromise constructor
function OptionsPromise(app, name, block) {
  this.block = block || false;
  // Calling parent constructor
  ViewPromise.call(this, app, name);
  // Filing the form with current values
  // Selecting temple elements
  document.getElementById('sounds').value = this.app.sounds.muted ? 0 : 1;
  document.getElementById('sounds').checked = (
    document.fullscreenElement || document.mozFullScreenElement ||
    document.webkitFullscreenElement
  );
}

OptionsPromise.prototype = Object.create(ViewPromise.prototype);

OptionsPromise.prototype.loop = function () {
  var _this = this;
  return Promise.any(
    // Handling the form
    new CommandPromise(_this.app.cmdMgr, 'send', _this.name).then(function(data) {
      var mute = parseInt(data.event.target[0].value, 10) ? false : true;
      _this.app.sounds.mute(mute);
      try {
        if(window.localStorage)
          window.localStorage.muted = mute ? 'true' : '';
      } catch(e) {}

      if(data.event.target[1].checked) {
        if(
          (!document.fullscreenElement) &&
          (!document.mozFullScreenElement) &&
          !document.webkitFullscreenElement
        ) {
          if(document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if(document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
          } else if(document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          }
        }
      } else if(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement
      ) {
        if(document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if(document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if(document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
      _this.end = true;
    }),
    // Handling the back button
    new CommandPromise(_this.app.cmdMgr, 'back', _this.name).then(function() {
      _this.end = true;
    })
  );
};

module.exports = OptionsPromise;
