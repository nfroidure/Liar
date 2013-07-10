// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./libs/commandor/CommandPromise',
		'./libs/promise/dom/WebSocketPromise','./ViewPromise'],
		function(Promise, CommandPromise, WebSocketPromise, ViewPromise) {
// START: Module logic start

	// ProfilePromise constructor
	function AnswerPromise(app, name, ws, question) {
		//  Getting view
		var view=document.getElementById(name);
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
					element.classList.remove('selected');
				});
				// Showing current view
				view.classList.add('selected');
				// Displaying the question
				view.querySelector('p.text').firstChild.textContent=question;
			}
			// UI interactions
			var pool, end=false,
				button=view.querySelector('input[type="submit"]'),
				timeLeft=-1, timeout, answers,
				answersPromise=WebSocketPromise.getMessagePromise(ws,'answers').then(function(msg) {
					answers=msg.answers;
					end=true;
				});
			function main() {
				show();
				pool=Promise.any(
				// Handling the answer
					new CommandPromise(app.cmdMgr,'send',name).then(function(data) {
						ws.send(JSON.stringify({
							'type':'answer',
							'answer':data.element['answer'].value
						}));
					data.element['answer'].value='';
					// show a simple view and wait answers
					return Promise.any(answersPromise,
						new ViewPromise(app,'Answered'));
					}),
					// handle the timeout warn
					WebSocketPromise.getMessagePromise(ws,'answer').then(function(msg) {
						timeLeft=msg.timeLeft;
						// discount seconds
						button.setAttribute('value','Lie ('+msg.timeLeft+')');
						timeout=setTimeout(function answerTimeout() {
							if(timeLeft>0)
								timeLeft--;
							button.setAttribute('value','Lie ('+timeLeft+')');
							timeout=setTimeout(arguments.callee,999)
						},999);
						// wait for answers
						return answersPromise;
					}));
				pool.then(function() {
					if(end) {
						button.setAttribute('value','Lie');
						clearTimeout(timeout);
						success(answers);
					}
					else
						main();
				});
			}
			main();
			var dispose=function() {
				pool.dispose();
				clearTimeout(timeout);
				button.setAttribute('value','Lie');
			};
			return dispose;
		});
	}

	AnswerPromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return AnswerPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='AnswerPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
