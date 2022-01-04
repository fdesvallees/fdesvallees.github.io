/**
 * @author fdesvallees
 */

THREE.PaperObject = function ( node ) {
	THREE.Object3D.call( this );
	this.node = node;
};


THREE.PaperObject.prototype = Object.create( THREE.Object3D.prototype );
THREE.PaperObject.prototype.constructor = THREE.PaperObject;

//Save SVG from paper.js as a file.
function downloadAsSVG () {
  var fileName = "planets.svg"
  var url = "data:image/svg+xml;utf8," + encodeURIComponent(paper.project.exportSVG({asString:true}));
  var link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
}


// return all possible pairs in the array 
function combinations(a)
{
  var res = [];
  for (var i=0;i<a.length-1;i++)
    for (var j=i;j<a.length;j++)
      res.push([a[i],a[j]]);
  return res;
}



function threeColor(color)
{
  return new Color(color.r, color.g, color.b);
}


THREE.PaperRenderer = function ()
{
	console.log( 'THREE.PaperRenderer', THREE.REVISION );
	var _this = this,
	_renderData,
	_viewMatrix = new THREE.Matrix4(),
  _oldMatrix = new THREE.Matrix4(),
	_viewProjectionMatrix = new THREE.Matrix4();
  view.center = new Point (0,0);
  var _frustum = new THREE.Frustum();

  this.domElement = document.getElementById("canvas1");

	this.autoClear = true;
	this.sortObjects = true;
	this.sortElements = true;
  var background = new Shape.Rectangle(new Rectangle(-view.element.width,-view.element.height,2*view.element.width, 2*view.element.height));
  var textColor = new Color(0,0,0);
  var maxLayers = 3;    // lines, text, grid
  for (var i=0;i<maxLayers;i++)
  {
    var l = new Layer({id : '_' + i});
  }
  project.layers[0].activate();
  var _paperGroup = new Group({applyMatrix: false});
  var _intersectionGroup = new Group({applyMatrix: false});
  var _textGroup = new Group({applyMatrix: false});
  var _gridGroup = new Group({applyMatrix: false});
  project.layers[0].addChild(_paperGroup);
  project.layers[0].addChild(_intersectionGroup);
  project.layers[1].addChild(_textGroup);
  project.layers[2].addChild(_gridGroup);
 
	this.setSize = function( width, height )
	{
    view.viewSize = new Size(width, height);
    view.center = new Point (0,0);
  };

	
	this.clear = function ()
	{
	  paper.clear();
	};

	this.render = function ( scene, camera )
	{
    camera.updateMatrixWorld();
    // don't render if camera has not changed
    _viewMatrix.copy(camera.matrixWorldInverse );
    if ((_oldMatrix.equals(_viewMatrix)) && !(scene.userData.update))
      return; 
    scene.userData.update = false;

    // determine camera active layers
    var layerMask = camera.layers;
    for (var i=0;i<maxLayers;i++)
    {
      if (layerMask & (1<<i))
      {
        paper.project.layers[i].visible = true;
      }
      else
      {
        paper.project.layers[i].visible = false;
      }
    }

    if (scene.background)
    {
      background.fillColor = threeColor(scene.background);
      if (background.fillColor.components[0] == 0)
        textColor = 'white';
      else
        textColor = 'black';

      background.sendToBack();
    }

    _oldMatrix.copy( _viewMatrix );
    _viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );
    _frustum.setFromMatrix( _viewProjectionMatrix );

    for (var i in scene.children)
    {
      switch(scene.children[i].type)
      {
        case 'Line': renderLine(scene.children[i],  _viewProjectionMatrix); break;
        case 'Sprite': renderSprite(scene.children[i],  _viewProjectionMatrix); break;
        default: console.log(scene.children[i].type, ' not supported');
      }
    }

    _intersectionGroup.removeChildren();
    // Build a list of all orbit paths : the scene objects have userData type='orbit'
    var interList = [];
    for (var i in scene.children)
    {
      var obj = scene.children[i];
      if (obj.userData.type == 'orbit')
          interList.push(getPaperObject(obj));
    }

    // Build list of all pairs
    var pairList = combinations (interList);

    // compute all intersections
    {
      for (var i in pairList)
        showIntersections(pairList[i][1], pairList[i][0], _intersectionGroup);
    }

    paper.view.update();
  };

