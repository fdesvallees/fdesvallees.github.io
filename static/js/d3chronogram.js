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
  var width = 640;
  var height = 400;

  var xRange = [marginLeft, width - marginRight]; // [left, right]
  var yRange = [height - marginBottom, marginTop]; // [bottom, top]

  const Xl = data.map(d => parseInt(d.startPage));
  const Xh = data.map(d => parseInt(d.endPage));
  const Yl = data.map(d => parseInt(d.startDate));
  const Yh = data.map(d => parseInt(d.endDate));
  const I = d3.range(Xh.length);
  const id = data.map(d => d.id);

  var xAxis = (g, x) =>
    g.attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(10));

  var yAxis = (g, y) =>
    g.attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))

  // Compute default domains and ticks.
  var xDomain = [d3.min(Xl), d3.max(Xh)];
  var yDomain = [d3.min(Yl), d3.max(Yh)];

  // Construct scales and axes.
  var xScale = d3.scaleLinear(xDomain, xRange);
  var yScale = d3.scaleLinear(yDomain, yRange);

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
                .text("pages");

  const yLabel =svg.append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90) translate(-120,0)")
                .text("year");

  const bar = svg.append("g")
  .attr("fill", "steelblue")


  function redraw(xScale, yScale)
  {
    bar.selectAll("rect").remove();
    bar.selectAll("rect")
    .data(I)
    .join("rect")
      .attr("clip-path", `url(${uid.href})`)
      .attr("x", i => xScale(Xl[i]))
      .attr("y", i => yScale(Yh[i]))
      .attr("width", i =>  1+ xScale(Xh[i])-xScale(Xl[i]))
      .attr("height", i =>  1+ yScale(Yl[i])-yScale(Yh[i]))
      .append('title')
      .text((d) => id[d] + ` ${Yl[d]}-${Yh[d]}`);   
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


