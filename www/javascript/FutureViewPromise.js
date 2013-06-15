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
})(this,'FutureViewPromise', ['require','./libs/promise/Promise'],  function (require, Promise) {

	// FutureViewPromise constructor
	function FutureViewPromise(name) {
		if(!(this instanceof FutureViewPromise))
			throw Error('Use new to intantiate !');
		Promise.call(this,function(success) {
			require(['./'+name+'Promise'],function(promise) {
				success(promise);
			},function(err) {
				require(['./ViewPromise'],function ViewPromise(promise) {
					success(promise);
				});
			});
			return;
		});
	}

	FutureViewPromise.prototype=Object.create(Promise.prototype);

	return FutureViewPromise;

});
