var onmidievent = function(e){
	if (parent && parent.onmidi){
		parent.onmidi(e);
	}
};

(function(window, Jin){
var	isKeyFlat	= [false, true, false, true, false, false, true, false, true, false, true, false],
	keyNames	= ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
	keys		= new Jin.layer(),
	keymap = [
		[90, 48],// C1
		[83, 49],
		[88, 50],
		[68, 51],
		[67, 52],
		[86, 53],
		[71, 54],
		[66, 55],
		[72, 56],
		[78, 57],
		[74, 58],
		[77, 59],
		[81, 60],// C2
		[50, 61],
		[87, 62],
		[51, 63],
		[69, 64],
		[82, 65],
		[53, 66],
		[84, 67],
		[54, 68],
		[89, 69],
		[55, 70],
		[85, 71],
		[73, 72], // C3
		[57, 73],
		[79, 74],
		[48, 75],
		[80, 76]
	],
	container,
	settingButton,
	mouseDown	= false,
	mkey		= -1,
	touchedKeys	= [],
	pressedKeys	= [],
	channel		= 1,
	velocity	= 127,
	pitchBendAmount	= 8192,

	create		= Jin.create,
	bind		= Jin.bind,
	addClass	= Jin.addClass,
	removeClass	= Jin.removeClass;

function isIn(needle, haystack){
	var i, l = haystack.length;
	for (i=0; i<l; i++){
		if (needle === haystack[i]){
			return true;
		}
	}
	return false;
}

function settings(){
	if (localStorage.shadows){
		settings.noShadows = localStorage.shadows !== 'true';
		settings.noAnimation = localStorage.animation !== 'true';
	} else {
		settings.noShadows = false;
		settings.noAnimation = false;
	}
	settings.save = function(){
		localStorage.shadows = !settings.noShadows;
		localStorage.animation = !settings.noAnimation;
	};
	settings.open = function(){
		var settingWindow = document.getElementById('settings'), sh, an;
		if (settingWindow){
			settingWindow.parentNode.removeChild(settingWindow);
			settingWindow = null;
			return;
		}
		settingWindow		= create();
		settingWindow.id	= 'settings';
		document.body.appendChild(settingWindow);
		sh = create('button');
		an = create('button');
		sh.innerHTML = 'Toggle Shadows';
		an.innerHTML = 'Toggle Animation';
		Jin.appendChildren(settingWindow, sh, an);
		Jin.bind(sh, 'click', function(){ Jin.toggleClass(document.body, 'noShadows'); });
		Jin.bind(an, 'click', function(){ Jin.toggleClass(document.body, 'noAnimation'); });
		Jin.bind(settingWindow, 'click', settings.open);
	};
}

function updateArguments(){
	var cmd = Jin.commandLine.id;
	if (cmd('noAnimation') || cmd('lightMode') || settings.noAnimation){
		Jin.addClass(document.body, 'noAnimation');
	} else {
		Jin.removeClass(document.body, 'noAnimation');
	}
	if (cmd('noShadows') || cmd('lightMode') || settings.noShadows){
		Jin.addClass(document.body, 'noShadows');
	} else {
		Jin.removeClass(document.body, 'noShadows');
	}
}

function remap(){
	var i, newMap = {};
	for (i=0; i<keymap.length; i++){
		newMap[keymap[i][0]] = keymap[i][1];
	}
	keymap = newMap;
}

function pitchBend(am){
	if (!am){
		pitchBendAmount = 8192;
	} else {
		pitchBendAmount += am;
	}
	if (pitchBendAmount > 16383){
		pitchBendAmount = 16383;
	}
	if (pitchBendAmount < 0){
		pitchBendAmount = 0;
	}
	var	firstByte	= Math.floor(pitchBendAmount / 128),
		secondByte	= pitchBendAmount - firstByte * 128;
	onmidievent(new MidiEvent(channel, 14, firstByte, secondByte));
}

function release(num){
	var i = pressedKeys.indexOf(num);
	if (num < 0 || i === -1){
		return;
	}
	pressedKeys.splice(i, 1);
	keys.item(num).removeClass('pressed');
	onmidievent(new MidiEvent(channel, 8, num, 0));
}

function press(num){
	var i = pressedKeys.indexOf(num);
	if (num < 0 || i !== -1){
		return;
	}
	pressedKeys.push(num);
	keys.item(num).addClass('pressed');
	onmidievent(new MidiEvent(channel, 9, num, velocity));
}

function mouseKeyPress(num){
	release(mkey);
	mkey = num;
	press(num);
}

function touching(e){
	var i, key, newTouches = [];
	for (i=0; i < e.touches.length; i++){
		key = keys.indexOf(e.touches[i].target);
		if (key === -1){
			return;
		}
		newTouches[i] = key;
	}
	for (i=0; i < touchedKeys.length; i++){
		if (!isIn(touchedKeys[i], newTouches)){
			release(touchedKeys[i]);
		}
	}
	for (i=0; i < newTouches.length; i++){
		if (!isIn(newTouches[i], touchedKeys)){
			press(newTouches[i]);
		}
	}
	touchedKeys = newTouches;
	if (e.preventDefault){
		e.preventDefault();
	}
}

function keyboardParamDown(num){
	if (num === 40) {
		pitchBend(-200);
	} else if (num === 38) {
		pitchBend(200);
	} else {
		return false;
	}
	return true;
}

function keyboardParamUp(num){
	if (num === 40 || num === 38){
		pitchBend();
	} else {
		return false;
	}
	return true;
}

function keyboardPress(num, oct){
	if (keymap[num]){
		press(keymap[num] + oct * 12);
		return true;
	}
}

function keyboardRelease(num, oct){
	if (keymap[num]){
		release(keymap[num] + oct * 12);
		return true;
	}
}

function MidiEvent(channel, status, data1, data2){
	Jin.extend(this, {
		channel: channel,
		status: status,
		data1: data1,
		data2: data2
	});
}

function createKeys(i){
	for (i=0; i<128; i++){
		//keys[i] = create(); // Won't contribute to length, as of Jin 0.2
		keys.push(create());
		keys[i].className = 'key ' + (isKeyFlat[i % 12] ? 'black' : 'white');
		keys[i].title = keyNames[i % 12] + ' ' + Math.floor(i / 12);
		keys[i].id = 'key_' + i;
		container.appendChild(keys[i]);
	}
}

function defineElements(){
	container = create();
	container.id = 'keycontainer';
	container.style.left = '-560px';

	settingButton = create('button');
	settingButton.id = 'settingButton';
	settingButton.title = 'Settings';
	settingButton.innerHTML = 'S';

	Jin.appendChildren(document.body, container, settingButton);
}

function doBindings(){
	function keyDown(e){
		if (keyboardPress(e.which, e.shiftKey * 1 - e.ctrlKey * 1 + e.altKey * 1) || keyboardParamDown(e.which)){
			e.preventDefault();
		}
	}
	function keyUp(e){
		if (keyboardRelease(e.which, e.shiftKey * 1 - e.ctrlKey * 1 + e.altKey * 1) || keyboardParamUp(e.which)){
			e.preventDefault();
		}
	}

	bind(settingButton, 'click', settings.open);
	keys
		.bind('mousedown', function(e){
			e.preventDefault();
			mouseKeyPress(keys.indexOf(this));
		})
		.bind('mousemove', function(e){
			e.preventDefault();
			addClass(this, 'hover');
			if (mouseDown){
				mouseKeyPress(keys.indexOf(this));
			}
		})
		.bind('mouseout', function(e){
			removeClass(this, 'hover');
			mouseKeyPress(-1);
		});
	Jin(document.documentElement)
		.bind('mouseup', function(e) {
			e.preventDefault();
			mouseKeyPress(-1);
			mouseDown = false;
		})
		.bind('mousedown', function(e) {
			mouseDown = true;
		})
		.bind('keydown', keyDown)
		.bind('keyup', keyUp)
		.bind('mousescroll', function(e) {
			var left		= Math.max(Math.min((parseFloat(container.style.left) + e.delta * 50), 0), window.innerWidth - 3075);
			container.style.left	= left+'px';
		});
	Jin(container)
		.bind('touchstart', touching)
		.bind('touchmove', touching) // Well if these aren't messed up...
		.bind('touchend', touching);
	bind(window, 'hashchange', updateArguments);
	if (parent){
		Jin(parent)
			.bind('keydown', keyDown)
			.bind('keyup', keyUp);
	}
}

pressedKeys.indexOf = Jin.layer().indexOf; // Well, if Array.indexOf isn't there, I don't know if any use case fits anyway, but what the heck...

remap();

MidiEvent.name = 'MidiEvent';


Jin(function(){
	settings();
	defineElements();
	createKeys();
	doBindings();
	updateArguments();
});

}(window, Jin));
