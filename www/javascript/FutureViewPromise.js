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
})(this,'FutureViewPromise', ['./libs/promise/Promise'],  function (Promise) {

	// FutureViewPromise constructor
	function FutureViewPromise(name) {
		if(!(this instanceof FutureViewPromise))
			throw Error('Use new to intantiate !');
		Promise.call(this,function(success) {
			require([name+'Promise'],function(promise) {
				success(promise);
			},function(err) {
				require(['ViewPromise'],function ViewPromise(promise) {
					success(promise);
					//console.log(name+' view fallback',err);
				});
			});
			return;
		});
	}

	FutureViewPromise.prototype=Object.create(Promise.prototype);

	return FutureViewPromise;

});
