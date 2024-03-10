var r = new Rune({
  container: "#canvas",
  width: window.innerWidth,
  height: window.innerHeight
});

var rad,x,y, h, sun, ground, sky; 

x = r.width/2;
h = r.height* 0.75;

xRange = [0, r.width];
yRange = [0, h];
xDomain = [-40, 420]
yDomain = [20, 0]


// project altitude to y coordinate
function yScale(alt)
{
  y = yRange[0] + alt * ((yRange[1]-yRange[0]) / (yDomain[1]-yDomain[0])); 
  return y;
}



function drawSun()
{
  sun = r.group(0,0);
  rad = Number(document.getElementById("focalLength").value);
  y = yScale(Number(document.getElementById("altitude").value));
  for (i=100;i>0;i-=1)
  {
    r.circle(x, y, rad+i, sun).fill(255-i,255-i,i).stroke(false);
  }
  r.circle(x, y, rad, sun).fill(255,255,100).stroke(false);
}

function drawSky()
{
  sky = r.group(0,0);
  y = (r.height - Number(document.getElementById("altitude").value)) / 50;
  for (i=0;i<h-1;i+=1)
  {
    r.rect(0, i, r.width, i+1, sky).fill(0,.5*i/y,.8*i/y).stroke(false);
  }
}

function drawGround()
{
    ground = r.rect(0, h, r.width, r.height).fill("black");
}

function redraw()
{
  sun.removeParent();
  sky.removeParent();
  ground.removeParent();
  
  drawSky();
  drawSun();
  drawGround();
}

drawSky();
drawSun();
drawGround();
r.play();
