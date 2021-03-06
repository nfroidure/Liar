var Sounds = require('sounds');
var Commandor = require('commandor');

var FutureViewPromise = require('./FutureViewPromise');

function Application() {
	this.root = document.querySelector('.app');
	this.cmdMgr = new Commandor(this.root);
	this.sounds = new Sounds('sounds');
	// menu
	this.loadView('Home').then(function() {
		throw Error('Application unexpectly ended !');
	}, function(error) {
		throw error;
	});
}

Application.prototype.loadView = function(view) {
  var _this = this;
  _this.trackEvent('view', view);
  return new FutureViewPromise(view).then(function(AViewPromise){
    AViewPromise = AViewPromise || ViewPromise;
    return new AViewPromise(_this, view);
  });
}

// GA Tracking
Application.prototype.trackEvent = function() {
  if('function' === typeof window.ga) {
    ga.apply(null, ['send', 'event'].concat([].slice.call(arguments, 0)));
  }
};

new Application();
