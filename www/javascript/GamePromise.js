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
})(this, 'GamePromise', ['./libs/promise/Promise','./CommandPromise'], function (Promise, CommandPromise) {

	// GamePromise constructor
	function GamePromise(app, name, ws, room) {
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
					// Handling the form
					new CommandPromise(app.cmdMgr,'send',name).then(function(data) {
						app.user={'usernamne':document.getElementById('username')};
						end=true;
					}),
					// Handling the back button
					new CommandPromise(app.cmdMgr,'back',name).then(function() {
						end=true;
					}),
					// Handling menu
					new CommandPromise(app.cmdMgr,'menu',name).then(function(data) {
						// Loading the selected view
						return new GamePromise(app,data.params.view);
					})
				);
				pool.then(function() {
					if(end)
						main();
					else
						success();
				});
			}
			main();
			var dispose=function() {
				pool.dispose();
			};
			return dispose;
		});
	}

	GamePromise.prototype=Object.create(Promise.prototype);

	return GamePromise;

});
