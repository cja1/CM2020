//displays and handles clicks on a regular button, created at custom x, y
function Button(str, x, y, w, h, textCol, multiple){
  
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.textCol = textCol;
	this.multiple = multiple;
	
  this.draw = function() {
    push();
    //Rect
    stroke(255);
    noFill();
    rect(this.x, this.y, this.w, this.h, 10 * this.multiple);

    //text
    const fontSize = Math.floor(playArea.width * 0.05 * this.multiple);
    textFont(font, fontSize);
    textAlign(CENTER, CENTER);
    fill(this.textCol);
    noStroke();
    text(str, this.x, this.y, this.w, this.h);

    pop();
  };

  //checks for clicks on the button
  this.hitCheck = function() {
    return (mouseX >= this.x && mouseX <= this.x + this.w && mouseY >= this.y && mouseY <= this.y + this.h);
  };

}