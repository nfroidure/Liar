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
})(this,'NewRoomPromise', ['./libs/promise/Promise','./libs/promise/XHRPromise','./CommandPromise'],
	function (Promise, XHRPromise, CommandPromise) {

	// NewRoomPromise constructor
	function NewRoomPromise(app, name, block) {
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
						console.log('datas',data);
						return new XHRPromise('POST','/rooms.json',JSON.stringify({
							'name':data.element.elements[0].value,
							'mode':(data.element.elements[2].checked?1:0)
						})).then(function() {
							end=true;
						});
					}),
					// Handling the back button
					new CommandPromise(app.cmdMgr,'back',name).then(function() {
						end=true;
					})
				);
				pool.then(function() {
					if(end)
						succes()
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

	NewRoomPromise.prototype=Object.create(Promise.prototype);

	return NewRoomPromise;

});
