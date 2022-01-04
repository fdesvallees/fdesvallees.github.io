
var bgLayer = 0;
var graticuleLayer = 1;
var eclipticLayer = 2;
var constLayer = 3;
var boundLayer = 4;
var tileLayer = 5;
var starLayer = 6;
var planetLayer = 7;
var labelLayer = 8;
var infoLayer = 9;
var dsoLayer = 10;
var horizonLayer = 11;
var moonLayer = 12;
var tooltipLayer = 13;
var testLayer = 14;

var tooltip, info;
var background;


class ColorScheme
{
  constructor(scheme)
  {
    this.scheme = [];
    
    switch(scheme)
    {
      case 'dark':
        this.scheme[bgLayer] =  {fillColor: new Color('#02020F')};                  
        this.scheme[graticuleLayer] = {strokeColor: new Color('#141C21'),strokeWidth: 1};  
        this.scheme[eclipticLayer] = {strokeColor: new Color(.1,.1,.4),strokeWidth: 5,opacity:.1}; 
        this.scheme[constLayer] = {strokeColor: new Color('#14252C'),strokeWidth: 2};  
        this.scheme[boundLayer] = {strokeColor: new Color('#282510'),strokeWidth: 1};  
        this.scheme[tileLayer] = {strokeColor: 'blue', strokeWidth: 0};  
        this.scheme[starLayer] = {fillColor: '#A7A7A7'};                  
        this.scheme[planetLayer] = {fillColor: 'white', strokeColor: 'white'};  
        this.scheme[labelLayer] = {fillColor: '#A7A7A7'};  
        this.scheme[dsoLayer] = {strokeColor: 'lightblue', strokeWidth: .5};  
        this.scheme[horizonLayer] = {fillColor:'black'};      
        this.scheme[moonLayer] = {fillColor:'white'};      
        this.scheme[tooltipLayer] = {fillColor:'white'};      
        this.scheme[testLayer] = {strokeColor:'yellow'};      
         break;

      case 'light':
        this.scheme[bgLayer] = {fillColor: 'white'};                  
        this.scheme[graticuleLayer] = {strokeColor: new Color(.7),strokeWidth: .5};  
        this.scheme[eclipticLayer] = {strokeColor: new Color(.4),strokeWidth: .5,dashArray: [5, 5]}; 
        this.scheme[constLayer] = {strokeColor: new Color(.2),strokeWidth: .5};  
        this.scheme[boundLayer] = {strokeColor: new Color(.7),strokeWidth: .5};  
        this.scheme[tileLayer] = {strokeColor: 'blue', strokeWidth: 0};  
        this.scheme[starLayer] = {fillColor: 'black'};                  
        this.scheme[planetLayer] = {fillColor: 'black', strokeColor: 'black'};  
        this.scheme[labelLayer] = {fillColor: 'black'};  
        this.scheme[dsoLayer] = {strokeColor: 'blue', strokeWidth: .5};  
        this.scheme[horizonLayer] = {fillColor:'grey'};      
        this.scheme[moonLayer] = {fillColor:'white'};      
        this.scheme[tooltipLayer] = {fillColor:'black'};      
        this.scheme[testLayer] = {strokeColor:'yellow'};      
        break;
    }

  }

  getStyle(index)
  {
    return this.scheme[index];
  }

}


class MoonFace{
  constructor(r, i)
  {
    this.r = r;
    var sign = Math.sign(i);

    if (i<0)
    {
      var left = 'black'; var right = 'white';    
    }
    else
    {
      var left = 'white'; var right = 'black';
    }
    var phase = sign * Math.cos(i*Math.PI / 180);

    this.leftLimb =  new Path.Arc({from:[0,-r], to:[0,r], through:[-r,0]});
    this.lTerminator = new Path.Arc({from:[0,r], to:[0,-r], through:[r*phase,0],});
    this.rightLimb =  new Path.Arc({from:[0,r], to:[0,-r], through:[r,0]});
    this.rTerminator = new Path.Arc({from:[0,-r], to:[0,r], through:[r*phase,0],});
 
    this.left = new CompoundPath({children:[this.leftLimb,this.lTerminator],fillColor:left});
    this.right = new CompoundPath({children:[this.rTerminator,this.rightLimb],fillColor:right});
    return new Group({children:[this.left, this.right]});
  }
}


