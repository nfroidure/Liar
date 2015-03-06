var Promise = require('ia-promise');
var CommandPromise = require('./CommandPromise');
var AnswerPromise = require('./AnswerPromise');
var WebSocketPromise = require('./WebSocketPromise');
var ScorePromise = require('./ScorePromise');
var ViewPromise = require('./ViewPromise');

// GamePromise constructor
function GamePromise(app, name,  ws, room) {
	this.ws = ws;
	this.room = room;
	// Calling parent constructor
	ViewPromise.call(this, app, name);
	// Registring UI elements
	this.question = this.view.querySelectorAll('p.text')[0];
	this.displayZone = this.view.querySelectorAll('p.text')[1];
	this.score = this.view.querySelectorAll('ul.infos span')[0];
	this.points = this.view.querySelectorAll('ul.infos span')[1];
	this.clock = this.view.querySelectorAll('ul.infos span')[2];
	this.betTpl = this.displayZone.firstChild;
	this.scoreTpl = this.displayZone.lastChild;
	this.displayZone.removeChild(this.betTpl);
	this.displayZone.removeChild(this.scoreTpl);
	// Load message
	this.question.firstChild.textContent = 'Loading the question...';
	this.score.firstChild.textContent = 0;
	this.points.firstChild.textContent = 10;
	this.clock.firstChild.textContent = '-';
}

GamePromise.prototype = Object.create(ViewPromise.prototype);

GamePromise.prototype.hide = function () {
	while(this.displayZone.firstChild) {
		this.displayZone.removeChild(this.displayZone.firstChild);
	}
	this.displayZone.appendChild(this.betTpl);
	this.displayZone.appendChild(this.scoreTpl);
};

GamePromise.prototype.loop = function (timeout) {
	var _this = this;
	var everyBetLinks = [];
	return Promise.any(
		// Handling a round
		WebSocketPromise.getMessagePromise(_this.ws, 'round').then(function(msg){
			while(_this.displayZone.firstChild) {
				_this.displayZone.removeChild(_this.displayZone.firstChild);
			}
			// Displaying the question
			_this.question.firstChild.textContent = msg.question;
			// show round
			var h1=_this.view.querySelector('h1');
			h1.firstChild.textContent = 'Round #' + msg.round;
			// ask an answer AND get the others answers
			return	new AnswerPromise(_this.app, 'Answer', _this.ws, msg.question).then(function(answers) {
				for(var i = answers.length-1; i >= 0; i--) {
					var bet = _this.betTpl.cloneNode(true);
					bet.firstChild.firstChild.textContent = '- ' + answers[i].answer;
					var leftPoints = parseInt(_this.points.firstChild.textContent, 10);
					var betLinks = bet.querySelectorAll('a');
					everyBetLinks = everyBetLinks.concat([].slice.call(betLinks, 0));
					if(leftPoints >= 1) {
						betLinks[0].setAttribute('href', betLinks[0].getAttribute('href') + answers[i].id);
						betLinks[0].removeAttribute('disabled');
					} else {
						betLinks[0].setAttribute('disabled','disabled');
					}
					if(leftPoints >= 2) {
						betLinks[1].setAttribute('href', betLinks[1].getAttribute('href') + answers[i].id);
						betLinks[1].removeAttribute('disabled');
					} else {
						betLinks[1].setAttribute('disabled','disabled');
					}
					if(leftPoints >= 3) {
						betLinks[2].setAttribute('href', betLinks[2].getAttribute('href') + answers[i].id);
						betLinks[2].removeAttribute('disabled');
					} else {
						betLinks[2].setAttribute('disabled','disabled');
					}
					_this.displayZone.appendChild(bet);
					_this.displayZone.appendChild(document.createElement('br'));
				}
			_this.clock.firstChild.textContent = '-';
			});
		}).then(function() {
			var betPromise = new CommandPromise(_this.app.cmdMgr, 'bet', _this.name).then(function(data) {
				_this.points.firstChild.textContent=
					parseInt(_this.points.firstChild.textContent, 10) -
					parseInt(data.params.points, 10);
				_this.ws.send(JSON.stringify({
					type: 'bet',
					answer: data.params.answer,
					bet: data.params.points
				}));
			});
			_this.display();
			// ask a bet and wait for results even if no bet
			return Promise.any(
				Promise.all(
					betPromise.then(function() {
						everyBetLinks.forEach(function(betLink) {
							betLink.setAttribute('disabled','disabled');
						});
					}),
					WebSocketPromise.getMessagePromise(_this.ws, 'bet').then(function(msg) {
						// discount seconds
						return Promise.elapsed(msg.timeLeft * 1000, 1000).then(null, null, function(n) {
							_this.clock.firstChild.textContent = n;
						});
					}),
					Promise.dumb()
				),
				WebSocketPromise.getMessagePromise(_this.ws, 'scores').then(function(msg) {
					var scoreTd;
					while(_this.displayZone.firstChild){
						_this.displayZone.removeChild(_this.displayZone.firstChild);
					}
					for(var i = msg.answers.length-1; i >= 0; i--) {
						if(!_this.room.players.some(function(player) {
							if(player.id == msg.answers[i].player) {
								scoreTd = _this.scoreTpl.cloneNode(true);
								scoreTd.firstChild.firstChild.textContent = msg.answers[i].answer;
								scoreTd.lastChild.firstChild.textContent = player.name +
									' lie (' + msg.answers[i].points + 'pts)';
								return true;
							}
						})) {
							scoreTd = _this.scoreTpl.cloneNode(true);
							scoreTd.firstChild.firstChild.textContent = msg.answers[i].answer;
							scoreTd.lastChild.firstChild.textContent = ' It\'s true (' +
								msg.answers[i].points + 'pts)';
						}
						_this.displayZone.appendChild(scoreTd);
						_this.displayZone.appendChild(document.createElement('br'));
					}
				})
			);
		}),
		// Handling the end
		WebSocketPromise.getMessagePromise(_this.ws, 'end').then(function(msg){
			// show score view with timeout then end
			return new ScorePromise(_this.app, 'Score', 7000, msg.scores.map(function(score){
				_this.room.players.some(function(player){
					if(player.id == score.player) {
						score.player = player.name;
						return true;
					}
				});
				return score;
			})).then(function(){
				_this.end = true;
			});
		})
	);
};

module.exports = GamePromise;
