// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001-2009
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.
// Modified by François Desvallées

// Functions for the planets

// The planet object

var Planet = function(name,s,m,L,a,e,i,Ω,ϖ)
{
  this.name=name;
  this.symbol=s;
  this.mag=m;
  // following properties are arrays used to compute the current parameter as a function of time
  this.L_=L; // mean longitude
  this.a_=a; // semi-major axis
  this.e_=e; // eccentricity
  this.i_=i; // inclination of orbit
  this.Ω_=Ω; // longitude of ascending node
  this.ϖ_=ϖ; // longitude of perihelion
}


// Meeus table 30.A Orbital Elements for the mean equinox of the date
// use approximate fixed magnitudes until I code it using Meeus equation

var planets=[
new Planet("Mercury","☿", 1.16,
   new Array(252.250906, 149474.0722491,    0.00030397,    0.000000018),
   new Array(  0.387098310,   0.0,          0.0,           0.0),
   new Array(  0.20563175,    0.000020406, -0.0000000284, -0.00000000017),
   new Array(  7.004986,      0.0018215,   -0.00001809,    0.000000053),
   new Array( 48.330893,      1.1861890,    0.00017587,    0.000000211),
   new Array( 77.456119,      1.5564775,    0.00029589,    0.000000056)),

new Planet("Venus","♀", -4,
   new Array(181.979801,  58519.2130302,    0.00031060,    0.000000015),
   new Array(  0.723329820,   0.0,          0.0,           0.0),
   new Array(  0.00677188,   -0.000047766,  0.0000000975,  0.00000000044),
   new Array(  3.394662,      0.0010037,   -0.00000088,   -0.000000007),
   new Array( 76.679920,      0.9011190,    0.00040665,   -0.000000080),
   new Array(131.563707,      1.4022188,   -0.00107337,   -0.000005315)),

new Planet("Earth","♁", 0,
   new Array(100.466449,  36000.7698231,    0.00030368,    0.000000021),
   new Array(  1.000001018,   0.0,          0.0,           0.0),
   new Array(  0.01670862,   -0.000042037, -0.0000001236,  0.00000000004),
   new Array(  0.0,           0.0,          0.0,           0.0),
   new Array(  0.0,           0.0,          0.0,           0.0),
   new Array(102.937348,      1.7195269,    0.00045962,    0.000000499)),

new Planet("Mars","♂", -1.30,
   new Array(355.433275,  19141.6964746,    0.00031097,    0.000000015),
   new Array(  1.523679342,   0.0,          0.0,           0.0),
   new Array(  0.09340062,    0.000090483, -0.0000000806, -0.00000000035),
   new Array(  1.849726,     -0.0006010,    0.00001276,   -0.000000006),
   new Array( 49.558093,      0.7720923,    0.00001605,    0.000002325),
   new Array(336.060234,      1.8410331,    0.00013515,    0.000000318)),

new Planet("Jupiter","♃", -8.93,
   new Array( 34.351484,   3036.3027889,    0.00022374,    0.000000025),
   new Array(  5.202603191,   0.0000001913, 0.0,           0.0),
   new Array(  0.04849485,    0.000163244, -0.0000004719, -0.00000000197),
   new Array(  1.303270,     -0.0054966,    0.00000465,   -0.000000004),
   new Array(100.464441,      1.0209550,    0.00040117,    0.000000569),
   new Array( 14.331309,      1.6126668,    0.00103127,   -0.000004569)),

new Planet("Saturn","♄", -8.68,
   new Array( 50.077471,   1223.5110141,    0.00051952,   -0.000000003),
   new Array(  9.554909596,  -0.0000021389, 0.0,           0.0),
   new Array(  0.05550862,   -0.000346818, -0.0000006456,  0.00000000338),
   new Array(  2.488878,     -0.0037363,   -0.00001516,    0.000000089),
   new Array(113.665524,      0.8770979,   -0.00012067,   -0.000002380),
   new Array( 93.056787,      1.9637694,    0.00083757,    0.000004899)),

new Planet("Uranus","⛢", -6.85,
   new Array(313.055005,    429.8640561,    0.00030390,    0.000000026),
   new Array( 19.218446062,  -0.0000000372, 0.00000000098, 0.0),
   new Array(  0.04638122,   -0.000027293,  0.000000079,  0.00000000024),
   new Array(  0.773197,      0.0007744,    0.00003749,   -0.000000092),
   new Array( 74.005957,      0.5211278,    0.00133947,    0.000018484),
   new Array(173.005291,      1.4863790,    0.00021406,    0.000000434)),

new Planet("Neptune","♆", -7.05,
   new Array(304.348665,    219.8833092,    0.00030926,    0.000000018),
   new Array( 30.110386869,  -0.0000001663, 0.00000000069, 0.0),
   new Array(  0.00898809,    0.000006408, -0.0000000008, -0.00000000005),
   new Array(  1.769952,     -0.0093082,   -0.00000708,    0.000000028),
   new Array(131.784057,      1.1022057,    0.00026006,   -0.000000636),
   new Array( 48.123691,      1.4262677,    0.00037918,   -0.000000003))
];

// compute osculating parameter for given period by expanding polynomial
function polynomial(param, julianDay)
{
  if (julianDay === undefined)
  {
    var today = new Date()
    julianDay = jd0(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }
  var T=(julianDay-2451545.0)/36525;
  var T2=T*T;
  var T3=T2*T;

  return param[0] + param[1]*T + param[2]*T2 + param[3]*T3;
}

// radecr returns ra, dec and earth distance
// obj and base are Heliocentric Ecliptic Rectangular Coordinates
// for the object and earth and obs is the observer

function radecr(obj,base,julianDay)
{
  // Equatorial co-ordinates
  var x=obj[0];
  var y=obj[1];
  var z=obj[2];
  
  // Obliquity of Ecliptic
  var ε=23.4393-3.563E-7*(julianDay-2451543.5);
  
  // Convert to Geocentric co-ordinates
  var x1=x-base[0];
  var y1=(y-base[1])*cosd(ε)-(z-base[2])*sind(ε);
  var z1=(y-base[1])*sind(ε)+(z-base[2])*cosd(ε);
  
  // RA and dec
  var α=rev(atan2d(y1,x1));
  var δ=atan2d(z1,Math.sqrt(x1*x1+y1*y1));
  // Earth distance
  var r=Math.sqrt(x1*x1+y1*y1+z1*z1);
  return new Array(α,δ,r);
}

// convert from equatorial to ecliptic
function eq_ecl(α,δ,julianDay)
{
  // Obliquity of Ecliptic
  var ε=23.4393-3.563E-7*(julianDay-2451543.5);

  var λ =  atan2d((sind(α) * cosd(ε) + tand(δ) * sind(ε)) , cosd(α)); 
  if (λ < 0)
    λ += 360;   // why?
  var β =  asind(sind(δ) * cosd(ε) - cosd(δ) * sind(ε) * sind(α));

  return new Array(λ, β);
}


// Magnitude as function of earth distance - Meeus p. 285 (does not use phase yet)
function planetMagnitude(xyz_planet, xyz_earth, baseMag)
{
  function distance (xyz1, xyz2)
  {
    var x = xyz2[0]-xyz1[0]; 
    var y = xyz2[1]-xyz1[1];
    var z = xyz2[2]-xyz1[2];
    return Math.sqrt (x*x + y*y + z*z);   
  }

  var Δ = distance(xyz_planet, xyz_earth);
  var r = distance(xyz_planet, [0,0,0]);
  return (baseMag + 5 * Math.log10 (r * Δ));
}



