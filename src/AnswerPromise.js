var Promise = require('ia-promise');
var CommandPromise = require('./CommandPromise');
var WebSocketPromise = require('./WebSocketPromise');
var ViewPromise = require('./ViewPromise');
var AnsweredPromise = require('./AnsweredPromise');

// AnswerPromise constructor
function AnswerPromise(app, name, ws, question) {
	this.ws=ws;
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Registering UI elements
	this.button=this.view.querySelector('input[type="submit"]');
	// Displaying the question
	this.view.querySelector('p.text').firstChild.textContent = question;
}

AnswerPromise.prototype = Object.create(ViewPromise.prototype);

AnswerPromise.prototype.hide = function () {
	clearTimeout(this.timeout);
	this.button.setAttribute('value', 'Lie');
};

AnswerPromise.prototype.loop = function (timeout) {
	var _this = this;
	// handle the answers reception
	var answersPromise = WebSocketPromise.getMessagePromise(_this.ws, 'answers')
		.then(function(msg) {
			_this.end = true;
			return msg.answers;
		});
	// handle the timeout warn
	var timeoutPromise = WebSocketPromise.getMessagePromise(_this.ws, 'answer')
		.then(function(msg) {
			// discount seconds
			return Promise.elapsed(msg.timeLeft * 1000, 1000);
		});
	// handle the user answer
	var	answeredPromise = new CommandPromise(_this.app.cmdMgr, 'send', _this.name)
		.then(function(data) {
			_this.ws.send(JSON.stringify({
				type: 'answer',
				answer: data.element['answer'].value
			}));
			data.element['answer'].value = '';
		});
	// show a simple view and wait answers
	return Promise.any(
		answersPromise,
		Promise.all(
			Promise.dumb(),
			// Begin the discount if not answering
			timeoutPromise.then(null, null, function(n) {
				_this.button.setAttribute('value', 'Lie (' + n + ')');
			}),
			// display the answered view when answered
			answeredPromise.then(function() {
				return new AnsweredPromise(_this.app, 'Answered', timeoutPromise);
			})
		)
	);
};

module.exports = AnswerPromise;
