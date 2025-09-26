
// create a list of platesolve events
function findPlateSolve(data, evList)
{
  var ready = true;
  var start = new Date;

  for (var i=0;i<data.length;i++)
  {
    if (ready)
    {
      if ((data[i].Member == "Solve") && (data[i].Line == "41"))  // start platesolve
      {
        start = data[i].Time;
        ready = false;
      }
    }
    else
    {
      if (data[i].Member == "Solve") 
      {
        if (data[i].Line == "54")
        {
          evList.push({Type: 'Plate Solve', Start: start, Duration: (data[i].Time - start), Status: 1}); // success
        }
        else
        {
          evList.push({Type: 'Plate Solve', Start: start, Duration: (data[i].Time - start), Status: 0}); // fail
        }  
        ready = true;
      }
    }
  }
}


// create a list of autofocus events
function findAutoFocus(data, evList)
{
  var ready = true;
  var start = new Date;

  for (var i=0;i<data.length;i++)
  {
    if (ready)
    {
      if ((data[i].Line == "208") && (data[i].Message.search("RunAutofocus") != -1))  // start
      {
        start = data[i].Time;
        ready = false;
      }
    }
    else
    {
      if ((data[i].Line == "254" || data[i].Line == "132") && (data[i].Message.search("Autofocus") != -1))  // end 
      {
        evList.push({Type: 'Autofocus', Start: start, Duration: (data[i].Time - start)}); 
        ready = true;
      }
    }
  }
}


function findStandardEvent(data, evList, msg)
{
  var ready = true;
  var start = new Date;

  for (var i=0;i<data.length;i++)
  {
    if (ready)
    {
      if ((data[i].Line == "208") && (data[i].Message.search(msg) != -1))  // start
      {
        start = data[i].Time;
        ready = false;
      }
    }
    else
    {
      if ((data[i].Line == "254") && (data[i].Message.search(msg) != -1))  // end 
      {
        evList.push({Type: msg, Start: start, Duration: (data[i].Time - start)}); 
        ready = true;
      }
    }
  }
}

function slope(scale)
{
  var r = scale.range(), d=scale.domain();
  return ((r[1]-r[0])/(d[1]-d[0]));
}


// create list of exposure events
function findExposure(data, evList)
{
  findStandardEvent(data, evList, 'TakeExposure')
}

// create list of meridian flip events
function findMeridianFlip(data, evList)
{
  var ready = true;
  var start = new Date;

  for (var i=0;i<data.length;i++)
  {
    if (ready)
    {
      if ((data[i].Line == "158") && (data[i].Message.search("Meridian Flip") != -1))  // start
      {
        start = data[i].Time;
        ready = false;
      }
    }
    else
    {
      if ((data[i].Line == "219") && (data[i].Message.search("Meridian Flip") != -1))  // end 
      {
        evList.push({Type: 'Meridian Flip', Start: start, Duration: (data[i].Time - start)}); 
        ready = true;
      }
    }
  }
}



function parseLine(line) 
{
  var cols = d3.dsvFormat("|").parse(line).columns;
  if (cols.length != 6)
    return null;
  cols[0] = d3.isoParse(cols[0]); // parse timestamp into D3 time variable
  return {
    Time: d3.isoParse(cols[0]),
    Level: cols[1],
    Source: cols[2],
    Member: cols[3],
    Line: cols[4],
    Message: cols[5],
  };
}

function isValid(object)
{
  return (object != null);
}


