//displays and handles clicks on a round close button, created at custom x, y
function CloseButton(xIn, yIn, colorIn){
  
  const x = xIn;
  const y = yIn;
  const size = playArea.width * 0.04;
  const margin = 5;

  this.draw = function() {
    push();
    stroke(colorIn);
    noFill();
    strokeWeight(1);

    //Centre on this x, y
    translate(x , y);

    //circle    
    ellipse(0, 0, size);

    //crosses
    line(-size / 1.4 / 2, -size / 1.4 / 2, size / 1.4 / 2, size / 1.4 / 2);
    line(size / 1.4 / 2, -size / 1.4 / 2, -size / 1.4 / 2, size / 1.4 / 2);
    pop();
  };

  //checks for clicks on the button
  this.hitCheck = function() {
    return (mouseX >= x - margin && mouseX <= x + size + margin && mouseY >= y - margin && mouseY <= y + size + margin);
  };

}