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
		'./libs/promise/WebSocketPromise'],
	function (Promise, CommandPromise, AnswerPromise, WebSocketPromise) {

	// GamePromise constructor
	function GamePromise(app, name, ws, room) {
		//  Getting view elements
		var view=document.getElementById(name),
				question=view.querySelectorAll('p.text')[0],
				display=view.querySelectorAll('p.text')[1],
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
								var betLinks=bet.querySelectorAll('a');
								betLinks[0].setAttribute('href',betLinks[0].getAttribute('href')+answers[i].id);
								betLinks[1].setAttribute('href',betLinks[1].getAttribute('href')+answers[i].id);
								betLinks[2].setAttribute('href',betLinks[2].getAttribute('href')+answers[i].id);
								display.appendChild(bet);
								display.appendChild(document.createElement('br'));
							}
						});
					}).then(function() {
						show();
						// ask a bet and wait for results even if no bet
						return Promise.any(
							Promise.all(new CommandPromise(app.cmdMgr,'bet',name).then(function(data) {
								ws.send(JSON.stringify({
									'type':'bet',
									'answer':data.params.answer,
									'bet':data.params.points
								}));
							}), Promise.dumb()),
							WebSocketPromise.getMessagePromise(ws,'scores').then(function(msg) {
								while(display.firstChild)
									display.removeChild(display.firstChild);
								for(var i=msg.answers.length-1; i>=0; i--) {
									var score=scoreTpl.cloneNode(true);
									score.firstChild.firstChild.textContent=msg.answers[i].answer;
									app.room.players.some(function(player){
										if(player.id==msg.answers[i].player) {
											score.lastChild.firstChild.textContent=player.name+' (+'+msg.answers[i].points+'pts)';
											return true;
										}
									});
									display.appendChild(score);
									display.appendChild(document.createElement('br'));
								}
							})
						);
					}),
					// Handling the end
					WebSocketPromise.getMessagePromise(ws,'end').then(function(msg){
						// show score view with timeout then end
						end=true;
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