class PaperContext
{
  constructor()
  {
    for (var i=0;i<15;i++)
    {
      var l = new Layer();
    }
    project.layers[labelLayer].visible = false;  
    project.layers[boundLayer].visible = false;  
    project.layers[dsoLayer].visible = false;  
    project.layers[tooltipLayer].visible = true;  
    project.layers[testLayer].visible = false;  

    this.colorScheme = new ColorScheme('dark');

    view.onResize = function(event){resizePaper();};
    resizePaper();
    return this;
  }

  setResizeCallback(f)
  {
    view.onResize = f;
  }

  setColorScheme(s)
  {
    this.colorScheme = new ColorScheme(s)
  }

  beginPath()
  {
    console.log('begin'); // never called??
  }
  moveTo(x,y)
  {
    this.path = new Path();
    this.path.data = this.id;
    this.path.style = this.colorScheme.getStyle(this.activeLayer);
    this.path.moveTo(x,y);
  }
  lineTo(x,y)
  {
    this.path.lineTo(x,y);
  }
  arc(x,y,radius,startAngle, endAngle)
  {
    console.log('arc:',x,y, radius,startAngle, endAngle);
  }
  closePath()
  {
  }
  // for drawing multi lines. 
  planetPath(arr)
  {
    var segments = [];
    for (var i in arr)
    {
      segments.push(new Point(arr[i]));
    }
    this.path = new Path(segments);
    this.path.data = this.id;
    this.path.style = this.colorScheme.getStyle(this.activeLayer);
    this.path.fillColor = null;
    this.path.closed = false;
  }
  nameItem(id)
  {
    this.id = id;
  }
  setLayer(i)
  {
    this.activeLayer = i;
    project.layers[i].activate();
    project.layers[i].style = this.colorScheme.getStyle(i);
  }
  toggleLayer(i)
  {
    project.layers[i].visible = ! (project.layers[i].visible); 
  }
  drawBackground(radius)
  {
    this.setLayer(bgLayer);
    project.layers[bgLayer].clear();
    background = new Shape.Circle(new Point(0,0), radius);
    background.style = this.colorScheme.getStyle(bgLayer);
    background.sendToBack();
  }
  drawFullBackground()
  {
    this.setLayer(bgLayer);
    project.layers[bgLayer].clear();
    background = new Shape.Rectangle(view.bounds);
    background.style = this.colorScheme.getStyle(bgLayer);
    background.sendToBack();
  }
  drawToolTip(xy, id, object)
  {
    var style = this.colorScheme.getStyle(tooltipLayer);
    if (mouseStar)
    {
      mouseStar.selected = false;
      mouseStar.remove();
    }
    // invisible, but larger, dot for mouse
    var mouseStar = new Shape.Circle(new Point(xy[0], xy[1]), 5);
    mouseStar.fillColor = 'white';
    mouseStar.opacity = 0;

   // Create onMouseEnter event for dot
    mouseStar.on('mouseenter', function() {
      if (!mouseStar.selected)
      {
        mouseStar.selected = true;
        tooltip = new PointText(this.position.add(new Point(10, 0)));
        tooltip.name = 'tooltip';
        tooltip.content = id;
        tooltip.fillColor = style.fillColor;
        tooltip.fontFamily = 'courier';
        tooltip.fontSize = 12;
        tooltip.data = object;
      }
    });
    mouseStar.on('mouseleave', function(event) 
    {
      mouseStar.selected = false;
      tooltip.remove();
    });
  }

  drawCircle(xy, radius)
  {
    var circle = new Shape.Circle(new Point(xy[0], xy[1]), radius);
    circle.style = this.colorScheme.getStyle(graticuleLayer);
  }

