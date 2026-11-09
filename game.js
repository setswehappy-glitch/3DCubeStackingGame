const canvas = document.getElementById(`canvas`);
const gl = canvas.getContext(`webgl`);

if(!gl){
alert(`WebGL not supported!!!`);
}

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
    attribute vec3 position;
    attribute vec3 color;
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;
    varying vec3 fragColor;
    void main(){
    gl_Position = projection * view * model * vec4(position, 1.0);
    fragColor = color;
    }`);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, `
    precision mediump float;
    varying vec3 fragColor;
    void main(){
    gl_FragColor = vec4(fragColor, 1.0);
    }`);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const vertices = new Float32Array([
    -0.5, -0.5, -0.5,     1.0, 0.0, 0.0,
     0.5, -0.5, -0.5,     0.0, 1.0, 0.0,
     0.5,  0.5, -0.5,     0.0, 0.0, 1.0,
    -0.5,  0.5, -0.5,     1.0, 1.0, 0.0,

    -0.5, -0.5,  0.5,     1.0, 0.0, 1.0,
     0.5, -0.5,  0.5,     0.0, 1.0, 1.0,
     0.5,  0.5,  0.5,     1.0, 1.0, 1.0,
    -0.5,  0.5,  0.5,     0.0, 0.0, 0.0
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionAttribute = gl.getAttribLocation(program, `position`);
gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 6*4, 0);
gl.enableVertexAttribArray(positionAttribute);

const colorAttribute = gl.getAttribLocation(program, `color`);
gl.vertexAttribPointer(colorAttribute, 3, gl.FLOAT, false, 6*4, 3*4);
gl.enableVertexAttribArray(colorAttribute);

//connect trianges into a cube
const indices = new Uint16Array([
0,1,2, 0,2,3,
4,5,6, 4,6,7,
0,1,5, 0,5,4,
2,3,7, 2,7,6,
0,3,7, 0,7,4,
1,2,6, 1,6,5
]);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

const model = new Float32Array([ //controls where the cube is and how large it is
    1.0 ,0.0 ,0.0 ,0.0,
    0.0 ,1.0 ,0.0 ,0.0,
    0.0 ,0.0 ,1.0 ,0.0,
    0.0 ,0.0 ,-5.0 ,1.0
]);

const view = new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
]);

const fieldOfView = Math.PI / 4;
const aspect = canvas.width/ canvas.height;
const near = 0.1;
const far = 100.0;

const field = 1/ Math.tan(fieldOfView/2);

const projection = new Float32Array([
    field/aspect, 0.0, 0.0, 0.0,
    0.0, field, 0.0, 0.0, 
    0, 0, (far + near)/(near - far), -1.0, 
    0.0, 0.0, (2* far * near)/(near - far), 0.0
]);

const modelLocation = gl.getUniformLocation(program, `model`);
gl.uniformMatrix4fv(modelLocation, false, model);

const viewLocation = gl.getUniformLocation(program, `view`);
gl.uniformMatrix4fv(viewLocation, false, view);

const projectionLocation = gl.getUniformLocation(program, `projection`);
gl.uniformMatrix4fv(projectionLocation, false, projection);

let startPointX = 0.0;
let direction = 1.0;
let isDropping = false;
let stack = []; //stores placed cubes
let heightOfTheStack = 0.0; //height of the stack
let currentWidth = 1.0;
let isRunning = false;

document.getElementById(`Start`).onclick = () => {
    isRunning = true;
}
document.getElementById(`Stop`).onclick = () => {
    isRunning = false;
}
window.addEventListener(`keydown`, (e) => {//listens for the keyboard key being pressed
    if (e.code == `Space` && isRunning) {// check if the spacebar is pressed and if the game is running
        if (stack.length == 0) { //check if the stack is empty
            
            stack.push({ x: startPointX, y: heightOfTheStack, width: currentWidth }); //add the cube into the stack array
        } else {
            let previousCube = stack[stack.length - 1]; //get the last cube placed on the stack
            let difference = startPointX - previousCube.x; //calculate the distance between the last and current cube
            let overlap = currentWidth - Math.abs(difference); //calculates how much they overlap

            if (overlap <= 0) { //chceks if the cubes missed each other
                alert(`Game Over!!! Your score: ${stack.length}`);
                location.reload(); //restarts the game
                return;
            }
            // Cut the width and calculate the new center
            currentWidth = overlap; //shrinks size to new one
            startPointX = previousCube.x + (difference / 2);// moves cube to center of overlap
            stack.push({ x: startPointX, y: heightOfTheStack, width: currentWidth });// adds resized cube on the stack
        }
        heightOfTheStack += 1.0; //move the next cube higher up
        startPointX = -2.0; // Move startPoint back to the side so the next block swoops in
    }
});

gl.enable(gl.DEPTH_TEST);
function gameLoop() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //Update the view to follow the height
    const view = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, -heightOfTheStack * 0.8, -8.0, 1.0 
    ]);
    gl.uniformMatrix4fv(viewLocation, false, view);
//only move when start button is pressed
    if (isRunning){
        startPointX += 0.02 * direction;
        if (Math.abs(startPointX) > 2.0) direction *= -1.0;// Moving the current block
    }

    drawCube(0.0, -1.0, 5.0);

    for (let cube of stack) {
        drawCube(cube.x, cube.y, cube.width);// Drawing the stack
    }
    
    drawCube(startPointX, heightOfTheStack, currentWidth);// Drawing the moving block
    requestAnimationFrame(gameLoop);
}
gameLoop();

function drawCube(x, y, width = 1.0) {
    const model = new Float32Array([
        width, 0.0, 0.0, 0.0, // Scale the X axis by the current width
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, width, 0.0,
        x,   y,  -5.0, 1.0  // Place it at the correct x and y
    ]);
    gl.uniformMatrix4fv(modelLocation, false, model);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}