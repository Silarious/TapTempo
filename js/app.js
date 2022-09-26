"use strict"; //! JS Strict Mode

//Global Variables
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let context = new AudioContext(),
osc = null,
volume = null,
bpmValue = document.getElementById('bpmBox').value,
bpmMutateValue = document.getElementById('bpmMutateBox').value,
countsMutate = document.getElementById('countsMutateBox').value,
mutationStart = document.getElementById('mutationStartBox').value,
counts = document.getElementById('countsBox');
let active;
let countClock = 0;

window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return new Date().getTime(); };
})();

//Produce sound with different paramters to shape the oscilator.
function sound() {
	let masterVolume = Number(document.getElementById('masterVolumeBox').value);
	let attack = Number(document.getElementById('attackBox').value);
	let decay = Number(document.getElementById('decayBox').value);
	let sustain = Number(document.getElementById('sustainBox').value);
	let sustainLevel = Number(document.getElementById('sustainLevelBox').value);
	let release = Number(document.getElementById('releaseBox').value);

	osc = context.createOscillator();
	volume = context.createGain();
	osc.connect(volume);
	osc.type = oscType.options[document.getElementById('oscType').selectedIndex].value;
	osc.frequency.value = Number(document.getElementById('freqBox').value);
	volume.connect(context.destination);
	osc.start(0);


	//Attack
	volume.gain.exponentialRampToValueAtTime(1 * masterVolume, context.currentTime + attack);
	volume.gain.setValueAtTime(1 * masterVolume, context.currentTime + attack);

	//Decay & sustain
	volume.gain.exponentialRampToValueAtTime(sustainLevel * masterVolume, context.currentTime + decay + attack);
	volume.gain.setValueAtTime(sustainLevel * masterVolume, context.currentTime + decay + attack);
	//Release
	volume.gain.exponentialRampToValueAtTime(0.00001 * masterVolume, context.currentTime + decay + attack + sustain + release);

	let totalTime = attack + decay + sustain + release + 0.00001;
	osc.stop(context.currentTime + totalTime);
}

//Stop BPM loop
document.getElementById('stop').addEventListener('click', function () {
	active = false;
	countClock = 0;
	document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;
});

//Main BPM 
function BPM(bpm = 60, bars = 1, counts = 4) {
	if (active === true && counts !== 0) {
		sound()
		var t1 = performance.now();
		countClock++
		document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;
		if (document.getElementById('infiniteLoop').checked) {
			loop(1,t1)
		} else {
			counts -= 1;
			loop(counts,t1)
		}
	} else if (counts === 0) {
		active = false;
	}
	
}

function mutateBPM(){
	let mutationRange =  bpmMutateValue - bpmValue;
	
	let mutateStep = mutationRange/countsMutate;

	console.log(mutationRange,mutateStep);
}
mutateBPM()

function loop(counts,t1) {
	if (active !== false) {
		bpmValue = document.getElementById('bpmBox').value;
		let delay = 60000 / bpmValue;
		var t2 = performance.now();
		setTimeout(function () {
			var t3 = performance.now();
			BPM(bpmValue, 1, counts)
			console.log((t3-t1),`Delay: ${delay} ms`);
		}, delay);
	}
}

//Event Listeners
/* document.querySelectorAll('.inputElement').forEach(item => {
	item.addEventListener('change', event => {
		if (item.value > item.max) {
			item.value = item.max;
		} else if (item.value < item.min) {
			item.value = item.min;
		}
	})
}); */
document.getElementById('playSound').addEventListener('click', function () {
	sound()
});

document.getElementById('start').addEventListener('mousedown', function () {
	if (active === false || active !== true) {
		active = true;
		BPM(bpmValue, 1, counts.value)
		countClock = 1;
		document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;
		
	}
});

//Note Freq Calculations
const referenceNoteFrequency = 440;
const A = Math.pow(2, (1 / 12));

function calcFreq(refFreq, steps) {
	let result = (refFreq * Math.pow(A, steps)).toFixed(6);
	return Number(result)
}

//console.log(calcFreq(referenceNoteFrequency, 1))

//Tempo Marking Switch
function switchBPMVerb(bpmValue){
	let x = bpmValue;
	switch (x){
		case (x < 15): "Segniter"; break;
		case (x < 25): "Larghissimo"; break;
		case (x < 45): "Grave"; break;
		case (x < 60): "Lento"; break;
		case (x < 75): "Adagio"; break;
		case (x < 105): "Andante"; break;
		case (x < 120): "Moderato"; break;
		case (x < 155): "Allegro"; break;
		case (x < 175): "Vivace "; break;
		case (x < 200): "Presto"; break;
		case (x < 250): "Prestissimo"; break;
		case (x >= 250): "Celerrimus"; break;
	}
}

//Debugging


//TODO eliminate code duplication for osc parameters, see BPM() & ('playSound').addEventListener