  drawDisk(xy, radius, layer)
  {
    if (radius<0.1)
      return;

    var circle = new Shape.Circle(new Point(xy[0], xy[1]), radius);
    circle.style = this.colorScheme.getStyle(layer);
  }

  drawDot(xy, radius, id, object, layer)
  {
    if (radius<0.1)
      return;

    var circle = new Shape.Circle(new Point(xy[0], xy[1]), radius);
    circle.style = this.colorScheme.getStyle(starLayer);
    this.drawToolTip(xy, id, object);
  }


  drawMoon(xy, radius, radec, inc)
  {
    var moon = new MoonFace(radius, radec[3]);
    moon.rotate(inc);
    moon.translate (new Point(xy));
    this.drawToolTip(xy, 'moon', {'ra':radec[0],'dec':radec[1],'name':'moon','mag':-1});
  }

  drawSun(xy, radius, radec)
  {
    var sun = new Shape.Circle(new Point(xy[0], xy[1]), radius*10);
    sun.fillColor = {
      gradient: {
          stops: [['white', 0.02], ['yellow', 0.03], [project.layers[bgLayer].fillColor, 1.0]],
          radial: true
      },
      origin: sun.position,
      destination: sun.bounds.rightCenter
    };
    sun.opacity = 0.8;
    this.drawToolTip(xy, 'sun', {'ra':radec[0],'dec':radec[1],'name':'sun','mag':-10});
  
  }

