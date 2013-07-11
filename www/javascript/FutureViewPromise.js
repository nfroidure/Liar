// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['require','./libs/promise/Promise'],  function (require, Promise) {
// START: Module logic start

	// FutureViewPromise constructor
	function FutureViewPromise(name) {
		if(!(this instanceof FutureViewPromise))
			throw Error('Use new to intantiate !');
		Promise.call(this,function(success) {
			// Testing global context for constructors
			if(root.ViewPromise) {
				if(root[name+'Promise'])
					success(root[name+'Promise']);
				else
					success(root.ViewPromise);
			// Fallback to requireJS
			} else {
				require(['./'+name+'Promise'],function(promise) {
					success(promise);
				},function(err) {
					require(['./ViewPromise'],function ViewPromise(promise) {
						success(promise);
					});
				});
			}
			return;
		});
	}

	FutureViewPromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return FutureViewPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='FutureViewPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
