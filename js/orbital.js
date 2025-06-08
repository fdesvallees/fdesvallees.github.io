 
// define an orbit with its parameters
class Orbit {
  constructor(a, e, i, Ω, ω)
  {               
    this.a = a;   // semimajor axis
    this.e = e;   // eccentricity
    this.i = i;   // inclination
    this.Ω = Ω;   // longitude of ascending node
    this.ω = ω;   // argument of perihelion 
  }
  
 
  trueAnomaly(M)
  {
    // Eccentric anomaly
    var E0=M+(180.0/Math.PI)*this.e*sind(M)*(1+this.e*cosd(M));
    var E=E0-(E0-(180.0/Math.PI)*this.e*sind(E0)-M)/(1-this.e*cosd(E0));
    while (Math.abs(E0-E) > 0.0005)
    {
      E0=E;
      E=E0-(E0-(180.0/Math.PI)*this.e*sind(E0)-M)/(1-this.e*cosd(E0));  // 30.7 - p.199
    }
    var x=this.a*(cosd(E)-this.e);
    var y=this.a*Math.sqrt(1-this.e*this.e)*sind(E);
    var r=Math.sqrt(x*x+y*y);
    return ([r,rev(atan2d(y,x))]);           // r and true anomaly - 30.1 - p. 195)
  }

  positionFromAnomaly(r_nu)
  {
    var r = r_nu[0];
    var nu = r_nu[1];
    var u=nu+this.ω;
    
    // Heliocentric Ecliptic Rectangular Coordinates - p 233  
    var xeclip=r*(cosd(this.Ω)*cosd(u)-sind(this.Ω)*sind(u)*cosd(this.i));
    var yeclip=r*(sind(this.Ω)*cosd(u)+cosd(this.Ω)*sind(u)*cosd(this.i));
    var zeclip=r*sind(u)*sind(this.i);
    
    return ([xeclip, yeclip, zeclip]);
  }
  positionFromDate(jd)
  {
    var n = 0.9856076686 / (this.a * Math.sqrt(this.a));  // degrees per day
    var r_nu=this.trueAnomaly((jd - this.T) * n);   // time since perihelion * degrees/day
    return(this.positionFromAnomaly(r_nu));  
  }
 
}

class AsteroidOrbit extends Orbit
{
  constructor (a,e,i,Ω,ω,M,epoch)   // we know M (mean anomaly) - handle like a planet
  {
    super(a,e,i,Ω,ω);
    this.M = M;       // mean anomaly at epoch
    this.epoch = epoch; 
  }
  positionFromDate(jd)
  {
    var n = 0.9856076686 / (this.a * Math.sqrt(this.a));  // degrees per day
    var r_nu=this.trueAnomaly(this.M + (jd - this.epoch) * n);   
    return(this.positionFromAnomaly(r_nu));  
  }
  // Generate n points of an asteroid orbit 
  generateClosed(n)
  {
    var path3D = [];
    var k = 0.01720209895;      // Gauss gravitational constant
    var P = 2 * Math.PI * this.a * Math.sqrt(this.a) / k;   // period

    for (var i=-n/2;i<n/2;i++)
    {
      var jd = this.epoch + i * (P/n);
      var pos = this.positionFromDate(jd);
      path3D.push (pos);
    }
    return path3D;
  }
}

class PeriodicCometOrbit extends AsteroidOrbit
{
  constructor (q,e,i,Ω,ω,T)
  {
    // semi-major axis from perihelion and eccentricity
    var a = q / (1-e);
    super(a,e,i,Ω,ω,0,0);
    this.T = T;       // time of perihelion    
  }
  positionFromDate(jd)
  {
    var n = 0.9856076686 / (this.a * Math.sqrt(this.a));  // degrees per day
    var r_nu=this.trueAnomaly((jd - this.T) * n);   // time since perihelion * degrees/day
    return(this.positionFromAnomaly(r_nu));  
  }
}

