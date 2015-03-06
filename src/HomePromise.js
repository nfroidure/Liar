var Promise = require('ia-promise');
var ViewPromise = require('./ViewPromise');
var FutureViewPromise = require('./FutureViewPromise');
var CommandPromise = require('./CommandPromise');

// HomePromise constructor
function HomePromise(app, name) {
	// Calling parent constructor
	ViewPromise.call(this, app, name);
}

HomePromise.prototype = Object.create(ViewPromise.prototype);

HomePromise.prototype.display = function () {
	var _this = this;

	ViewPromise.prototype.display.call(this);

	// Registering UI elements
	this.buttonInstallation = this.view.querySelector('ul.menu li:nth-child(2) a');

	// Checking installation on Firefox
	this.buttonInstallation.style.display='none';
	if(undefined !== navigator.mozApps) {
		var request = navigator.mozApps.getSelf();
		request.onsuccess = function() {
			if (request.result) {
			} else {
				buttonInstallation.style.display = 'inline-block';
			}
		};
		request.onerror = function() {
		};
	}

};

HomePromise.prototype.loop=function () {
	var _this = this;

	return Promise.any(

		// Handling the install button
		new CommandPromise(_this.app.cmdMgr, 'install', _this.name).then(function() {

			// Installing the application
			var manifestUrl = location.href.substring(0, location.href.lastIndexOf('/')) +
				'/manifest.webapp';
			var request = window.navigator.mozApps.install(manifestUrl);
			request.onsuccess = function() {
				_this.buttonInstallation.style.display='none';
			};
			request.onerror = function() {
			};
		}),

		// Handling menu
		new CommandPromise(_this.app.cmdMgr, 'menu', _this.name).then(function(data) {
			// Loading the selected view
			return _this.app.loadView(data.params.view);
		})
	);
};

module.exports = HomePromise;
