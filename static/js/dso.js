
var NebTypes = ['Planetary Nebula', 'Galaxy', 'Emission Nebula', 'Reflexion Nebula', 'Open Cluster','Globular Cluster'];

class Nebula
{
  constructor(line)
  {
    var arr = line.split(' ');
    this.ngc = arr[0];
    this.ic = arr[1];
    this.m = arr[2];
    this.const = arr[3];
    this.ra = 15 * arr[4];
    this.dec = arr[5];
    this.mag = arr[6];
    this.d1 = arr[7];
    this.d2 = arr[8];
    this.angle = arr[9];
    this.type = arr[10];
    return this;
  }
}

var nebList = [];

function loadNebulae(callback)
{
  for (var i=0;i<6;i++)
    nebList[i] = [];
  function parseNebulae(d) 
  {
    txtList = d.split('\n');
    for (var i in txtList)
    {
      if (txtList[i])
      {
        var neb = new Nebula(txtList[i]);
        if (typeof neb != 'undefined')
        {
          if ((neb.m != 0) ||                      // all messier 
             ((neb.ngc != 0) && (neb.mag < 10)))   // only bright NGC objects 
            nebList[neb.type].push(neb);        
        }
      }
    }
    callback();
  }
  
  d3.text("/static/sky/nebulae.dat").then(parseNebulae);
}
