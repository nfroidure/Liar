// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./ViewPromise','./libs/commandor/CommandPromise'],
	function (Promise, ViewPromise, CommandPromise) {
// START: Module logic start

	// ProfilePromise constructor
	function ProfilePromise(app, name, block) {
		this.block=block||false;
		// Calling parent constructor
		ViewPromise.call(this, app, name);
		// Filing the form with current values
		if(this.app.user&&this.app.user.name)
			this.view.querySelector('input[type="text"]').value=this.app.user.name;
	}

	ProfilePromise.prototype=Object.create(ViewPromise.prototype);

	ProfilePromise.prototype.display=function () {
		ViewPromise.prototype.display.call(this);
		// if profile form MUST be filled, hiddin cancel button
		if(this.block)
			this.view.querySelector('input[formaction]').setAttribute('style','display:none');
	};

	ProfilePromise.prototype.hide=function () {
		this.view.querySelector('input[formaction]').removeAttribute('style');
	};

	ProfilePromise.prototype.loop=function () {
		var that=this;
		return Promise.any(
			// Handling the form
			new CommandPromise(that.app.cmdMgr,'send',that.name).then(function(data) {
				that.app.user={'name':data.element['username'].value,'gender':-1};
				that.end=true;
			}),
			// Handling the back button
			new CommandPromise(that.app.cmdMgr,'back',that.name).then(function() {
				that.end=true;
			})
		);
	};

// END: Module logic end

	return ProfilePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ProfilePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
