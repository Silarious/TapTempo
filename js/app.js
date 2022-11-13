"use strict"; //! JS Strict Mode

//Global Variables
window.AudioContext = window.AudioContext || window.webkitAudioContext;

const getValue = (id) => Number(document.getElementById(id).value);

function setValue(ID,value){
    document.getElementById(`${ID}Box`).value = value;
    document.getElementById(`${ID}Slider`).value = value;
}

let context = new AudioContext();
let osc = null;
let volume = null;
let bpmValue = getValue('bpmBox');
let active;
let countClock = 0;

window.performance = window.performance || {};
performance.now = (function() {
	return performance.now    ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||
        function() { return new Date().getTime(); };
})();

//Produce sound with different paramters to shape the oscilator.
function sound() {
	let masterVolume = getValue('masterVolumeBox');
	let attack = getValue('attackBox');
	let decay = getValue('decayBox');
	let sustain = getValue('sustainBox');
	let sustainLevel = getValue('sustainLevelBox');
	let release = getValue('releaseBox');

	osc = context.createOscillator();
	volume = context.createGain();
	osc.connect(volume);
	osc.type = oscType.options[document.getElementById('oscType').selectedIndex].value;
	osc.frequency.value = getValue('freqBox');
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

//Main BPM 
let beatLoop;
function BPM(){
	if (getValue('bpmBox') > 1 && getValue('bpmBox') < 1000){
	let expected = performance.now();
	let counts = document.getElementById('countsBox').value;
	
	if (counts === 0) {
		bpmStop();
	} else {
		countClock = 1;
		document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;
		sound();
		//TODO Include countClock in count subtraction
		if (document.getElementById('infiniteLoop').checked === false) {
			counts -= 1;
		}	
		//TODO Improve performance/fix buggy sounds when changing tempo
		beatLoop = setTimeout(step, (60000/getValue('bpmBox')));
		let initialBPM = getValue('bpmBox');
		let mutatedBPM = initialBPM;
		let mutationRange = getValue('bpmMutateBox') - initialBPM;
		let mutateStep = mutationRange/getValue('countsMutateBox');
		let delay = getValue('mutationStartBox') + getValue('countsMutateBox');
		let mutateLoopCount = 0;
		console.log(mutationRange,mutateStep);
		function step() {
			setTimeout((e) => {
				//TODO Implement BPM hold at top and bottom of mutation loop
				if (document.getElementById('mutateToggle').checked === true){
					if (countClock >= getValue('mutationStartBox')){
						if (getValue('bpmBox') !== getValue('bpmMutateBox') 
						&& document.getElementById('infiniteLoop').checked === false){
							mutatedBPM += mutateStep;
							setValue('bpm',mutatedBPM);
						} else if (document.getElementById('infiniteLoop').checked === true){
							if (mutateLoopCount < delay 
							&& (getValue('bpmBox') + mutateStep) !== getValue('bpmMutateBox')
							&& (getValue('bpmBox') + mutateStep) !== initialBPM){
							mutatedBPM += mutateStep;
							setValue('bpm',mutatedBPM);
							mutateLoopCount++
							} else {
							mutatedBPM += mutateStep;
							setValue('bpm',mutatedBPM);

							mutateLoopCount = 0;
							mutateStep = -(mutateStep)
							if (delay = getValue('mutationStartBox') + getValue('countsMutateBox'))
							delay -= getValue('mutationStartBox');
							}
						}
					}
				}
				if (active === true && counts !== 0) {
					sound();
					expected += 60000/getValue('bpmBox');
					countClock++
					document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;				
					if (document.getElementById('infiniteLoop').checked === false) {
						counts -= 1;
					}
					step();	
				} else {
					bpmStop();
					setValue('bpm',initialBPM);
				}
			}, Math.max(0, 60000/getValue('bpmBox') - (performance.now() - expected)));
		}
	}
} else {
	console.log('Warning you cannot be outside the allowed BPM range of 1 to 1000')
	setValue('bpm',60)
	BPM()
}
}

function bpmStop(){
	if (active !== false) {
		active = false;
		countClock = 0;
		document.getElementById('CountClock').innerHTML = `Count: ${countClock}`;
		document.querySelectorAll(".bpmMutate").forEach(item => {
			item.disabled = "";
		});
		document.getElementById('infiniteLoop').disabled = "";
		clearTimeout(beatLoop);
		}
};
function bpmStart(){
	if (active === false || active !== true) {
		active = true;
		document.querySelectorAll(".bpmMutate").forEach(item => {
			item.disabled = "disabled";
		});
		document.getElementById('infiniteLoop').disabled = "disabled";
		BPM()
	}
};

function randomBPM() { // min and max included
	let bpmRandMin = getValue('bpmRandMinBox');
	let bpmRandMax = getValue('bpmRandMaxBox');
	let randomInt = Math.floor(Math.random() * (bpmRandMax - bpmRandMin + 1) + bpmRandMin);
	setValue('bpm',randomInt);
}

function guessBPM(){
	bpmStop()
	let guess = getValue('bpmGuessBox');
	let answer = getValue('bpmBox');
	
	let diff = guess - answer;
	let absDiff = Math.abs(diff);
	let diffPercent = ((diff/answer) * 100).toFixed(1);

	let accuracyMessage;
	
	
	if (diff === 0){	
		accuracyMessage = `Right on the money, your guess matches the answer.`;
	} else if (diff >= 0){	
		accuracyMessage = `Your guess was ${diffPercent}% too fast.`;
	} else if (diff <= 0){
		accuracyMessage = `Your guess was ${diffPercent}% too slow.`;
	}
	let message = accuracyMessage;
	if (absDiff === 0){ message = `Congratulations! ${accuracyMessage}`;} else
	if (absDiff <= 1){ message = `You were very close. ${accuracyMessage}`;} else
	if (absDiff <= 2){ message = `You were close. ${accuracyMessage}`; } else
	if (absDiff <= 3){ message = `You should practice some more. ${accuracyMessage}`;} else
	if (absDiff <= 4){ message = `Your timing isn't consistent enouch keep practicing. ${accuracyMessage}`;} else
	if (absDiff <= 5){ message = `Hopefully this was a fluke, try again next time. ${accuracyMessage}`;}
	document.getElementById('guessMessage').innerHTML = message;
}

let tapArr = [1000,];
let tapArrMS = [];
let beat = 0;

function tapTempo (){
if (tapArr.length === 2){
	tapArr.shift();
}
tapArr[1] = performance.now();
if (beat === 4){
	beat = 0;
}
let diffMS = (tapArr[1] - tapArr[0]);

if (diffMS < 2000){
	tapArrMS[beat - 1] = diffMS;
}




let sum = tapArrMS.reduce((a, b) => a + b, 0);
let avg = (sum / tapArrMS.length) || 0;

console.log(tapArr, tapArrMS, avg, beat)

if (avg !== 0){setValue('bpm',60000/avg)}
beat++
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
document.getElementById('playSound').addEventListener('mousedown', function () {sound()});
document.getElementById('tapTempo').addEventListener('mousedown', function () {tapTempo(); });
document.getElementById('start').addEventListener('mousedown', function () {bpmStart()});
document.getElementById('stop').addEventListener('mousedown', function () {bpmStop()});
document.getElementById('random').addEventListener('mousedown', function () {randomBPM()});
document.getElementById('guessBPM').addEventListener('mousedown', function () {guessBPM()});

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


//Gamemodes
/*
- Guess BPM
	- Different ranges, 30 - 300, 180 - 200, 60 - 120
		- The number will be random within the range
		- Larger the range the harder the difficulty
	- Different amount of counts to hear the tempo before having to guess.
		- 16, 8, 4, or just 2 counts, less is more difficult
	- BPM to the tenth decimal point
		- This literally means 10X the difficulty.
	- Overlappng Tempos (Guessing multiple Tempos at the same time)
		- Example 120 and 90 which is 75% of 120
		- Close overlapping 120 and 125
		- Start them synced or different times
- Did the BPM change?
	- Slowly ramp BPM up or down from 1 value to another.
		- Example: 120 to 140 over 32 counts.
	- Different amount of counts to hear the initialBPM
		- For higher difficulties this should be random
	- What was the lowest/highest BPM
	- Did the BPM go faster or slower
	- How many counts did it take to get to the end BPM
*/