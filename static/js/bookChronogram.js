    // setup API options
    const options = {
      config: {
        // Vega-Lite default configuration
      },
      init: (view) => {
        // initialize tooltip handler
        view.tooltip(new vegaTooltip.Handler().call);
      },
      view: {
        renderer: "canvas",
      },
    };
    // register vega and vega-lite with the API
    vl.register(vega, vegaLite, options);
    d3.csv("gibbon.csv").then(function(book) 
    {      
      vl.markLine()
        .width('500')
        .data(book)
        .encode(
          vl.y().fieldQ('startDate').sort('ascending'),
          vl.x().fieldQ('startPage'),
          vl.tooltip().fieldN('id'))
        .render()
        .then(viewElement => {
          // render returns a promise to a DOM element containing the chart
          // viewElement.value contains the Vega View object instance
          document.getElementById('view').appendChild(viewElement);
        });
      });       