// retrieve the THREE object from the Paper render object
function getSceneObject(paperObject)
{
  var id = +paperObject.name.substring(1);
  for (var i in scene.children)     // there should be a better way
  {
    if (scene.children[i].id == id) 
      return(scene.children[i]);
  }
  return (null);
}

 // retrieve the Paper render object from the THREE object id
  function getPaperObject(obj3)
  {
    var name = '_' + obj3.id;
    if (obj3.layers.mask == 4)  // grid group
      return _gridGroup.children[name];

    return _paperGroup.children[name];
  }

  function getPaperGroup(obj3)
  {
    switch(obj3.layers.mask)
    {
      case 1: return _paperGroup; break;
      case 2: return _textGroup; break;
      case 4: return _gridGroup; break;
    }
  }



  function getTextObject(id)
  {
    var name = '_' + id;
    var obj = _textGroup.children[name];
    return (obj);
  }


 
  function renderText(object, matrix)
  {
    var text = getTextObject(object.id);
    if (text == null)
    {
      text = new PointText({name:'_'+object.id});
      getPaperGroup(object).addChild(text);
      text.content = object.userData.content;
      text.strokeWidth = 1;
    }
  if (_frustum.containsPoint(object.position))
  {
    var pos = projectVertex(object.position, matrix);
    text.setPosition(new Point (pos.x + 20, pos.y + 10));
    text.data = pos.z;
    text.visible = true;
    text.fillColor = textColor;
  }
  else
  {
    text.visible = false;
  }

 }

  function renderShape(object, matrix)
  {
    var circle = getPaperObject(object);
    if (circle == null)
    {
     // create a circle element to render the planet
      circle = new Path.Circle({
      center: [0, 0],
      radius: 4,
      strokeWidth: 3, 
      name: '_' + object.id
    });
    getPaperGroup(object).addChild(circle);
   }

  if (_frustum.containsPoint(object.position))
  {
    var pos = projectVertex(object.position, matrix);
    circle.setPosition(new Point (pos.x, pos.y));
    circle.data = pos.z;
    circle.visible = true;
    circle.strokeColor = background.fillColor;
    circle.fillColor = threeColor(object.userData.color);
  }
  else
  {
    circle.visible = false;
  }
}


