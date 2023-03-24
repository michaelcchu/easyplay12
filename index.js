import SoundGenerator from './modules/SoundGenerator.js';
import SheetMusicDisplay from './modules/SheetMusicDisplay.js';
import SheetMusicDisplay2 from './modules/SheetMusicDisplay2.js';

let activePress = null; let press;

SheetMusicDisplay2.start();

function key(e) {
    function down(e) {
        const strPress = "" + press;
        const badKeys = ["Alt","Arrow","Audio","Enter","Home","Launch","Meta",
            "Play","Tab"];
        const splash = document.querySelector(".splash");
        if (!badKeys.some(badKey => strPress.includes(badKey))
            && !e.repeat && (document.activeElement.nodeName !== 'INPUT') 
            && (press !== activePress) 
            && splash.classList.contains("splash-toggle")) {
                SheetMusicDisplay.goToNextNote();
                const note = SheetMusicDisplay.getCurrentNote();            
                if (note) {
                    SoundGenerator.startPlaying(note, activePress);
                    activePress = press;
                }
        }
    }
    
    function up() {
        if (press === activePress) {
            SoundGenerator.stopPlaying();
            activePress = null;
        }
    }

    if (e.type.includes("key")) {press = e.key;} 
    else {press = e.pointerId;}
    if (["keydown","pointerdown"].includes(e.type)) {down(e);} else {up();}
}

function resize() {
  document.getElementsByClassName("wrapper")[0].style.height = 
    (window.innerHeight - 17)  + "px";
}

resize();
window.addEventListener('resize', resize);

// Initialize canvas
const canvas = document.getElementById("tap-area");

// Event listeners
const eventTypes = ["down","up"];
for (const et of eventTypes) {document.addEventListener("key"+et, key);}
for (const et of eventTypes) {canvas.addEventListener("pointer"+et, key,
  {passive: false});}

// Turn off default event listeners
const ets = ['focus', 'pointerover', 'pointerenter', 'pointerdown', 
  'touchstart', 'gotpointercapture', 'pointermove', 'touchmove', 'pointerup', 
  'lostpointercapture', 'pointerout', 'pointerleave', 'touchend'];
for (let et of ets) {
  canvas.addEventListener(et, function(event) {
    event.preventDefault();
    event.stopPropagation();
  }, {passive: false}); 
}
  