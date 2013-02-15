/**
*  Provides the most basic forms of routes
*
*  @module routes
*/
var fs = require('fs'),
    Map = require('./projector'),
    Projector = require('./projector');


/**
*  Creates a route map tiles. Supports two different kinds of routes. 
*
*  Examples:
* 
*     The URL structure should be something like: 
*     /:zoom/:col/:row.png 
*
*  @param {Object} options  The options parameters needs to have options.map defined.
*  @return {Circle} The new Circle object.
*  @api public
*/
module.exports.tilePng = function tilePng(options){
  var options = options || {},
      map = options.map;
      
  if (!options.map) {
    throw new Error("You must set options.map equal to your map");
  }
  
  return function tilePng(req, res, next){
    var tileCoordinate, bounds;
    // verify arguments
    tileCoordinate = req.path.match(/(\d+)\/(\d+)\/(\d+)\.png$/);
    if (!tileCoordinate) {
      return next();
    }
    // slice the regexp down to usable size      
    tileCoordinate = tileCoordinate.slice(1,4).map(Number);
  
    // set the bounds and render
    bounds = Projector.util.tileToMeters(tileCoordinate[1], tileCoordinate[2], tileCoordinate[0]);
    map.render({
      bounds: {minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3]},
      width: 256,
      height: 256,
      zoom: tileCoordinate[0],
      callback: function(err, canvas) {
        // TODO: catche the error
        var stream = canvas.createPNGStream();
        stream.pipe(res);
      }
    });
  };
};


/**
*  Creates a route for UTFGrid.  Supports two different kinds of routes. 
*
*  Examples:
* 
*     The URL structure should be something like: 
*     /:zoom/:col/:row.png routing
*     /:zoom/:col/:row.jsonp routing
*
*  @param {Object} options  The options parameters needs to have options.map defined.
*  @api public
*/
module.exports.utfGrid = function utfGrid(options){
  var options = options || {},
      map = options.map,
      format;
      
  if (!options.map) {
    throw new Error("You must set options.map equal to your map");
  }
  
  
  return function tilePng(req, res, next){
    var tileCoordinate, format, bounds;
    
    // verify arguments (don't forget jsonp!)
    tileCoordinate = req.path.match(/(\d+)\/(\d+)\/(\d+)\.(png|json|jsonp)$/);
    if (!tileCoordinate) {
      return next();
    }

    // slice the regexp down to usable size 
    console.log(tileCoordinate[4]);
    format = tileCoordinate[4];     
    tileCoordinate = tileCoordinate.slice(1,4).map(Number);
 
    // Show the rasterized utfgrid for debugging 
    respondWithImage = format === 'png';
    if (respondWithImage) {
      renderHandler = function(err, canvas) {
        var stream = canvas.createPNGStream();
        stream.pipe(res);
      };
    }
    else {
      renderHandler = function(err, grid) {
        res.jsonp(grid);
      };
    }
    bounds = Projector.util.tileToMeters(tileCoordinate[1], tileCoordinate[2], tileCoordinate[0], 64);
    map.renderGrid({
      bounds: {minX: bounds[0], minY: bounds[1], maxX: bounds[2], maxY: bounds[3]},
      width: 64,
      height: 64,
      zoom: tileCoordinate[0],
      drawImage: respondWithImage,
      callback: renderHandler
    }); 
  };
};



/**
*  Creates a route for tilejson file 
*
*  Examples:
* 
*     The URL structure should be something like: 
*     :options.path
*
*  @param {Object} options  The options parameters needs to have options.path defined.
*  @api public
*/
module.exports.tileJson = function tileJson(options) {
  var options = options || {},
      path = options.path;
    
  if (!options.path) {
    throw new Error("You must set options.path to point to your tile.json file");
  }

  return function tileJson(req, res, next){
    fs.readFile(path, 'utf8', function(err, file){
      if (err) return next(err);
      var tileJson;
      
      // don't let JSON.parse barf all over everything
      try {
        tileJson = JSON.parse(file);
      }
      catch(err) {
        return next(err);
      }
      
      return res.jsonp(tileJson);
    });
  }
};