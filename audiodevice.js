function AudioDevice(sampleRate, channelCount, readFn){
	function mozAudioDevice(samplerate, channelCount, readFn)
	{
		var self = this,
		checkPos = 0,
		channels = channelCount,
		prebufferSize = samplerate / 2,
		started = new Date().valueOf(),
		currentWritePosition = 0,
		timer, countertimer,
		tail = null,
		audiodevice = new Audio();
		audiodevice.mozSetup(channelCount, samplerate);
		function timerfunc(){
			var written, currentPosition, available, soundData;
			if (tail){
				written = audiodevice.mozWriteAudio(tail);
				currentWritePosition += written;
				if (written < tail.length){
					tail = tail.slice(written);
					return tail;
				}
				tail = null;
			}

			currentPosition = audiodevice.mozCurrentSampleOffset();
			available = Number(currentPosition + prebufferSize * channels - currentWritePosition)+0;
			if (available > 0){
				soundData = new Float32Array(available);
				readFn(soundData);
				written = audiodevice.mozWriteAudio(soundData);
				if (written < soundData.length){
					tail = soundData.slice(written);
				}
				currentWritePosition += written;
			}
		}
		timer = setInterval(timerfunc, 20);
		this.kill = function(){
			clearInterval(timer);
		};
	}

	function flashAudioDevice(){
		//Yeah... unfinished.
	}

	var dev;
	try{
		dev = new mozAudioDevice(sampleRate, channelCount, readFn);
	}catch(e){
		dev = new flashAudioDevice(sampleRate, channelCount, readFn);
	}
	this.kill = function(){
		dev.kill();
	};
};
