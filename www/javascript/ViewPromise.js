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
})(this,'ViewPromise',
	['./libs/promise/Promise','./FutureViewPromise','./CommandPromise'],
	function (Promise, FutureViewPromise, CommandPromise) {

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

	return ViewPromise;

});
