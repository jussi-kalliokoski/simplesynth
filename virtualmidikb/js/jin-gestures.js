(function(Jin){ // This is a module to make different event implementations behave similarly.
	var	bind = Jin.bind,
		unbind = Jin.unbind,
		stdevt = Jin.stdevt = {},
		extend = Jin.extend,
		settings = Jin.settings,
		mousedown = 'mousedown',
		mousemove = 'mousemove',
		mouseup = 'mouseup',
		touchstart = 'touchstart',
		touchmove = 'touchmove',
		touchend = 'touchend',
		touchcancel = 'touchcancel',
		gesturestart = 'gesturestart',
		gesturechange = 'gesturechange',
		gestureend = 'gestureend',
		gesturecancel = 'gesturecancel',
		MozTouchDown = 'MozTouchDown',
		MozTouchMove = 'MozTouchMove',
		MozTouchUp = 'MozTouchUp',
		mousewheel = 'mousewheel',
		DOMMouseScroll = 'DOMMouseScroll';

	// Mousewheel unifier.
	bind.mousescroll =
	{
		bind: function(elem, type, func, pass)
		{
			var fnc = function(e)
			{
				if (!e){ // Fix some ie bugs...
					e = window.event;
				}
				if (!e.stopPropagation){
					e.stopPropagation = function(){ this.cancelBubble = true; };
				}
				var delta = 0;
				e.data = pass;
				if (e.wheelDelta){
					delta = event.wheelDelta / 120;
					if (window.opera){
						delta = -delta;
					}
				}
				else if (e.detail){
					delta = -e.detail / 3;
				}
				e.delta = delta;
				if (delta){
					func.call(elem, e);
				}
			};
			if (document.addEventListener){
				elem.addEventListener(mousewheel, fnc, false);
				elem.addEventListener(DOMMouseScroll, fnc, false);
			} else {
				elem.attachEvent('on' + mousewheel, fnc);
				elem.attachEvent('on' + DOMMouseScroll, fnc);
			}
			if (!elem._binds){
				elem._binds = [];
			}
			elem._binds.push({type: mousewheel, func: func, fnc: fnc});
			elem._binds.push({type: DOMMouseScroll, func: func, fnc: fnc});
		}, unbind: function(elem, type, func){
			unbind(elem, 'mousewheel', func);
			unbind(elem, 'DOMMouseScroll', func);
		}, trigger: function(){} // We should do something here, too...
	};

	(function(){ // Detect touch support
		var el = document.createElement('div'),
		properties = [touchstart, touchmove, touchend, touchcancel, gesturestart, gesturechange, gestureend, gesturecancel, MozTouchDown, MozTouchMove, MozTouchUp],
		support = {touches: 0, gestures: 0, moztouches: 0}, i, evname;
		for (i=0; i<properties.length; i++){
			evname = 'on' + properties[i].toLowerCase();
			support[properties[i]] = !!(evname in el);
			if (!support[properties[i]]){
				el.setAttribute(evname, 'return;');
				support[properties[i]] = typeof el[evname] === 'function';
			}
		}
		el = null;
		/*with (support){ // JSLint doesn't like with.
			touches = touchstart && touchend && touchmove;
			gestures = gesturestart && gesturechange && gesturechange;
			moztouches = MozTouchDown && MozTouchMove && MozTouchUp;
		}*/
		stdevt.touchSupport = support;
		//So... What do we do with these...?
	})();

	// Element grabber
	(function(){
		function grab(elem, options)
		{
			var data = {
				move: {x: 0, y: 0},
				offset: {x: 0, y: 0},
				position: {x: 0, y: 0},
				start: {x: 0, y: 0},
				affects: document.documentElement,
				stopPropagation: false,
				preventDefault: true,
				touch: true // Implementation unfinished, and doesn't support multitouch
			};
			extend(data, options);
			data.element = elem;
			bind(elem, mousedown, mouseDown, data);
			if (data.touch){
				bind(elem, touchstart, touchStart, data);
			}
		}
		function ungrab(elem){
			unbind(elem, mousedown, mousedown);
		}
		function mouseDown(e){
			e.data.position.x = e.pageX;
			e.data.position.y = e.pageY;
			e.data.start.x = e.pageX;
			e.data.start.y = e.pageY;
			e.data.event = e;
			if (e.data.onstart && e.data.onstart.call(e.data.element, e.data)){
				return;
			}
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.stopPropagation){
				e.stopPropagation();
			}
			bind(e.data.affects, mousemove, mouseMove, e.data);
			bind(e.data.affects, mouseup, mouseUp, e.data);
		}
		function mouseMove(e){
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.preventDefault){
				e.stopPropagation();
			}
			e.data.move.x = e.pageX - e.data.position.x;
			e.data.move.y = e.pageY - e.data.position.y;
			e.data.position.x = e.pageX;
			e.data.position.y = e.pageY;
			e.data.offset.x = e.pageX - e.data.start.x;
			e.data.offset.y = e.pageY - e.data.start.y;
			e.data.event = e;
			if (e.data.onmove){
				e.data.onmove.call(e.data.element, e.data);
			}
		}
		function mouseUp(e){
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.stopPropagation){
				e.stopPropagation();
			}
			unbind(e.data.affects, mousemove, mouseMove);
			unbind(e.data.affects, mouseup, mouseUp);
			e.data.event = e;
			if (e.data.onfinish){
				e.data.onfinish.call(e.data.element, e.data);
			}
		}
		function touchStart(e){
			e.data.position.x = e.touches[0].pageX;
			e.data.position.y = e.touches[0].pageY;
			e.data.start.x = e.touches[0].pageX;
			e.data.start.y = e.touches[0].pageY;
			e.data.event = e;
			if (e.data.onstart && e.data.onstart.call(e.data.element, e.data)){
				return;
			}
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.stopPropagation){
				e.stopPropagation();
			}
			bind(e.data.affects, touchmove, touchMove, e.data);
			bind(e.data.affects, touchend, touchEnd, e.data);
		}
		function touchMove(e){
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.stopPropagation){
				e.stopPropagation();
			}
			e.data.move.x = e.touches[0].pageX - e.data.position.x;
			e.data.move.y = e.touches[0].pageY - e.data.position.y;
			e.data.position.x = e.touches[0].pageX;
			e.data.position.y = e.touches[0].pageY;
			e.data.offset.x = e.touches[0].pageX - e.data.start.x;
			e.data.offset.y = e.touches[0].pageY - e.data.start.y;
			e.data.event = e;
			if (e.data.onmove){
				e.data.onmove.call(e.data.elem, e.data);
			}
		}
		function touchEnd(e){
			if (e.preventDefault && e.data.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation && e.data.stopPropagation){
				e.stopPropagation();
			}
			unbind(e.data.affects, touchmove, touchMove);
			unbind(e.data.affects, touchend, touchEnd);
			e.data.event = e;
			if (e.data.onfinish){
				e.data.onfinish.call(e.data.element, e.data);
			}
		}

		Jin('grab', grab);
		Jin('ungrab', ungrab);

		Jin.layer.prototype.grab = function(a, b){
			return this.each(function(){
				return Jin.grab(this, a, b);
			});
		};
		Jin.layer.prototype.ungrab = function(a){
			return this.each(function(){
				return Jin.ungrab(this, a);
			});
		};
	})();

	(function(){ // Drag and drop
		function drag(elem, func)
		{
			bind(elem, mousedown, startdrag, func);
			bind(elem, touchstart, startdrag, func);
		}

		function drop(elem, funcdrop, funcover)
		{
			bind(elem, mousemove, dragover, funcover);
			bind(elem, touchmove, dragover, funcover);
			bind(elem, mouseup, dragfinish, funcdrop);
			bind(elem, touchend, dragfinish, funcdrop);
		}

		function startdrag(e)
		{
			e.setData = function(type, value){ data = {type: type, value: value}; };
			e.data.call(this, e);
			if (data === undefined){
				return;
			}
			bind(document, mouseup, docrelease);
			bind(document, touchend, docrelease);
			bind(document, mousemove, move);
			bind(document, touchmove, move);
			if (e.preventDefault){
				e.preventDefault();
			}
		}

		function dragover(e) // Something here...
		{
		
		}

		function dragfinish(e)
		{
			if (data === undefined){
				return;
			}
			e.getData = function(type){
				if (data.type === type){
					return data.value;
				}
			};
			e.data.call(this, e);
		}

		function move(e)
		{
			if (e.preventDefault){
				e.preventDefault();
			}
			if (e.stopPropagation){
				e.stopPropagation();
			}
		}

		function docrelease(e)
		{
			if ((data === undefined) || (e.touches && e.touches.length)){
				return;
			}
			if (e.preventDefault){
				e.preventDefault();
			}
			data = undefined;
			unbind(document, 'mouseup', docrelease);
			unbind(document, 'touchend', docrelease);
			unbind(document, 'mousemove', move);
			unbind(document, 'touchmove', move);
			if (settings.dragdrop.onfinish){
				settings.dragdrop.onfinish.call(this, e);
			}
		}

		settings.dragdrop = {};
		Jin('drag', drag);
		Jin('drop', drop);
	})();
}(Jin));
