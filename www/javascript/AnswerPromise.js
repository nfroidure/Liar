// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./libs/commandor/CommandPromise',
		'./libs/promise/dom/WebSocketPromise','./ViewPromise','./AnsweredPromise'],
		function(Promise, CommandPromise, WebSocketPromise, ViewPromise, AnsweredPromise) {
// START: Module logic start

	// AnswerPromise constructor
	function AnswerPromise(app, name, ws, question) {
		this.ws=ws;
		// Calling parent constructor
		ViewPromise.call(this, app, name);
		// Registering UI elements
		this.button=this.view.querySelector('input[type="submit"]');
		// Displaying the question
		this.view.querySelector('p.text').firstChild.textContent=question;
	}

	AnswerPromise.prototype=Object.create(ViewPromise.prototype);

	AnswerPromise.prototype.hide=function () {
		clearTimeout(this.timeout);
		this.button.setAttribute('value','Lie');
	};

	AnswerPromise.prototype.loop=function (timeout) {
		var that=this;
		// handle the answers reception
		var answersPromise=WebSocketPromise.getMessagePromise(that.ws,'answers').then(function(msg) {
			that.end=true;
			return msg.answers;
		});
		// handle the timeout warn
		var timeoutPromise=WebSocketPromise.getMessagePromise(that.ws,'answer').then(function(msg) {
			// discount seconds
			return Promise.elapsed(msg.timeLeft*1000,1000);
		});
		// handle the user answer
		var	answeredPromise=new CommandPromise(that.app.cmdMgr,'send',that.name).then(function(data) {
			that.ws.send(JSON.stringify({
				'type':'answer',
				'answer':data.element['answer'].value
			}));
			data.element['answer'].value='';
		});
		// show a simple view and wait answers
		return Promise.any(
			answersPromise,
			Promise.all(
				Promise.dumb(),
				// Begin the discount if not answering
				timeoutPromise.then(null, null,function(n) {
					that.button.setAttribute('value','Lie ('+n+')');
				}),
				// display the answered view when answered
				answeredPromise.then(function(){
					return new AnsweredPromise(that.app,'Answered', timeoutPromise);
				})
			)
		);
	};

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
