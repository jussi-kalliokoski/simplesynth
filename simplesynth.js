(function(global){
	var	samplerate	= 22050,
		oscillator	= new Oscillator(samplerate), // Creates an instance of an oscillator.
		audiodev,
		pressedKeys	= [];

	oscillator.frequency = 0;

	function processAudio(buffer){
		var i, l = buffer.length;
		for (i=0; i<l; i++){ // Iterate through the buffer
			oscillator.generate((Math.random() * 2 - 1) * 0.3); // Advance the oscillator angle, add some flavor with Math.random noise.
			buffer[i] = buffer[++i] = oscillator.getMix() * 0.2; // Set the sample for both channels to oscillator's output, and multiply that with 0.2 to lower the volume to a less irritating/distorted level.
		}
	}

	

	function onmidi(e){
		var i;
		if (e.status === 9){ // 0x9, KEYDOWN
			pressedKeys.unshift(e.data1); // Add the newest key to be first in the array.
		} else if (e.status === 8){ // 0x8, KEYUP
			for (i=0; i<pressedKeys.length; i++){ // Iterate through the keys...
				if (pressedKeys[i] === e.data1){
					pressedKeys.splice(i--, 1); // And remove the matching keys.
				}
			}
		} else { // We don't understand anything else here, so we'll just leave.
			return;
		}
		if (pressedKeys.length){ // If there are any pressed keys.
			oscillator.frequency = 440 * Math.pow(1.059, pressedKeys[0] - 69); // Set the oscillator frequency to match the last key pressed
		} else {
			oscillator.frequency = 0;
		}
	};

	function start(){
		global.onmidi = onmidi;
		document.getElementById('waveshape').addEventListener('change', function(){
			oscillator.waveShape = Number(this.value);
		}, true);
		audiodev = new AudioDevice(samplerate, 2, processAudio);
	}

	global.addEventListener('load', start, true);
}(this));

