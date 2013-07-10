// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./FutureViewPromise',
		'./libs/commandor/CommandPromise'],
	function (Promise, FutureViewPromise, CommandPromise) {
// START: Module logic start

	// ViewPromise constructor
	function ViewPromise(app, name, timeout) {
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
			}
			// UI interactions
			var pool, end=false;
			function main() {
				show();
				pool=Promise.any(
					// Handling the back button
					new CommandPromise(app.cmdMgr,'back',name).then(function() {
						end=true;
					}),
					// Handling menu
					new CommandPromise(app.cmdMgr,'menu',name).then(function(data) {
						// Loading the selected view
						return new FutureViewPromise(data.params.view).then(function(ViewPromise){
							return new ViewPromise(app,data.params.view);
						});
					}),
					(timeout?Promise.elapsed(timeout).then(function() {
						end=true;
					}):Promise.dumb())
				);
				pool.then(function() {
					if(end)
						success();
					else
						main();
				});
			}
			main();
			var dispose=function() {
				pool.dispose();
			};
			return dispose;
		});
	}

	ViewPromise.prototype=Object.create(Promise.prototype);

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
