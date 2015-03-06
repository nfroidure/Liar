var Promise = require('ia-promise');
var ViewPromise = require('./ViewPromise');
var CommandPromise = require('./CommandPromise');

// ProfilePromise constructor
function ProfilePromise(app, name, block) {
	this.block = block || false;
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Filing the form with current values
	if(this.app.user && this.app.user.name) {
		this.view.querySelector('input[type="text"]').value = this.app.user.name;
	}
}

ProfilePromise.prototype = Object.create(ViewPromise.prototype);

ProfilePromise.prototype.display = function () {
	ViewPromise.prototype.display.call(this);
	// if profile form MUST be filled, hiddin cancel button
	if(this.block) {
		this.view.querySelector('input[formaction]').setAttribute('style', 'display:none');
		this.view.querySelector('input[formaction]').setAttribute('disabled', 'disabled');
	}
};

ProfilePromise.prototype.hide = function () {
	this.view.querySelector('input[formaction]').removeAttribute('style');
	this.view.querySelector('input[formaction]').removeAttribute('disabled');
};

ProfilePromise.prototype.loop = function () {
	var _this = this;
	return Promise.any(
		// Handling the form
		new CommandPromise(_this.app.cmdMgr, 'send', _this.name).then(function(data) {
			_this.app.user = {
				'name': data.element['username'].value,
				'gender': -1
			};
			_this.end = true;
		}),
		// Handling the back button
		new CommandPromise(_this.app.cmdMgr, 'back', _this.name).then(function() {
			_this.end = !this.block;
		})
	);
};

module.exports = ProfilePromise;
