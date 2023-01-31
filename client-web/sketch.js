
function preload() {
}

function setup(){
   createCanvas(windowWidth, windowHeight);
}

function draw(){
  background(0);
  fill(255);
  ellipse(width/2, height/2, 100, 100);
}

//support mouse clicks inside visualisation if supported
/*function mouseClicked(){
  controls.mousePressed();
  if (vis.selectedVisual && vis.selectedVisual.hasOwnProperty('mousePressed')){
    vis.selectedVisual.mousePressed();
  }
}*/

//use touch started rather than mouse click - seems to be more reliable on touch devices
function touchStarted() {
//  controls.mousePressed();
}

function keyPressed(){
  //controls.keyPressed(keyCode);
}

//when the window has been resized. Resize canvas to fit 
//if the visualisation needs to be resized call its onResize method
function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}
