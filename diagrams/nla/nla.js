

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

// create a list of exposure events
function findExposure(data, evList)
{
  var ready = true;
  var start = new Date;

  for (var i=0;i<data.length;i++)
  {
    if (ready)
    {
      if ((data[i].Line == "208") && (data[i].Message.search("TakeExposure") != -1))  // start
      {
        start = data[i].Time;
        ready = false;
      }
    }
    else
    {
      if ((data[i].Line == "254") && (data[i].Message.search("TakeExposure") != -1))  // end 
      {
        evList.push({Type: 'Exposure', Start: start, Duration: (data[i].Time - start)}); 
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

  var evList = []
  findPlateSolve(data, evList);
  findAutoFocus(data, evList);
  findExposure(data, evList);

  var svg = d3.select("svg"),
            margin = 200,
            width = svg.attr("width") - margin,
            height = svg.attr("height") - margin

  var g = svg.append("g")
            .attr("transform", "translate(" + 100 + "," + 100 + ")");

   // X axis
  var xScale = d3.scaleTime().range([0, width])
                            .domain([data.at(0).Time, data.at(-1).Time]); 

  var xScl = width / (data.at(-1).Time - data.at(0).Time); // for scaling time intervals 

  // Y axis
  var yScale = d3.scaleBand().range([ 0, height ])
                        .domain(['Plate Solve', 'Autofocus', 'Exposure'])
                        .padding(.1);


  g.append("g")
   .attr("transform", "translate(0," + height + ")")
   .call(d3.axisBottom(xScale))
   .selectAll("text")
   .attr("transform", "translate(-10,10)rotate(-45)")
   .style("text-anchor", "end");

  g.append("g")
    .call(d3.axisLeft(yScale))

  g.selectAll(".bar")
   .data(evList)
   .enter()
   .append("rect")
   .attr("class", "bar")
   .attr("x", function(d) { return xScale(d.Start); })
   .attr("y", function(d) { return yScale(d.Type) + yScale.bandwidth()/2 - 10})
//   .attr("width", function(d) {return Math.max(1, xScale(d.Duration))})
   .attr("width", function(d) {return (Math.max(1, xScl * d.Duration))})
   .attr("height", function(d) { return 10 })

}



