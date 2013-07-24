// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./ViewPromise'],
	function (ViewPromise) {
// START: Module logic start

	// ScorePromise constructor
	function AnsweredPromise(app, name, timeoutPromise) {
		this.timeoutPromise=timeoutPromise;
		// Calling parent constructor
		ViewPromise.call(this, app, name);
		// Preparing UI elements
		this.timeLeft=this.view.querySelector('p.text>span');
	}

	AnsweredPromise.prototype=Object.create(ViewPromise.prototype);

	AnsweredPromise.prototype.hide=function () {
		this.timeLeft.firstChild.textContent='.';
	};

	AnsweredPromise.prototype.loop=function (timeout) {
		var that=this;
		return this.timeoutPromise.then(function() {
				that.end=true;
			}, null, function(n) {
				that.timeLeft.firstChild.textContent=' ('+n+').';
			});
	};

// END: Module logic end

	return AnsweredPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='AnsweredPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
