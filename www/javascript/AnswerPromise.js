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
})(this,'AnswerPromise', ['./libs/promise/Promise','./CommandPromise',
		'./libs/promise/WebSocketPromise','./ViewPromise'],
	function (Promise, CommandPromise, WebSocketPromise, ViewPromise) {

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
				messagePromise=WebSocketPromise.getMessagePromise(ws,'answers').then(function(msg) {
					answers=msg.answers;
					end=true;
				});
			function main() {
				show();
				// Handling the form
				pool=Promise.any(
					new CommandPromise(app.cmdMgr,'send',name).then(function(data) {
						ws.send(JSON.stringify({
							'type':'answer',
							'answer':data.element['answer'].value
						}));
					data.element['answer'].value='';
					return Promise.any(messagePromise,
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
							button.setAttribute('value','Lie ('+msg.timeLeft+')');
							timeout=setTimeout(arguments.callee,999)
						},999);
						// return exit timeout
						return messagePromise;
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

	return AnswerPromise;

});