function ninaLog(text) 
{
  const header = text.slice(0,13)

  // parse all lines after header, remove those with invalid time stamp
  const data1 = text.slice(14).map(parseLine);
  const data = data1.filter(isValid);
  const timeStamps = data.map(function(l){return l.Time});

  var evList = []
  findPlateSolve(data, evList);
  findAutoFocus(data, evList);
  findMeridianFlip(data, evList);

  ['CoolCamera',  'WaitForAltitude',  'WaitForTime', 'TakeExposure',  'Dither',  'StartGuiding'].map(function(d) {findStandardEvent(data, evList, d)});

  var svg = d3.select("svg"),
            margin = 200,
            width = svg.attr("width") - margin,
            height = svg.attr("height") - margin

  d3.select("g").remove();

  var g = svg.append("g")
            .attr("transform", "translate(" + 100 + "," + 100 + ")");


   // X axis
  var xScale = d3.scaleTime().range([0, width])
  //                          .tickFormat("%I")
                            .domain([data.at(0).Time, data.at(-1).Time]);   // for display, use time variables

  var xlScale = d3.scaleLinear().range([0, width])
                            .domain([0, data.at(-1).Time - data.at(0).Time]); // for computing, use milliseconds and a linear scale

  // Y axis
  var yScale = d3.scaleBand().range([ 0, height ])
                        .domain(['CoolCamera', 'WaitForTime','WaitForAltitude', 'Plate Solve', 'Autofocus', 'Meridian Flip', 'StartGuiding', 'Dither', 'TakeExposure'])
                        .padding(.1);

  var xAxis = g.append("g")
   .attr("transform", "translate(0," + height + ")")
   .style("font-size","14px")
   .call(d3.axisBottom(xScale));

  var newX = xScale;
  var newXl = xlScale;

  // place cursor in the middle
  var xCursor = (newXl.domain()[1]-newXl.domain()[0])/2;

// Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width )
      .attr("height", height )
      .attr("x", 0)
      .attr("y", 0);

  g.append("g")
    .style("font-size","14px")
    .call(d3.axisLeft(yScale))
  var y = height;
  var diamond = g.append("path").attr("d", d3.symbol(d3.symbolDiamond))
                      .attr("transform", "translate(0," + y + ")");

  svg.on("click", clicked);

  var zoom = d3.zoom()
      .scaleExtent([1, 60])  
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

  svg.call(zoom);

  logArea.addEventListener("mousewheel", scrolled);


  redraw();

  function scrolled(event)
  {
    xCursor += (1000*event.deltaY);
    redraw();
  }


  function zoomed(event) 
  {
    newX = event.transform.rescaleX(xScale);
    newXl = event.transform.rescaleX(xlScale);
    redraw();
  }

function clicked(event) 
  {
    // find time of cursor position (in milliseconds)
    xCursor = newXl.invert(event.offsetX-100);
    redraw();
  }



  function redraw() 
  {
    // redraw plot
    xAxis.call(d3.axisBottom(newX));
    g.selectAll("rect").remove();
    g.selectAll(".bar")
     .data(evList)
     .enter()
     .append("rect")
     .attr("clip-path", "url(#clip)")
     .attr("class", "bar")
     .style("fill", function(d) {if (d.Status==0) return "red"; else return "blue"})
     .attr("x", function(d) { return newX(d.Start); })
     .attr("y", function(d) { return yScale(d.Type) + yScale.bandwidth()/2 - 10})
     .attr("width", function(d) {return (Math.max(1, Math.abs(slope(newX)) * d.Duration))})
     .attr("height", function(d) { return 10 });


    // redraw text area
    diamond.remove();
    var x = newXl(xCursor);
    diamond = g.append("path").attr("d", d3.symbol(d3.symbolDiamond))
                      .attr("transform", "translate(" + x + "," + y + ")");

    // create timestamp corresponding to time (devilish date arithmetic!)
    var timeStamp = new Date(+xScale.domain()[0] +  xCursor);

    // find index of closest entry in our log
    var ndx = d3.bisect(timeStamps, timeStamp);

    // display log entries at this time
    var content = data.slice(ndx, ndx+20);
    var text = '';
    for (var i=0;i<20;i++)
    {
      text += `${d3.timeFormat("%Y-%m-%dT%H:%M:%S")(content[i].Time)} ${content[i].Level.slice(0,4)} ${content[i].Source.slice(0,10)} ${content[i].Member.padEnd(14)} ${content[i].Line.padStart(4)} ${content[i].Message.slice(0,80)} \n`;
    }
    document.getElementById('logArea').textContent = text;

  }


  

}





