export default (() => {

    let notes; let i; let tk; let mei;

    const val = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1,"":0};
    const accidentalVal = {null:0,"s":1,"f":-1,"ss":2,"x":2,"ff":-2,"xs":3,
    "sx":3,"ts":3,"tf":-3,"n":0,"nf":0,"ns":0,
    "su":0.75,"sd":0.25,"fu":-0.25,"fd":-0.75,"nu":0,"nd":0}

    function getCurrentNote() {
        let playingNotes = document.querySelectorAll('g.note.playing');
        for (let playingNote of playingNotes) {
            const id = playingNote.getAttribute("id");
            const meiNote = mei.querySelector("[*|id='"+id+"']");
            let pitch = val[meiNote.getAttribute("pname")];
            const accidGes = meiNote.getAttribute("accid.ges");
            const accid = meiNote.getAttribute("accid");
            if (accid) {
                pitch += accidentalVal[accid];
            } else {
                pitch += accidentalVal[accidGes];
            }
            const note = {
                pitch: pitch,
                octave: +meiNote.getAttribute("oct")
            }
            return note;
        }
    }

    function unhighlightCurrentNote() {
        // Remove the attribute 'playing' of all notes previously playing
        let playingNotes = document.querySelectorAll('g.note.playing');
        for (let playingNote of playingNotes) {
            playingNote.classList.remove("playing");
        }
    }

    function highlightCurrentNote() {
        const id = notes[i].getAttribute("xml:id");
        const note = document.getElementById(id);
        note.classList.add("playing");
        scrollToNote(note);
    }

    function scrollToNote(note) {
        setTimeout(() => {
            seamless.scrollIntoView(note, {
                behavior: 'auto',
                block: 'center',
                inline: 'center'}
            );}, 0);
    }

    function goToNextNote() {
        unhighlightCurrentNote();
        if (i < notes.length) {
            i++;
            if (i < notes.length) {highlightCurrentNote();}
        }
    }

    function goToPreviousNote() {
        unhighlightCurrentNote();
        if (i >= 0) {
            i--;
            if (i >= 0) {highlightCurrentNote();}
        }
    }

    function main() {
        tk = new verovio.toolkit();
        console.log("Verovio has loaded!");

        const zoomFactor = document.getElementById("zoomFactor");
        zoomFactor.addEventListener("change", setZoom);    

        tk.setOptions({
            breaks: "none",
            mnumInterval: 1,
            scale: +zoomFactor.value
        });

        function setup() {
            document.getElementById("container").innerHTML = tk.renderToSVG(1); 
            i = -1;
            const meiContent = tk.getMEI();
            const parser = new DOMParser();
            mei = parser.parseFromString(meiContent, "text/xml");
            console.log(mei);
            notes = Array.from(mei.querySelectorAll("note"));

            // Remove tied notes
            const ties = mei.querySelectorAll("tie");
            for (const tie of ties) {
                const skipNoteId = tie.getAttribute("endid").slice(1);
                const skipNoteIndex = notes.findIndex((note) => {
                    return (note.getAttribute("xml:id") === skipNoteId);
                });
                notes.splice(skipNoteIndex, 1);
            }
            
            if (notes.length > 0) {
                const id = notes[0].getAttribute("xml:id");
                const note = document.getElementById(id);
                scrollToNote(note);
            }
        }
    
        fetch("./data/Beethoven__Symphony_No._9__Op._125-Clarinetto_1_in_C_(Clarinet).mxl")
        .then( response => response.arrayBuffer() )
        .then( data => {tk.loadZipDataBuffer(data); setup();} )
        .catch( e => {console.log( e );} );
    
        const input = document.getElementById("input");
        input.addEventListener("change", readFile);
    
        const go = document.getElementById("go");
        go.addEventListener("click", goToMeasure);

        let interval;
        let cleanSlate = true;
        let timeoutInProgress = false;

        function repeat(f) {
            if (cleanSlate) {
                f();
                if (!timeoutInProgress) {
                    cleanSlate = false;
                    setTimeout(() => {
                        if (!cleanSlate) {
                            interval = setInterval(f, 200);
                        }
                        timeoutInProgress = false;
                    }, 400);
                    timeoutInProgress = true;    
                }
            }
        }

        function stopMoving() {
            clearInterval(interval); cleanSlate = true;
        }

        const left = document.getElementById("move-left");
        left.addEventListener("pointerdown", () => {repeat(goToPreviousNote);});
        left.addEventListener("pointerup", stopMoving);

        const right = document.getElementById("move-right");
        right.addEventListener("pointerdown", () => {repeat(goToNextNote);});
        right.addEventListener("pointerup", stopMoving);

        document.addEventListener("keydown", moveCursor);
    
        function goToMeasure() {
            function getMeasure(note) {
                return +note.closest("measure").getAttribute("n");
            }

            unhighlightCurrentNote();

            function getCurrentMeasure() {
                if (i < 0) {
                    if (notes.length > 0) {
                        return -1;
                    } else {
                        return null;
                    }
                } else if (i >= notes.length) {
                    if (notes.length > 0) {
                        return getMeasure(notes[notes.length - 1]);
                    } else {
                        return null;
                    }
                } else {
                    return getMeasure(notes[i]);
                }
            }

            const measureInput = document.getElementById("measureInput");
            let measure = +measureInput.value;
            
            if (notes.length > 0) {
                const lastMeasure = getMeasure(notes[notes.length - 1]);
                if (measure > lastMeasure) {
                    measure = lastMeasure;
                }

                while (getCurrentMeasure() < measure) {i++;}
                while (getCurrentMeasure() > measure) {i--;}
                
                highlightCurrentNote();
    
            }

            document.activeElement.blur();
        }

        function moveCursor(e) {
            if (document.activeElement.nodeName !== 'INPUT') {
                if (e.key === "ArrowLeft") {goToPreviousNote();}
                else if (e.key === "ArrowRight") {goToNextNote();}
            }   
        }
    
        function readFile() {    
            for (const file of input.files) {
                const reader = new FileReader();
                const name = file.name.toLowerCase();
                if (name.endsWith(".musicxml") || name.endsWith(".xml") ||
                    name.endsWith(".mei")) {
                    reader.addEventListener("load", (e) => {
                        tk.loadData(e.target.result);
                        setup();
                    });
                    reader.readAsText(file);
                } else if (name.endsWith(".mxl")) {
                    reader.addEventListener("load", (e) => {
                        tk.loadZipDataBuffer(e.target.result);
                        setup();
                    });
                    reader.readAsArrayBuffer(file);
                }
            }
        }

        function setZoom() {
            tk.setOptions({scale: +zoomFactor.value});
            document.getElementById("container").innerHTML = tk.renderToSVG(1);
            setTimeout(() => {
                if (notes.length > 0) {
                    let noteIndex;
                    if (i < 0) { noteIndex = 0; }
                    else if (i >= notes.length) {noteIndex = notes.length - 1;}
                    else {noteIndex = i; highlightCurrentNote();}
                    const meiNote = notes[noteIndex];
                    const id = meiNote.getAttribute("xml:id");
                    const svgNote = document.getElementById(id);
                    scrollToNote(svgNote);
                }    
            }, 0);

            document.activeElement.blur(); 
        }

        // Turn off default event listeners
        const ets = ['focus', 'pointerover', 'pointerenter', 'pointerdown', 
            'touchstart', 'gotpointercapture', 'pointermove', 'touchmove', 
            'pointerup', 'lostpointercapture', 'pointerout', 'pointerleave', 
            'touchend'];
        for (let et of ets) {
            left.addEventListener(et, function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, false);
            right.addEventListener(et, function(event) {
                event.preventDefault();
                event.stopPropagation();
            }, false); 
        }

    }

    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.src ="./verovio-toolkit-wasm.js";
    script.onload = () => {verovio.module.onRuntimeInitialized = main;}
    body.appendChild(script);

    return {
        getCurrentNote: getCurrentNote,
        goToNextNote: goToNextNote
    };
})();
