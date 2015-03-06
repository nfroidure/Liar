var Promise = require('ia-promise');
var CommandPromise = require('./CommandPromise');

// ViewPromise constructor
function ViewPromise(app, name, timeout) {
	var _this = this;

	// Keeping a ref to the app
	this.app = app;
	this.name = name;

	//  Getting view
	this.view = document.getElementById(name);

	// Calling parent constructor
	Promise.call(this, function(success, error, progress) {
		var promisePool;
		// UI interactions
		_this.end = false;
		function main() {
			_this.display();
			promisePool = _this.loop(timeout);
			promisePool.then(function(value) {
				if(_this.end) {
					_this.hide();
					success(value);
				} else {
					main();
				}
			});
		}
		main();
		var dispose = function() {
			promisePool.dispose();
			_this.hide();
		};
		return dispose;
	});
}

ViewPromise.prototype = Object.create(Promise.prototype);

ViewPromise.prototype.display = function () {
	// Hidding other views
	Array.prototype.forEach.call(document.querySelectorAll('.view.selected'),
		function(element) {
			element.classList.remove('selected');
		});
	// Showing current view
	this.view.classList.add('selected');
};

ViewPromise.prototype.hide = function () {

};

ViewPromise.prototype.loop = function (timeout) {
	var _this = this;
	return Promise.any(
		// Handling the back button
		new CommandPromise(_this.app.cmdMgr, 'back', _this.name).then(function() {
			_this.end=true;
		}),
		// Handling menu
		new CommandPromise(_this.app.cmdMgr, 'menu', _this.name).then(function(data) {
			// Loading the selected view
			return _this.app.loadView(data.params.view);
		}),
		(timeout ? Promise.elapsed(timeout).then(function() {
			_this.end = true;
		}) : Promise.dumb())
	);
};

module.exports = ViewPromise;
