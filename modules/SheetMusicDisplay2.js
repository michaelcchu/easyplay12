export default (() => {
    let centroids = [];

    function main() {
        const img_rgb = cv.imread('image');
        const img_gray = new cv.Mat();
        cv.cvtColor(img_rgb, img_gray, cv.COLOR_BGR2GRAY);
        cv.imshow("img_gray", img_gray);

        const number_of_templates = 9;

        // data about the templates:
        // notehead centroids:
        // compute these by hand
        // in the form of [x,y]
        const notehead_centroids = [[8,7],[8,5],[8,27],[8,30],[9,8],[7,20],
            [9,7],[9,5],[11,37]];

        const notes = cv.Mat.zeros(img_gray.rows, img_gray.cols, 
            cv.CV_8UC4);

        const clefs = cv.Mat.zeros(img_gray.rows, img_gray.cols, 
            cv.CV_8UC4);

        // loop through every template
        for (let num = 1; num <= number_of_templates; num++) {
            const template = "template" + num;
            const temp_rgb = cv.imread(template);
            const temp_gray = new cv.Mat();
            cv.cvtColor(temp_rgb, temp_gray, cv.COLOR_BGR2GRAY);
            cv.imshow(template+"_canvas", temp_gray);

            const search = new cv.Mat();
            const mask = new cv.Mat();
            cv.matchTemplate(img_gray, temp_gray, search, 
                cv.TM_CCOEFF_NORMED, mask);

            const matches = new cv.Mat();
            cv.threshold(search, matches, 0.8, 1, cv.THRESH_BINARY);
            
            const color = new cv.Scalar(255, 0, 0, 255);

            const notehead_centroid = notehead_centroids[num - 1];

            let index = 0;
            for (let i = 0; i < search.rows; i++) {
                for (let j = 0; j < search.cols; j++) {
                    const value = search.data32F[index];
                    if (value >= 0.8) {
                        const cx = j + notehead_centroid[0];
                        const cy = i + notehead_centroid[1];
                        let image_to_modify = notes;
                        if (num === 9) {
                            image_to_modify = clefs;
                        }
                        image_to_modify.ucharPtr(cy,cx)[0] = 255;
                        image_to_modify.ucharPtr(cy,cx)[3] = 255;
                    }
                    index++;
                }
            }
        }

        cv.imshow('notes', notes);
        cv.imshow('left_edges', clefs);


        // Find the contours of the notes.
        // Use this to count the number of notes.

        // Also find the countours of left_edges.
        // Use this to count the number of left_edges.

        function process_contours(src, output_canvas) {
            let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC4);
            let dst_centroids = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC4);
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
            
            cv.threshold(src, src, 1, 255, cv.THRESH_BINARY);
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP,
                cv.CHAIN_APPROX_SIMPLE);

            console.log(contours);
            console.log(contours.size());

            // draw contours
            const color = new cv.Scalar(0, 0, 255, 255);
            const centroids = [];
            for (let i = 0; i < contours.size(); ++i) {
                const contour = contours.get(i);
                const rect = cv.boundingRect(contour);
                const cx = Math.round(rect.x + rect.width / 2);
                const cy = Math.round(rect.y + rect.height / 2);
                centroids.unshift([cx, cy]);
                dst_centroids.ucharPtr(cy,cx)[0] = 255;
                dst_centroids.ucharPtr(cy,cx)[3] = 255;
            }
            cv.imshow(output_canvas, dst_centroids);

            src.delete(); dst.delete(); contours.delete(); hierarchy.delete();

            return centroids;
        }

        centroids = process_contours(notes, 'note_center_points');
        const stave_centroids = process_contours(clefs, 
            'left_edge_center_points');

        const stave_count = stave_centroids.length;
        const notes_by_stave = [...Array(stave_count)].map(e => []);

        for (const note of centroids) {
            const note_y_coord = note[1];

            const distances = Array(stave_count);
            for (let i=0; i < stave_count; i++) {
                const stave_y_coord = stave_centroids[i][1];
                distances[i] = Math.abs(note_y_coord - stave_y_coord);
            }
            const minimum_distance = Math.min(...distances);
            const index_of_minimum = distances.indexOf(minimum_distance);

            notes_by_stave[index_of_minimum].push(note);
        }

        // loop through notes_by_stave
        // sort each stave by x-position
        for (let i=0; i < stave_count; i++) {
            const stave = notes_by_stave[i];
            stave.sort((a,b) => {return (a[0] - b[0]);});
        }

        centroids = notes_by_stave.flat();

        console.log(notes_by_stave);
        console.log(centroids);
    }

       // cursor
       function createCursor() {
        const canvas = document.getElementById('cursor_layer');
        canvas.width = document.getElementById('image').width;
        canvas.height = document.getElementById('image').height;
        const context = canvas.getContext('2d');
        context.globalAlpha = 0.5;
        
        function component(x, y, width, height, color) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.clear = function() {
                context.clearRect(this.x, this.y, this.width, this.height);
            };
            this.update = function() {
                context.fillStyle = this.color;
                context.fillRect(this.x, this.y, this.width, this.height);
            };
        }
        
        const cursor = new component(0, 0, 10, 50, "red");
        cursor.update();
        return cursor;
    }

    const cursor = createCursor();

    let index = -1;
    /*
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {index--;} else {index++;}
        cursor.clear();
        cursor.x = centroids[index][0] - Math.floor(cursor.width / 2);
        cursor.y = centroids[index][1] - Math.floor(cursor.height / 2);
        cursor.update();
    });*/

    function goToNextNote() {
        index++;
        cursor.clear();
        cursor.x = centroids[index][0] - Math.floor(cursor.width / 2);
        cursor.y = centroids[index][1] - Math.floor(cursor.height / 2);
        cursor.update();
    }

    function getCurrentNote() {
        const note = {
            pitch: 10,
            octave: 4
        }
        return note;
    }

    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.src ="./opencv.js";
    script.onload = () => {cv['onRuntimeInitialized'] = main;}
    body.appendChild(script);

    return {
        goToNextNote: goToNextNote,
        getCurrentNote: getCurrentNote
    };
})();
