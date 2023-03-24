export default (() => {
    const audioContext = new AudioContext();
    const gainNode = new GainNode(audioContext, {gain: 0});
    const oscillator = new OscillatorNode(audioContext);
    oscillator.connect(gainNode).connect(audioContext.destination);

    const dbfs = document.getElementById("dbfs");
    dbfs.addEventListener("change", setGain);

    const tuningBlock = document.getElementById("tuningBlock");
    tuningBlock.addEventListener("change", setTuning);

    let on = false;
    let normalGain;
    let tuning;

    const val = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1,"":0};

    function initialize() {
        if (!on) {oscillator.start(); on = true;}
        setGain();
        setTuning();
    }

    const start = document.getElementById("start");
    start.addEventListener("click", initialize);

    function setGain() {
        normalGain = 10**(dbfs.value/20);
    }

    function setTuning() {
        tuning = {
            pitch: val[tuningPitch.value] + val[tuningAccidental.value],
            octave: +tuningOctave.value,
            frequency: +tuningFrequency.value
        }
    }

    function startPlaying(note, activePress) {
        if (on) {
            function toFreq(note) {
                return tuning.frequency * 2**((note.pitch - tuning.pitch)/12 
                    + note.octave - tuning.octave);
            }

            const freq = toFreq(note);

            let gain = 0;
            if (freq > 0) {
                gain = normalGain * (49 / freq);
            }
    
            if (activePress === null) {
                oscillator.frequency.value = freq;
            } else {
                oscillator.frequency.setTargetAtTime(freq, 
                    audioContext.currentTime, 0.003);   
            }
    
            gainNode.gain.setTargetAtTime(gain, 
                audioContext.currentTime, 0.015);
        }
    }

    function stopPlaying() {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
    }

    return {
        startPlaying: startPlaying, 
        stopPlaying: stopPlaying
    };
})();