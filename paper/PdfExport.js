/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */


/**
 * A function scope holding all the functionality needed to convert a
 * Paper.js DOM to a PDF DOM.
 */
//new function() {
    var doc;

    function getTransform(matrix, coordinates, center) {
        // Use new Base() so we can use Base#set() on it.
        var attrs = new Base(),
            trans = matrix.getTranslation();
        if (coordinates) {
            // If the item suppports x- and y- coordinates, we're taking out the
            // translation part of the matrix and move it to x, y attributes, to
            // produce more readable markup, and not have to use center points
            // in rotate(). To do so, SVG requries us to inverse transform the
            // translation point by the matrix itself, since they are provided
            // in local coordinates.
            var point;
            if (matrix.isInvertible()) {
                matrix = matrix._shiftless();
                point = matrix._inverseTransform(trans);
                trans = null;
            } else {
                point = new Point();
            }
            attrs[center ? 'cx' : 'x'] = point.x;
            attrs[center ? 'cy' : 'y'] = point.y;
        }
        if (!matrix.isIdentity()) {
            // See if we can decompose the matrix and can formulate it as a
            // simple translate/scale/rotate command sequence.
            var decomposed = matrix.decompose();
            if (decomposed) {
                var parts = [],
                    angle = decomposed.rotation,
                    scale = decomposed.scaling,
                    skew = decomposed.skewing;
                if (trans && !trans.isZero())
                {
                    attrs.trans = trans;
                }
                if (angle)
                {
                    attrs.angle = angle;
                }
                if (!Numerical.isZero(scale.x - 1)
                        || !Numerical.isZero(scale.y - 1))
                {
                    console.log("scale: ", scale);
                    attrs.scale = scale;                    
                }
                if (skew.x)
                    console.log("skewX: ", skew.x);
                if (skew.y)
                    console.log("skewY: ", skew.y);
                attrs.transform = parts.join(' ');
            } else {
                attrs.transform = 'matrix(' + matrix.getValues().join(',') + ')';
            }
        }
        return attrs;
    }

    function getStyle(item) 
    {
        var style = {frgb:['0','0','0'], srgb:['0','0','0'], fillStyle:'', strokeWidth: 1};
        if (item.fillColor)
        {
            style.frgb[0] = (String(item.fillColor._components[0]));
            style.frgb[1] = (String(item.fillColor._components[1]));
            style.frgb[2] = (String(item.fillColor._components[2]));
            style.fillStyle += 'F';  // fill
        }
        if (item.strokeColor)
        {
            style.srgb[0] = (String(item.strokeColor._components[0]));   // string denotes a float
            style.srgb[1] = (String(item.strokeColor._components[1]));
            style.srgb[2] = (String(item.strokeColor._components[2]));
            style.fillStyle += 'D';  // draw
        }
        if (item.strokeWidth)
        {
            style.strokeWidth = item.strokeWidth;
        }
        return style;
    }

    function exportGroup(group, options) 
    {
        console.log('group');
        var children = group._children;
        for (var i=0;i<children.length;i++)
        {
            var item = children[i];
            var exporter = exporters[item._class];
            exporter(item, options);
        }
    }

    function exportRaster(item, options) 
    {
        console.log('raster');
    }


    function setLineStyle(style)
    {
        if (/D/g.test(style.fillStyle))
        {
            doc.setDrawColor(style.srgb[0],style.srgb[1],style.srgb[2]);            
            doc.setLineWidth(style.strokeWidth);
        }
        if (/F/g.test(style.fillStyle))
            doc.setFillColor(style.frgb[0],style.frgb[1],style.frgb[2]);
    }


    function exportPath(item, options) 
    {
        console.log('path');
        var segments = item._segments,
            length = segments.length,
            type,
            attrs = getTransform(item._matrix),
            style = getStyle(item);


        setLineStyle(style);

        attrs.d = item.getPathData(null, 0);
        var result = attrs.d.match(/[M|l]-*\d+,-*\d+|[h|v]-*\d+|c-*\d+,-*\d+ -*\d+,-*\d+ -*\d+,-*\d+/g); // M: moveTo, l:lineTo, h:horizontal, v:vertical, c:curveTo
  
        var center = view.size.divide(2).subtract(view.center);

        // lines API
        var pts = []
        var start = result[0].slice(1).split(',').map(function(item){return Number(item)});
        start[0]+= center.width;
        start[1]+= center.height;

        for (var i=1;i<result.length;i++)
        {
            if (result[i][0] == 'l')   // lineTo
            {
                var pt = result[i].slice(1).split(',');
                var curPos = [Number(pt[0]), Number(pt[1])];                 
                pts.push(curPos);
            }
            if (result[i][0] == 'h')   // horizontal
            {
                pts.push([Number(result[i].slice(1)),0]);
            }
            if (result[i][0] == 'v')   // vertical
            {
                pts.push([0, Number(result[i].slice(1))]);
            }
            if (result[i][0] == 'c')   // curve
            {
                var pt = result[i].slice(1).split(/ |,/g);
                var curPos = [Number(pt[0]), Number(pt[1]), Number(pt[2]), Number(pt[3]), Number(pt[4]), Number(pt[5])];                 
                pts.push(curPos);
           }
        }
        doc.advancedAPI(doc => 
        {
            doc.lines(pts, Number(start[0]), Number(start[1]), [1,1], style.fillStyle, item._closed);
        });
    }

    function exportShape(item) 
    {
        console.log('shape');
        var type = item._type,
            style = getStyle(item);

        setLineStyle(style);
        var path = item.toPath();
    }

    function exportCompoundPath(item, options) 
    {
        console.log('CompoundPath');
        var children = item._children;
        for (var i=0;i<children.length;i++)
        {
            var item = children[i];
            var exporter = exporters[item._class];
            exporter(item, options);
        }
    }

    function exportSymbolItem(item, options) 
    {
        console.log('SymbolItem');
    }

    function exportGradient(color) 
    {
        console.log('gradient');
    }

    function exportText(item) 
    {
        console.log('text');
        var pos = getTransform(item._matrix, false, false),
            style = getStyle(item);
        var options = {};
        var size = doc.getFontSize();

        if (pos.angle)
        {
            options.angle = -pos.angle;
        }
        if (pos.scale)
        {
            doc.setFontSize(pos.scale.x * size);
        }
        doc.setTextColor(style.frgb[0],style.frgb[1],style.frgb[2]);

        doc.text(item._content, pos.trans.x, pos.trans.y, options);
        doc.setFontSize(size);
    }

    var exporters = {
        Group: exportGroup,
        Layer: exportGroup,
        Raster: exportRaster,
        Path: exportPath,
        Shape: exportShape,
        CompoundPath: exportCompoundPath,
        SymbolItem: exportSymbolItem,
        PointText: exportText
    };

    

    var definitions;
    function getDefinition(item, type) 
    {
    }

    function setDefinition(item, node, type) 
    {
    }

    function exportDefinitions(node, options) 
    {
    }


    function exportPDF(pane) 
    {
      console.log("exporting");
      var size = [view.size.width, view.size.height];
      doc = new jspdf.jsPDF({format: size, unit:'px'});

      var children = project._children;
      // handle bounds and matrix

      for (var i=0;i<children.length;i++)
      {
        var item = children[i];
        var exporter = exporters[item._class];
        exporter(item);
      }
        const string = doc.output('datauristring');
        document.getElementById(pane).setAttribute('src',string);     
    }

   
