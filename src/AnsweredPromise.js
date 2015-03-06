var ViewPromise = require('./ViewPromise');

// ScorePromise constructor
function AnsweredPromise(app, name, timeoutPromise) {
	this.timeoutPromise = timeoutPromise;
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Preparing UI elements
	this.timeLeft=this.view.querySelector('p.text>span');
}

AnsweredPromise.prototype = Object.create(ViewPromise.prototype);

AnsweredPromise.prototype.hide = function () {
	this.timeLeft.firstChild.textContent='.';
};

AnsweredPromise.prototype.loop = function (timeout) {
	var _this = this;
	return this.timeoutPromise.then(function() {
			_this.end = true;
		}, null, function(n) {
			_this.timeLeft.firstChild.textContent = ' (' + n + ').';
		});
};

module.exports = AnsweredPromise;
