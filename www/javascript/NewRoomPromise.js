// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./ViewPromise',
		'./libs/promise/dom/XHRPromise','./libs/commandor/CommandPromise'],
	function (Promise, ViewPromise, XHRPromise, CommandPromise) {
// START: Module logic start

	// NewRoomPromise constructor
	function NewRoomPromise(app, name) {
		// Calling parent constructor
		ViewPromise.call(this, app, name);
	}

	NewRoomPromise.prototype=Object.create(ViewPromise.prototype);

	HomePromise.prototype.loop=function () {
		var that=this;
		return Promise.any(
			// Handling the form
			new CommandPromise(that.app.cmdMgr,'send',that.name).then(function(data) {
				console.log('datas',data);
				return new XHRPromise('POST','/rooms.json',JSON.stringify({
					'name':data.element.elements[0].value,
					'mode':(data.element.elements[2].checked?1:0)
				})).then(function() {
					that.end=true;
				});
			}),
			// Handling the back button
			new CommandPromise(that.app.cmdMgr,'back',that.name).then(function() {
				that.end=true;
			})
		);
	};

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