// At this time, THREE sprites are used for text and fixed-sized shapes
 function renderSprite( object, matrix)
 {
    switch(object.userData.type)
    {
      case 'text': renderText(object, matrix); break;
      case 'shape': renderShape(object, matrix); break;
    }
}

  
function projectVertex( vertex, matrix )
  {
    var position = new THREE.Vector4(vertex.x,vertex.y, vertex.z, 1);
    var positionScreen = new THREE.Vector4();

    positionScreen.copy( position ).applyMatrix4( matrix );
    var invW = view.size.width / positionScreen.w;

    positionScreen.x *= invW;
    positionScreen.y *= -invW;
    positionScreen.z *= invW;

    return (positionScreen);
  }
 
  
    // true if object is entirely visible  
    function isVisible(object)
    {
      
      for (var i in object.geometry.vertices)
      {
        if (!_frustum.containsPoint(object.geometry.vertices[i]))
        {
          return false;
        }
      }
      return true;
    }

     // create a path with n points that will be initialized later
    function newPath(n)
    {
      var path = new Path();
      for (var i=0;i<n;i++)
      {
        path.add(new Point());  
      }
      return path;
    }


  // render multiLine as a single Paper path
  function renderVline( object, matrix)
  {
    // returns the line width for a given w 
    function lineWidth(width, w)
    {
      var distanceFactor = width * 10 /  camera.position.length();
      return (distanceFactor * (10 - ((w - camera.position.length()) / 5))); 
    }
    // If the object is not yet in our list, add it, otherwise just modify it
    var path = getPaperObject(object);
    var num = object.geometry.vertices.length;

    // a closed variable-width line is rendered as a compound of 2 concentric closed paths
    if (object.userData.closed)
    {
      if (path == null)
      {
        var path = newPath(num);
        path.closed = 1;
        path.name = '_'+object.id;

        var outline1 = newPath(num);
        var outline2 = newPath(num);
        outline1.closed = 1;
        outline2.closed = 1;

        var area = new CompoundPath({
          children: [outline1, outline2],
          fillColor: threeColor(object.material.color),
          fillRule: 'evenodd',
//          strokeColor: 'blue', strokeWidth: 1
        });

  
//        skeleton.strokeColor = 'red';
 //       skeleton.strokeWidth = 1;

        path.data = area;
        getPaperGroup(object).addChild(path);
        getPaperGroup(object).addChild(area);
      }
      if (object.visible)
      {
        path.data.visible = 1;
        var w = [];

        // project the vertices and build the skeleton
        for (var i=0;i<num;i++)
        {
          var pos = projectVertex(object.geometry.vertices[i], matrix);
          var pt = new Point(pos.x, pos.y);
          w[i] = pos.w;
          path.segments[i].point = pt;
        }
        path.smooth();

        for (var i=0;i<num;i++)
        {
          var pt = path.segments[i].point;
          var normal = path.curves[i].getNormalAt(0);
          path.data.children[0].segments[i].point = pt.add(normal.multiply(lineWidth(object.material.linewidth, w[i])));
          path.data.children[1].segments[i].point = pt.add(normal.multiply(-lineWidth(object.material.linewidth, w[i])));
        }
        if (object.userData.smooth)
        {
          path.data.smooth();
        }
        
      }
      else
      {
        path.visible = 0;
      }


    }
    else    // open path
    {
      if (path == null)
      {
        var path = newPath(num);
        path.name = '_'+object.id;
//        path.strokeColor = 'red';
//        path.strokeWidth = 2;

        path.removeChildren();
        area = newPath(2*num);
        area.fillColor = threeColor(object.material.color);
        area.strokeWidth = 1;
        area.closed = 1;
  
        path.data = area;
        getPaperGroup(object).addChild(path);
        getPaperGroup(object).addChild(area);
      }

      if (object.visible)
      {
        path.data.visible = 1;
        var w = [];
        // project the vertices and build the skeleton
        for (var i=0;i<num;i++)
        {
          var pos = projectVertex(object.geometry.vertices[i], matrix);
          var pt = new Point(pos.x, pos.y);
          w[i] = pos.w;
          path.segments[i].point = pt;
        }

        for (var i=0;i<num;i++)
        {
          var pt = path.segments[i].point;
          if (i<num-1)
          {
            var normal = path.curves[i].getNormalAt(0);
          }
          else
          {
            var normal = path.curves[i-1].getNormalAt(0);
          }

          path.data.segments[i].point = pt.add(normal.multiply(lineWidth(object.material.linewidth, w[i])));
          path.data.segments[2*num-i-1].point = pt.add(normal.multiply(-lineWidth(object.material.linewidth, w[i])));
        }
        if (object.userData.smooth)
        {
          path.data.smooth();
        }
      }
      else
      {
        path.data.visible = 0;     
      }
    }
  }


 
  // render multiLine as a single Paper path
  function renderLine( object, matrix)
  {
    if (object.userData.vLine == true)
    {
      renderVline(object,matrix);
      return;
    }
    // If the object is not yet in our list, add it, otherwise just modify it
    var path = getPaperObject(object);
    if (path == null)
    {
      path = newPath(object.geometry.vertices.length);
      path.name = '_'+object.id;
      path.strokeColor = threeColor(object.material.color);
      path.strokeWidth = object.material.linewidth;
      getPaperGroup(object).addChild(path);
    }
    if (object.userData.closed)
        path.closed = true;

    // project vertices and update screen
    if (object.visible)
    {
      path.visible = 1;
      for (var i in object.geometry.vertices)
      {
        var pos = projectVertex(object.geometry.vertices[i], matrix);
        path.segments[i].point = pos;
        path.segments[i].point.data = pos.z;
      }
      if (object.userData.smooth)
        path.smooth();
    }
    else
      path.visible = 0;
  }
  function showIntersections(path1, path2, g) 
  {
      var intersections = path1.getIntersections(path2);  // array of CurveLocation objects
      for (var i = 0; i < intersections.length; i++) 
      {
          var cl1 = intersections[i];
          var ndx1 = cl1.index;
          // find segment from path1 containing intersection
          var t1 = path1.curves[ndx1].getTimeOf(intersections[i].point);
          var za = path1.curves[ndx1].point1.data;
          var zb = path1.curves[ndx1].point2.data;
          var z1 = za + (zb - za) * t1;

          // find segment from path2 containing intersection
          var cl2 = path2.getLocationOf(intersections[i].point);
          if (! cl2)
            return;
          var ndx2 = cl2.index;
          var t2 = path2.curves[ndx2].getTimeOf(intersections[i].point);
          var zc = path2.curves[ndx2].point1.data;
          var zd = path2.curves[ndx2].point2.data;
          var z2 = zc + (zd - zc) * t2;


          // erase intersection with a white dot
           var pt = intersections[i].point;
           var dot = new Path.Circle({
                center: pt,
                radius: 4,
                fillColor: background.fillColor
            });
          g.addChild(dot);

          // redraw the closest line  
          if (z1<z2)
          {
            var pt1 = new Point (pt.subtract((cl1.tangent).multiply(4)));
            var pt2 = new Point (pt.add((cl1.tangent).multiply(4)));
            var inter = new Path.Line({
                from: pt1,
                to: pt2,
                strokeColor: path1.strokeColor,
                strokeWidth: path1.strokeWidth
            });
          }
          else
          {
            var pt1 = new Point (pt.subtract((cl2.tangent).multiply(4)));
            var pt2 = new Point (pt.add((cl2.tangent).multiply(4)));
            var inter = new Path.Line({
                from: pt1,
                to: pt2,
                strokeColor: path2.strokeColor,
                strokeWidth: path2.strokeWidth
            });
          }
          g.addChild(inter);
        }

  }


  function renderFace3( v1, v2, v3, element, material )
  {
  
  }

};
