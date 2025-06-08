
var Diagram = function(xRange, yRange, xDomain, yDomain)
{
  // bounding rectangle
  var from = new Point(xRange[0],yRange[0]);
  var to = new Point(xRange[1],yRange[1]);
  
  this.rect = new Shape.Rectangle(from, to);
  this.rect.strokeColor = 'black';
  this.rect.strokeWidth = 0.2;

  this.xRange = xRange;
  this.xRange = xRange;
  this.xDomain = xDomain;
  this.yDomain = yDomain;
  
  this.locus = new Group;

  // Compute parameters of affine transform matrix that projects (λ, β) to (x,y)
  var a = (xRange[0] - xRange[1]) / (xDomain[0] - xDomain[1]);
  var b = 0;
  var tx = xRange[0] - a * xDomain[0];

  var c = (yRange[0] - yRange[1]) / (yDomain[0] - yDomain[1]);
  var d = 0;
  var ty = yRange[0] - c * yDomain[0];

  this.mtrx = new Matrix(a,d,b,c,tx,ty);  // don't understand why c and d have to be swapped in order for this to work!
}


Diagram.prototype.grid = function(xTicks, yTicks)
{
  var yTickSize = (this.yDomain[1] - this.yDomain[0]) / yTicks;
  for (var i=0;i<yTicks;i++)
  {
    var from = new Point(this.xDomain[0], this.yDomain[0] + i * yTickSize);
    var to   = new Point(this.xDomain[1], this.yDomain[0] + i * yTickSize);
    var hLine = new Path.Line(from, to);
    hLine = hLine.transform(this.mtrx);
    hLine.strokeColor = 'lightgray';
    hLine.strokeWidth = 0.2;
    
    var tickLabel = new PointText(new Point(from).transform(this.mtrx));
    tickLabel.translate (-15, 0);
    tickLabel.content = String(this.yDomain[0] + i * yTickSize)
    tickLabel.fillColor = 'black';
  }

  var xTickSize = (this.xDomain[1] - this.xDomain[0]) / xTicks;
  for (var i=0;i<xTicks;i++)
  {
    var from = new Point(this.xDomain[0] + i * xTickSize, this.yDomain[0] );
    var to   = new Point(this.xDomain[0] + i * xTickSize, this.yDomain[1] );
    var vLine = new Path.Line(from, to);
    vLine = vLine.transform(this.mtrx);
    vLine.strokeColor = 'lightgray';
    vLine.strokeWidth = 0.2;

    var tickLabel = new PointText(new Point(to).transform(this.mtrx));
    tickLabel.translate (-10, 15);
    tickLabel.content = String(this.xDomain[0] + i * xTickSize)
    tickLabel.fillColor = 'black';

  }
}

// Add a celestial body, defined by 2 coordinates in the input domain
Diagram.prototype.add = function (x,y)
{
  var radius = 2;
  
  var pt = new Point(x,y);
  pt = pt.transform(this.mtrx);

  var dot = new Shape.Circle(pt, radius);
  dot.fillColor = 'red';
  
  paper.view.update();
}

// Add a celestial path (array of positions)
Diagram.prototype.addLocus = function (locus, start, showLabels)
{
  this.locus.remove();
  this.locus = new Group();
  var curve = new Path();

  for (var i=0;i<locus.length;i++)
  {
    var pt = new Point(locus[i][0],locus[i][1]);
    curve.add(pt);
  }
  curve = curve.transform(this.mtrx);
  curve.strokeWidth = .5;
  curve.strokeColor = 'blue';
  this.locus.addChild(curve);

  var tickSpacing = 30;   // number of days between ticks
  for (var j=0;j<curve.segments.length;j+=tickSpacing)
  {
    var crv = curve.curves[j];
    if (crv && showLabels)
    {
      var pt = crv.point1;
      var normal = crv.getNormalAt(0).multiply(5);  // TODO fix bug in computation of normal
      var tick = new Path({ segments: [pt, pt.add(normal)], strokeColor: 'red'});
      this.locus.addChild(tick);
      var date = jdtocd(start + j);
      var textItem = new PointText(pt);
      textItem.strokeWidth = .5;
      textItem.content = date[0] + ' ' + date[1] + ' ' + date[2];
      this.locus.addChild(textItem);
    }
  }

  paper.view.update();
}



