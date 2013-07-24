// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./FutureViewPromise',
		'./libs/commandor/CommandPromise'],
	function (Promise, FutureViewPromise, CommandPromise) {
// START: Module logic start

	// ViewPromise constructor
	function ViewPromise(app, name, timeout) {
		var that=this;
		// Keeping a ref to the app
		this.app=app;
		this.name=name;
		//  Getting view
		this.view=document.getElementById(name);
		// Calling parent constructor
		Promise.call(this,function(success,error,progress) {
			var promisePool;
			// UI interactions
			that.end=false;
			function main() {
				that.display();
				promisePool=that.loop(timeout);
				promisePool.then(function(value) {
					if(that.end) {
						that.hide();
						success(value);
					} else {
						main();
					}
				});
			}
			main();
			var dispose=function() {
				promisePool.dispose();
				that.hide();
			};
			return dispose;
		});
	}

	ViewPromise.prototype=Object.create(Promise.prototype);

	ViewPromise.prototype.display=function () {
		// Hidding other views
		Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
			element.classList.remove('selected');
			});
		// Showing current view
		this.view.classList.add('selected');
	};

	ViewPromise.prototype.hide=function () {
		
	};

	ViewPromise.prototype.loop=function (timeout) {
		var that=this;
		return Promise.any(
			// Handling the back button
			new CommandPromise(that.app.cmdMgr,'back',that.name).then(function() {
				that.end=true;
			}),
			// Handling menu
			new CommandPromise(that.app.cmdMgr,'menu',that.name).then(function(data) {
				// Loading the selected view
				return new FutureViewPromise(data.params.view).then(function(ViewPromise){
					return new ViewPromise(app,data.params.view);
				});
			}),
			(timeout?Promise.elapsed(timeout).then(function() {
				that.end=true;
			}):Promise.dumb())
		);
	};

// END: Module logic end

	return ViewPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ViewPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
