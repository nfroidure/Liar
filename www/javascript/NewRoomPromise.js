// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise',
		'./libs/promise/dom/XHRPromise','./libs/commandor/CommandPromise'],
	function (Promise, XHRPromise, CommandPromise) {
// START: Module logic start

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
						success()
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

// END: Module logic end

	return NewRoomPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='NewRoomPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
