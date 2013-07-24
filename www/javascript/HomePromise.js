// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./FutureViewPromise',
		'./ViewPromise','./libs/commandor/CommandPromise'],
	function (Promise, FutureViewPromise, ViewPromise, CommandPromise) {
// START: Module logic start

	// HomePromise constructor
	function HomePromise(app, name) {
		// Calling parent constructor
		ViewPromise.call(this, app, name);
	}

	HomePromise.prototype=Object.create(ViewPromise.prototype);

	HomePromise.prototype.display=function () {
		var that=this;
		ViewPromise.prototype.display.call(this);
		// Registering UI elements
		this.buttonInstallation=this.view.querySelector('ul.menu li:nth-child(2) a');
		// Checking installation on Firefox
		this.buttonInstallation.style.display='none';
		if(undefined !== navigator.mozApps) {
			var request = navigator.mozApps.getSelf();
			request.onsuccess = function() {
				if (request.result) {
				} else {
					buttonInstallation.style.display='inline-block';
				}
			};
			request.onerror = function() {
			};
		}
		
	};

	HomePromise.prototype.loop=function () {
		var that=this;
		return Promise.any(
			// Handling the install button
			new CommandPromise(that.app.cmdMgr,'install',that.name).then(function() {
				// Installing the application
				var manifestUrl = location.href.substring(0, location.href.lastIndexOf('/')) + '/manifest.webapp';
				var request = window.navigator.mozApps.install(manifestUrl);
				request.onsuccess = function() {
					that.buttonInstallation.style.display='none';
				};
				request.onerror = function() {
				};
			}),
			// Handling menu
			new CommandPromise(that.app.cmdMgr,'menu',that.name).then(function(data) {
				// Loading the selected view
				return new FutureViewPromise(data.params.view)
					.then(function(ViewPromise){
						return new ViewPromise(app,data.params.view);
					});
			})
		);
	};

// END: Module logic end

	return HomePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='HomePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
