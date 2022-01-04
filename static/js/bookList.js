  // add 1000 to avoid negative dates that the default sort cannot handle
   function fixDate(books)
    {
      for (let i in books)
      {
        books[i].sortDate = books[i].year + 1000;
      }
      return(books);
    }

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
        // view constructor options
        renderer: "canvas",
      },
    };

    // register vega and vega-lite with the API
    vl.register(vega, vegaLite, options);
    d3.csv("books.csv").then(function(df) 
    {
      let books = fixDate(df);
      
      vl.markBar()
        .width('500')
        .data(books)
//        .param.bind('scales')
        .encode(
          vl.y().fieldN('date').sort('sortDate'),
          vl.x().fieldQ('pages'),
          vl.tooltip().fieldN('author'),
          vl.href().field('url'))
        .render()
        .then(viewElement => {
          // render returns a promise to a DOM element containing the chart
          // viewElement.value contains the Vega View object instance
          document.getElementById('view').appendChild(viewElement);
        });
      });        
