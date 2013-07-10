// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./libs/promise/Promise','./FutureViewPromise',
		'./libs/commandor/CommandPromise'],
	function (Promise, FutureViewPromise, CommandPromise) {
// START: Module logic start

	// ScorePromise constructor
	function ScorePromise(app, name, timeout, scores) {
		//  Getting view and preparing elements
		var view=document.getElementById(name),
			display=view.querySelector('p.text'),
			itemsTpls=view.querySelectorAll('p.text>span');
		while(display.firstChild)
			display.removeChild(display.lastChild);
		Promise.call(this,function(success,error,progress) {
			function show() {
				// Hidding other views
				Array.prototype.forEach.call(document.querySelectorAll('.view.selected'), function(element) {
					element.classList.remove('selected');
					});
				// filling the display zones
				var item;
				for(var i=0, j=scores.length; i<j; i++){
					// 1st and 2nd
					if(i<2) {
						item=itemsTpls[i].cloneNode(true);
					// looser
					} else if(1==j-i) {
						item=itemsTpls[4].cloneNode(true);
					// 3rd
					} else if(i<3) {
						item=itemsTpls[2].cloneNode(true);
					// others
					} else {
						item=itemsTpls[3].cloneNode(true);
					}
					item.childNodes[1].firstChild.textContent=scores[i].player+' ('+scores[i].score+'pts)';
					display.appendChild(item);
				}
				// Showing current view
				view.classList.add('selected');
			}
			// Promise tree
			var pool, end=false;
			function main() {
				show();
				pool=Promise.elapsed(timeout).then(function() {
						end=true;
					});
				pool.then(function() {
					if(end) {
						cleanup();
						success();
						}
					else
						main();
				});
			}
			main();
			var cleanup=function() {
				while(display.firstChild)
					display.removeChild(display.lastChild);
				for(var i=0, j=itemsTpls.length; i<j; i++)
					display.appendChild(itemsTpls[i]);
				}
			var dispose=function() {
				cleanup();
				pool.dispose();
			};
			return dispose;
		});
	}

	ScorePromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return ScorePromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='ScorePromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
