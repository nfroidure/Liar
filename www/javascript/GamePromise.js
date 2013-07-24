// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./libs/commandor/CommandPromise', './AnswerPromise',
		'./libs/promise/dom/WebSocketPromise','./ScorePromise','./ViewPromise'],
	function (Promise, CommandPromise, AnswerPromise, WebSocketPromise,
		ScorePromise, ViewPromise) {
// START: Module logic start

	// GamePromise constructor
	function GamePromise(app, name,  ws, room) {
		this.ws=ws;
		this.room=room;
		// Calling parent constructor
		ViewPromise.call(this, app, name);
		// Registring UI elements
		this.question=this.view.querySelectorAll('p.text')[0];
		this.displayZone=this.view.querySelectorAll('p.text')[1];
		this.score=this.view.querySelectorAll('ul.infos span')[0];
		this.points=this.view.querySelectorAll('ul.infos span')[1];
		this.clock=this.view.querySelectorAll('ul.infos span')[2];
		this.betTpl=this.displayZone.firstChild;
		this.scoreTpl=this.displayZone.lastChild;
		this.displayZone.removeChild(this.betTpl);
		this.displayZone.removeChild(this.scoreTpl);
		// Load message
		this.question.firstChild.textContent='Loading the question...';
		this.score.firstChild.textContent=0;
		this.points.firstChild.textContent=10;
		this.clock.firstChild.textContent='-';
	}

	GamePromise.prototype=Object.create(ViewPromise.prototype);

	//GamePromise.prototype.display=function () {
	//};

	GamePromise.prototype.hide=function () {
		while(this.displayZone.firstChild)
			this.displayZone.removeChild(this.displayZone.firstChild);
		this.displayZone.appendChild(this.betTpl);
		this.displayZone.appendChild(this.scoreTpl);
	};

	GamePromise.prototype.loop=function (timeout) {
		var that=this;
		return Promise.any(
			// Handling a round
			WebSocketPromise.getMessagePromise(that.ws,'round').then(function(msg){
				while(that.displayZone.firstChild)
					that.displayZone.removeChild(that.displayZone.firstChild);
				// Displaying the question
				that.question.firstChild.textContent=msg.question;
				// show round
				var h1=that.view.querySelector('h1');
				h1.firstChild.textContent='Round #'+msg.round;
				// ask an answer AND get the others answers
				return	new AnswerPromise(app,'Answer',that.ws,msg.question).then(function(answers) {
					for(var i=answers.length-1; i>=0; i--) {
						var bet=that.betTpl.cloneNode(true);
						bet.firstChild.firstChild.textContent='- '+answers[i].answer;
						var leftPoints=parseInt(that.points.firstChild.textContent,10);
						var betLinks=bet.querySelectorAll('a');
						if(leftPoints>=1) {
							betLinks[0].setAttribute('href',betLinks[0].getAttribute('href')+answers[i].id);
							betLinks[0].removeAttribute('disabled');
							}
						else
							betLinks[0].setAttribute('disabled','disabled');
						if(leftPoints>=2) {
							betLinks[1].setAttribute('href',betLinks[1].getAttribute('href')+answers[i].id);
							betLinks[1].removeAttribute('disabled');
							}
						else
							betLinks[1].setAttribute('disabled','disabled');
						if(leftPoints>=3) {
							betLinks[2].setAttribute('href',betLinks[2].getAttribute('href')+answers[i].id);
							betLinks[2].removeAttribute('disabled');
							}
						else
							betLinks[2].setAttribute('disabled','disabled');
						that.displayZone.appendChild(bet);
						that.displayZone.appendChild(document.createElement('br'));
					}
				that.clock.firstChild.textContent='-';
				});
			}).then(function() {
				that.display();
				// ask a bet and wait for results even if no bet
				return Promise.any(
					Promise.all(
						new CommandPromise(that.app.cmdMgr,'bet',that.name).then(function(data) {
							that.points.firstChild.textContent=
								parseInt(that.points.firstChild.textContent,10)
								-parseInt(data.params.points,10);
							that.ws.send(JSON.stringify({
								'type':'bet',
								'answer':data.params.answer,
								'bet':data.params.points
							}));
						}),
						WebSocketPromise.getMessagePromise(that.ws,'bet').then(function(msg) {
							// discount seconds
							return Promise.elapsed(msg.timeLeft*1000,1000).then(null, null,function(n) {
								that.clock.firstChild.textContent=n;
							});
						}),
						Promise.dumb()),
					WebSocketPromise.getMessagePromise(that.ws,'scores').then(function(msg) {
						var scoreTd;
						while(that.displayZone.firstChild)
							that.displayZone.removeChild(that.displayZone.firstChild);
						for(var i=msg.answers.length-1; i>=0; i--) {
							if(!that.room.players.some(function(player){
								if(player.id==msg.answers[i].player) {
									scoreTd=that.scoreTpl.cloneNode(true);
									scoreTd.firstChild.firstChild.textContent=msg.answers[i].answer;
									scoreTd.lastChild.firstChild.textContent=player.name
										+' lie ('+msg.answers[i].points+'pts)';
									return true;
								}
							})) {
								scoreTd=that.scoreTpl.cloneNode(true);
								scoreTd.firstChild.firstChild.textContent=msg.answers[i].answer;
								scoreTd.lastChild.firstChild.textContent=' It\'s true ('
									+msg.answers[i].points+'pts)';
							}
							that.displayZone.appendChild(scoreTd);
							that.displayZone.appendChild(document.createElement('br'));
						}
					})
				);
			}),
			// Handling the end
			WebSocketPromise.getMessagePromise(that.ws,'end').then(function(msg){
				// show score view with timeout then end
				return new ScorePromise(app,'Score',7000, msg.scores.map(function(score){
					that.room.players.some(function(player){
						if(player.id==score.player) {
							score.player=player.name;
							return true;
						}
					});
					return score;
				})).then(function(){
					that.end=true;
				});
			})
		);
	};

// END: Module logic end

	return GamePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='GamePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