  drawPn(xy)
  {
  var neb = new CompoundPath({
    children: [
        new Path.Circle({
            center: new Point(xy[0], xy[1]),
            radius: 3
        }),
        new Path.Line({
            from: new Point(xy[0]-5, xy[1]),
            to:   new Point(xy[0]+5, xy[1])
        }),
        new Path.Line({
            from: new Point(xy[0], xy[1]-5),
            to:   new Point(xy[0], xy[1]+5)
        }),
    ]});    
    neb.style = this.colorScheme.getStyle(dsoLayer);
  }
  drawGlx(xy)
  {
    var neb = new Shape.Ellipse({center:[xy[0], xy[1]], radius:[6,3]});
    neb.style = this.colorScheme.getStyle(dsoLayer);
  }
  drawEn(xy)
  {
    var neb = new Shape.Rectangle({rectangle:{topLeft:[xy[0]-4, xy[1]-4], 
                                              bottomRight:[xy[0]+4, xy[1]+4]}});
    neb.style = this.colorScheme.getStyle(dsoLayer);
  }
  drawRn(xy)
  {
    var neb = new Shape.Rectangle({rectangle:{topLeft:[xy[0]-4, xy[1]-4], 
                                              bottomRight:[xy[0]+4, xy[1]+4]}});
    neb.style = this.colorScheme.getStyle(dsoLayer);
    neb.dashArray = [2,2];
  }
  drawOc(xy)
  {
    var neb = new Shape.Circle(new Point(xy[0], xy[1]), 4);
    neb.style = this.colorScheme.getStyle(dsoLayer);
    neb.dashArray = [2,2];
  }
  drawGc(xy)
  {
  var neb = new CompoundPath({
    children: [
        new Path.Circle({
            center: new Point(xy[0], xy[1]),
            radius: 4
        }),
        new Path.Line({
            from: new Point(xy[0]-4, xy[1]),
            to:   new Point(xy[0]+4, xy[1])
        }),
        new Path.Line({
            from: new Point(xy[0], xy[1]-4),
            to:   new Point(xy[0], xy[1]+4)
        }),
    ]});    
    neb.style = this.colorScheme.getStyle(dsoLayer);
  }
  drawNeb(xy, object, name)
  {
    project.layers[dsoLayer].activate();
    switch(+object.type)
    {
      case 0: this.drawPn(xy); break;
      case 1: this.drawGlx(xy); break;
      case 2: this.drawEn(xy); break;
      case 3: this.drawRn(xy); break;
      case 4: this.drawOc(xy); break;
      case 5: this.drawGc(xy); break;
    }
    this.drawToolTip(xy, name, object);
 }
  drawLabel(xy,txt)
  {
    if (project.layers[labelLayer].visible)
    {
      project.layers[labelLayer].activate();
      var pt = new Point(xy[0]+10, xy[1]);
      var label = new PointText(pt);
      label.content = txt;
      label.fontFamily = 'courier';
      label.fontSize = 14;
      label.fillColor = this.colorScheme.getStyle(labelLayer).fillColor;
    }
  }
  erase()
  {
    for (var i in project.layers)
    {
      project.layers[i].clear();
    }  
  }  
  // called by d3.js when mouse is clicked
  // use the current tooltip, if it exists, to show the selected object's info
  selectObject()
  {
    if (tooltip!= undefined)
    {
      var xy = tooltip.position;
      var hitResult = project.hitTest(xy);
      if (Object.keys(hitResult.item.data).length)
      {
        info = new InfoBox(200, 80);
        var obj = hitResult.item.data; 
        var f = d3.format('.4f');
        if (obj['hd'])       // star?
        {
          info.log('HD   : ', obj['hd']);
          info.log('name : ', starText(obj));
          info.log('ra   : ', deg2hms(obj['ra']));
          info.log('dec  : ', anglestring(obj['dec']),false);
          info.log('mag  : ', f(obj['mag']));          
        }
        else
        {
          if (obj['ngc'])       // DSO?
          {
            info.log('Type : ', NebTypes[obj.type]);
            if (obj.m > 0)
              info.log('name : ', nebulaText(obj));
            else
              info.log('NGC  : ', nebulaText(obj));
            info.log('ra   : ', deg2hms(obj['ra']));
            info.log('dec  : ', anglestring(obj['dec']),false);
            info.log('mag  : ', f(obj['mag']));          
          }
          else
          {
            info.log('name : ', obj['name']);
            info.log('ra   : ', deg2hms(obj['ra']));
            info.log('dec  : ', anglestring(obj['dec']),false);
            info.log('mag  : ', f(obj['mag']));                                
          }
        }
      }
    }
  }
  drawFrame()
  {
    var p1 = new Point(-view.viewSize.width/2, view.viewSize.height/2); // bottom left
    var p2 = new Point(view.viewSize.width/2, -view.viewSize.height/2); // top right
    var frame = new Shape.Rectangle(p1, p2);
    frame.strokeWidth = 2;
    frame.strokeColor = this.colorScheme.getStyle(labelLayer).fillColor;

    var smallFrame1 = new Shape.Rectangle(p1, new Size(50, -100));
    smallFrame1.strokeWidth = 1;
    smallFrame1.strokeColor = this.colorScheme.getStyle(labelLayer).fillColor;
    smallFrame1.fillColor = this.colorScheme.getStyle(bgLayer).fillColor;

  }  
}

class InfoBox
{
  constructor (width, height)
  {
    var rect = new Rectangle(new Point((view.size.width/2)-width,((view.size.height/2)-height)), new Size(width, height));
    this.box = new Shape.Rectangle(rect);
    this.box.fillColor = 'white';
    this.box.opacity = 1;
    this.box.strokeColor = 'black';
    this.box.strokeWidth = 0.5;
    this.pt = this.box.bounds.topLeft.add (new Point (10,15));
    this.box.addChild(this.pt);
    project.layers[infoLayer].addChild(this.box);
    this.box.bringToFront();
  }
  log(property, value)
  {
    project.layers[infoLayer].activate();
    this.txt = new PointText(this.pt);
    this.txt.fontFamily = 'courier';
    this.txt.content = property + value;
    this.box.addChild(this.txt);
    this.pt = this.pt.add (new Point(0,15));
  }
  remove()
  {
    project.layers[infoLayer].clear();
  }
}




function resizePaper()
{
  var w = window.innerWidth;
  var h =  window.innerHeight;
  view.viewSize = new Size(w, h);
  if (info)
    info.remove();
}
