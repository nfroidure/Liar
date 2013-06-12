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
})(this, 'CommandPromise', ['./libs/promise/Promise'], function (Promise) {

	// XHR promise constructor
	function CommandPromise(commandor,command,view) {
		if(!(this instanceof CommandPromise))
			throw Error('Use new to intantiate !');
		Promise.call(this,function(success) { console.log('register: '+view+'/'+command);
			commandor.suscribe(view+'/'+command,function(event, params, element) {
				dispose();
				success({'event':event, 'params':params, 'element': element });

			});
			var dispose=function() { console.log('unregister: '+view+'/'+command);
				commandor.unsuscribe(view+'/'+command);
			};
			return dispose;
		});
		this.command=command;
	}

	CommandPromise.prototype=Object.create(Promise.prototype);

	return CommandPromise;

});
