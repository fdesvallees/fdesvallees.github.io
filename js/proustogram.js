var count = 0;

function fuid(name) {
  return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

function Id(id) {
  this.id = id;
  this.href = new URL(`#${id}`, location) + "";
}

Id.prototype.toString = function() {
  return "url(" + this.href + ")";
};


function bookChart(data, 
  {
  } = {})
 {
  var marginTop = 20;
  var marginRight = 30;
  var marginBottom = 40;
  var marginLeft = 50;
  var width = 600;
  var height = 400;
  const yearFormat = d3.timeFormat("%Y");

  var xRange = [marginLeft, width - marginRight]; // [left, right]
  var yRange = [height - marginBottom, marginTop]; // [bottom, top]

  const Xw = data.map(d => parseInt(d.wordCount));

  // build the x scale by adding all word counts
  var startCnt = [], endCnt = [];
  startCnt[0] = 0;
  endCnt[0] = Xw[0];
  for (let i=1;i<data.length;i++)
  {
    startCnt[i] = endCnt[i-1] + 1;
    endCnt[i] = startCnt[i]+Xw[i]; 
  }

  const Yl = data.map(d => new Date(parseInt(d.startDate),0,1));
  const Yh = data.map(d => new Date(parseInt(d.endDate),11,31));
  const I = d3.range(Xw.length);
  const id = data.map(d => d.title);

  var xAxis = (g, x) =>
    g.attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(10));

  var yAxis = (g, y) =>
    g.attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))

  // Compute default domains and ticks.
  var xDomain = [0, d3.max(endCnt)];
  var yDomain = [d3.min(Yl), d3.max(Yh)];

  // Construct scales and axes.
  var xScale = d3.scaleLinear(xDomain, xRange);
  var yScale = d3.scaleTime(yDomain, yRange);

  const zoom = d3
    .zoom()
    .scaleExtent([1, 32])
    .extent([[marginLeft, 0], [width - marginRight, height]])
    .translateExtent([
      [marginLeft, -Infinity],
      [width - marginRight, Infinity]
    ])
    .on("zoom", zoomed);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
  
  const uid = fuid("clip")

  svg.append("defs")
      .append("clipPath")
      .attr("id", uid.id)
      .append("rect")
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("x", marginLeft)
      .attr("y", marginTop);

  const gx = svg.append("g").call(xAxis,xScale);
  const gy = svg.append("g").call(yAxis,yScale);
  const xLabel = svg.append("text")
                .attr("class", "label")
                .attr("x", width/2)
                .attr("y", height-5)
                .text("words");

  const yLabel =svg.append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90) translate(-120,0)")
                .text("year");

  const bar = svg.append("g")
    .attr("fill", "lightgrey");

  const txt = svg.append("g")
    .attr("fill","black");   

  function redraw(xScale, yScale)
  {
    bar.selectAll("rect").remove();
    bar.selectAll("rect")
      .data(I)
      .join("rect")
        .attr("clip-path", `url(${uid.href})`)
        .attr("x", i => xScale(startCnt[i]))
        .attr("y", i => yScale(Yh[i]))
        .attr("width", i =>  xScale(endCnt[i])-xScale(startCnt[i]))
        .attr("height", i =>  yScale(Yl[i])-yScale(Yh[i]))
        .append('title')
        .text((d) => id[d] + `: ${yearFormat(Yl[d])}-${yearFormat(Yh[d])}`);

    let sz = d3.min([16,(xScale(xDomain[1])-xScale(xDomain[0]))/50]);
    txt.selectAll("text").remove();
    txt.selectAll("text")
      .data(I)
      .join("text")
        .attr("font-size", sz)
        .attr("clip-path", `url(${uid.href})`)
        .attr("x", i => xScale(startCnt[i]))
        .attr("y", i => sz+yScale(Yh[i]))
        .text((d) => id[d]);   

  }

  function zoomed(event) 
  {
    const xz = event.transform.rescaleX(xScale);
    const yz = event.transform.rescaleY(yScale);

    redraw(xz,yz);

    gx.call(xAxis, xz);
    gy.call(yAxis, yz);
  }

  svg.call(zoom);
  redraw(xScale, yScale);

  return svg.node();

}


