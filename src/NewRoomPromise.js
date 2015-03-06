var Promise = require('ia-promise');
var ViewPromise = require('./ViewPromise');
var XHRPromise = require('./XHRPromise');
var CommandPromise = require('./CommandPromise');

// NewRoomPromise constructor
function NewRoomPromise(app, name) {
	// Calling parent constructor
	ViewPromise.call(this, app, name);
}

NewRoomPromise.prototype = Object.create(ViewPromise.prototype);

NewRoomPromise.prototype.loop = function() {
	var _this = this;
	return Promise.any(
		// Handling the form
		new CommandPromise(_this.app.cmdMgr, 'send', _this.name).then(function(data) {
			return new XHRPromise('POST', '/rooms.json', JSON.stringify({
				name: data.element.elements[0].value,
				mode: data.element.elements[2].checked ? 1 : 0
			})).then(function() {
				_this.end = true;
			});
		}),
		// Handling the back button
		new CommandPromise(_this.app.cmdMgr, 'back', _this.name).then(function() {
			_this.end = true;
		})
	);
};

module.exports = NewRoomPromise;
