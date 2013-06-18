// AMD stuff : Browser + RequireJS
(function (root, moduleName, deps, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define(deps, factory);
	} else {
		// Browser globals
		root[moduleName] = factory.apply(root,deps.map(function(dep) {
			return root[dep];
		}));
	}
})(this, 'GamePromise', ['./libs/promise/Promise','./CommandPromise', './AnswerPromise',
		'./libs/promise/dom/WebSocketPromise','./ScorePromise'],
	function (Promise, CommandPromise, AnswerPromise, WebSocketPromise, ScorePromise) {

	// GamePromise constructor
	function GamePromise(app, name, ws, room) {
		//  Getting view elements
		var view=document.getElementById(name),
				question=view.querySelectorAll('p.text')[0],
				display=view.querySelectorAll('p.text')[1],
				score=view.querySelectorAll('ul.infos span')[0],
				points=view.querySelectorAll('ul.infos span')[1],
				clock=view.querySelectorAll('ul.infos span')[2],
				betTpl=display.firstChild, scoreTpl=display.lastChild;
		
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
					element.classList.remove('selected');
				});
				// Showing current view
				view.classList.add('selected');
			}
			// UI interactions
			var pool, end=false;
			display.removeChild(betTpl);
			display.removeChild(scoreTpl);
			// Load message
			question.firstChild.textContent='Loading the question...';
			score.firstChild.textContent=0;
			points.firstChild.textContent=10;
			clock.firstChild.textContent='-';
			function main() {
				show();
				pool=Promise.any(
					// Handling a round
					WebSocketPromise.getMessagePromise(ws,'round').then(function(msg){
						while(display.firstChild)
							display.removeChild(display.firstChild);
						// Displaying the question
						question.firstChild.textContent=msg.question;
						// show round
						var h1=view.querySelector('h1');
						h1.firstChild.textContent='Round #'+msg.round;
						// ask an answer AND get the others answers
						return	new AnswerPromise(app,'Answer',ws,msg.question).then(function(answers) {
							for(var i=answers.length-1; i>=0; i--) {
								var bet=betTpl.cloneNode(true);
								bet.firstChild.firstChild.textContent='- '+answers[i].answer;
								var leftPoints=parseInt(points.firstChild.textContent,10);
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
								display.appendChild(bet);
								display.appendChild(document.createElement('br'));
							}
						clock.firstChild.textContent='-';
						});
					}).then(function() {
						show();
						// ask a bet and wait for results even if no bet
						return Promise.any(
							Promise.all(
								new CommandPromise(app.cmdMgr,'bet',name).then(function(data) {
									points.firstChild.textContent=parseInt(points.firstChild.textContent,10)-parseInt(data.params.points,10);
									ws.send(JSON.stringify({
										'type':'bet',
										'answer':data.params.answer,
										'bet':data.params.points
									}));
								}),
								WebSocketPromise.getMessagePromise(ws,'bet').then(function(msg) {
									timeLeft=msg.timeLeft;
									// discount seconds
									clock.firstChild.textContent=msg.timeLeft;
									timeout=setTimeout(function answerTimeout() {
										if(timeLeft>0)
											timeLeft--;
										clock.firstChild.textContent=timeLeft;
										timeout=setTimeout(arguments.callee,999)
									},999);
								}),
								Promise.dumb()),
							WebSocketPromise.getMessagePromise(ws,'scores').then(function(msg) {
								var scoreTd;
								while(display.firstChild)
									display.removeChild(display.firstChild);
								for(var i=msg.answers.length-1; i>=0; i--) {
									if(!room.players.some(function(player){
										if(player.id==msg.answers[i].player) {
											scoreTd=scoreTpl.cloneNode(true);
											scoreTd.firstChild.firstChild.textContent=msg.answers[i].answer;
											scoreTd.lastChild.firstChild.textContent=player.name+' lie ('+msg.answers[i].points+'pts)';
											return true;
										}
									})) {
										scoreTd=scoreTpl.cloneNode(true);
										scoreTd.firstChild.firstChild.textContent=msg.answers[i].answer;
										scoreTd.lastChild.firstChild.textContent=' It\'s true ('+msg.answers[i].points+'pts)';
									}
									display.appendChild(scoreTd);
									display.appendChild(document.createElement('br'));
								}
							})
						);
					}),
					// Handling the end
					WebSocketPromise.getMessagePromise(ws,'end').then(function(msg){
						// show score view with timeout then end
						return new ScorePromise(app,'Score',10000, msg.scores.map(function(score){
							room.players.some(function(player){
								if(player.id==score.player) {
									score.player=player.name;
									return true;
								}
							});
							return score;
						})).then(function(){
							end=true;
						});
					})
				);
				pool.then(function() {
					if(end) {
						while(display.firstChild)
							display.removeChild(display.firstChild);
						display.appendChild(betTpl);
						display.appendChild(scoreTpl);
						success();
						}
					else
						main();
				});
			}
			main();
			var dispose=function() {
				pool.dispose();
				while(display.firstChild)
					display.removeChild(display.firstChild);
				display.appendChild(betTpl);
				display.appendChild(scoreTpl);
			};
			return dispose;
		});
	}

	GamePromise.prototype=Object.create(Promise.prototype);

	return GamePromise;

});