class ParabolicCometOrbit 
{
  // Chapter 35
  constructor (q,e,i,Ω,ω,T)
  {
    this.q = q;
    this.e = e;
    this.i = i;
    this.Ω = Ω;
    this.ω = ω;
    this.T = T;
    this.Q = 0.01720209895 * (Math.sqrt(1 + e)/q);
    this.γ = (1 - e) / (1 + e);
  }
  positionFromAnomaly(r_nu)
  {
    var r = r_nu[0];
    var nu = r_nu[1];
    var u=nu+this.ω;
    
    // Heliocentric Ecliptic Rectangular Coordinates - p 233  
    var xeclip=r*(cosd(this.Ω)*cosd(u)-sind(this.Ω)*sind(u)*cosd(this.i));
    var yeclip=r*(sind(this.Ω)*cosd(u)+cosd(this.Ω)*sind(u)*cosd(this.i));
    var zeclip=r*sind(u)*sind(this.i);
    
    return ([xeclip, yeclip, zeclip]);
  }

  
  generate(days, num)
  {
    var path3D = [];

    // generate a range of values with more detail close to the Sun
    var orbitDayScale = d3.scaleLinear().domain([-Math.sqrt(days),-1]).ticks(num).map(function(d) {return (-d * d)})
                    .concat(d3.scaleLinear().domain([0,Math.sqrt(days)]).ticks(num).map(function(d) {return (d * d)}));

    for (var i in orbitDayScale)
    {
      var pos = this.positionFromDate(this.T + orbitDayScale[i]);
      path3D.push (pos);
    }
    return path3D;
  }
  positionFromDate(jd) // http://stjarnhimlen.se/comp/tutorial.html
  {
    var k = 0.01720209895;      // Gauss gravitational constant
    var a = 1.5 * (jd - this.T) * k / Math.sqrt(2 * Math.pow(this.q,3));
    var b = Math.sqrt( 1 + a*a );
    var w = Math.cbrt(b + a) - Math.cbrt(b - a);

    var nu = 2 * atan2d(w,1);   //  True anomaly and distance to Sun
    var r = this.q * ( 1 + w*w );      
    return (this.positionFromAnomaly([r,nu]));
  }
}

// Generate an orbit for a given planet and date
class PlanetOrbit extends Orbit
{
  constructor (ndx, jd)
  {
    var L=polynomial(planets[ndx].L_, jd); // Mean longitude
    var a=polynomial(planets[ndx].a_, jd); // semimajor axis
    var e=polynomial(planets[ndx].e_, jd); // eccentricity
    var i=polynomial(planets[ndx].i_, jd); // inclination
    var Ω=polynomial(planets[ndx].Ω_, jd); // longitude of ascending node
    var ϖ=polynomial(planets[ndx].ϖ_, jd); // longitude of perihelion
    var ω=ϖ-Ω;                             // argument of perihelion
    super(a,e,i,Ω,ω);
    this.ndx = ndx;
    this.jd = jd;
  }

  longitude (jd)
  {
    return (polynomial(planets[this.ndx].L_, jd));
  }
  // compute heliocentric xyz coordinates from longitude
  positionFromLongitude(L)
  {
    var r_nu=this.trueAnomaly(L-(this.ω+this.Ω));
    return this.positionFromAnomaly(r_nu);
  }

   // Generate n points of a planet orbit 
  generateClosed(n)
  {
    var path3D = [];

    for (var θ=-180; θ<180; θ+=360/n)
    {
      var pos = this.positionFromLongitude(θ);
      path3D.push (pos);
    }
    return path3D;
  }

}



// point for variable-width lines
var vPoint = function(x,y,w)
{
  this.x = x;
  this.y = y;
  this.w = w;
  return this;
}


// variable-width path
var vPath = function (points, center, scale)
{
  var skeleton = new Path();
//  skeleton.strokeColor = 'lightgray';

  // build skeleton of the variable-width shape
  for (var i=0;i<points.length;i++)
  {
    var pt = new Point(points[i].x, points[i].y);
    skeleton.add(pt);
  }
  skeleton.closed = true;
  skeleton.smooth();
  skeleton.scale(scale, new Point(0,0));
  skeleton.translate(center);

   // for each segment, find the normal and the left/right sides of the shape
  var left = new Path();
  var right = new Path();
  for (var i=0;i<skeleton.curves.length;i++)
  {
    var w = points[i].w;     // width
    var normal = skeleton.curves[i].getNormalAt(0);
    var brush = normal.multiply(w/2);
    var l = skeleton.curves[i].point1.subtract(brush);
    var r = skeleton.curves[i].point1.add(brush);
    left.add(l);
    right.add(r);
  }
  left.closed = true;
  right.closed = true;

  // build shape from left and right side of curve
  var shape = new CompoundPath();
  shape.addChild(left);
  shape.addChild(right);
  shape.smooth();
  shape.fillColor = 'lightblue';

  return shape;
}


