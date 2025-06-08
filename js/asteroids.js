var astList = [];

// funky packed form - https://minorplanetcenter.net/iau/info/PackedDates.html
function asteroidDate(str)
{
  switch (str[0])
  {
    case 'I': century = '18'; break;
    case 'J': century = '19'; break;
    case 'K': century = '20'; break;
  }
  var year = + (century + str.slice(1,3));
  var digit = str[3];
  var month = (digit<10?+digit:10+digit.charCodeAt(0)-'A'.charCodeAt(0));
  var digit = str[4];
  var day = (digit<10?+digit:10+digit.charCodeAt(0)-'A'.charCodeAt(0));

  return jd0(year, month, day);
}

// parse a line into an object
function parseAst(d)
{
  if (d.length == 0)
    return null;
  return {
    type: 'asteroid',
    name: +d.slice(0,6) + ' ' + d.slice(183), 
    epoch: asteroidDate(d.slice(20,25)),
    a: +d.slice(92,103),
    e: +d.slice(70,79),
    i: +d.slice(59,68),
    Ω: +d.slice(48,57),
    ω: +d.slice(37,46),
    M: +d.slice(26,35)
  };
}


// return the asteroid object from its name
function objParams(lst, name)
{
  for (var i in lst)
  {
    if (name == lst[i].name)
      return lst[i]
  }
  return null;
}


function cometDate(str)
{
  var date = str.split(/\s+/);
  return jd0(+date[0],+date[1], +date[2]);
}

var comList = [];

function parseCom(d)
{
  if (d.length == 0)
    return null;
  return {
    type: 'comet',
    name: d.slice(102, 159).trim(),
    T: cometDate(d.slice(14,29)),    // passage at perihelion
    q: +d.slice(30,39),   // periapsis
    e: +d.slice(41,49),
    i: +d.slice(71,79),
    Ω: +d.slice(61,69),
    ω: +d.slice(51,59),
    epoch: d.slice(81,89)
  };
}



function loadObjects(callback)
{
  function parseAsteroids(d) 
  {
    astList = d.split('\n').map(parseAst);
    astList.pop();                  // remove last empty record 
    d3.text("/sky/Soft00Cmt.txt", parseComets);
  }
  function parseComets(d) 
  {
    comList = d.split('\n').map(parseCom);
    comList.pop();                  // remove last empty record 
    callback();
  }
  d3.text("/sky/Soft00Bright.txt", parseAsteroids);
}

