///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/connect',
  'dojo/has',
  'dojo/on',
  'dojo/_base/lang',
  'dojo/topic',
  'esri/geometry/Point',
  'esri/geometry/Polyline',
  'esri/geometry/Polygon',
  'esri/geometry/geometryEngine',
  'esri/geometry/geodesicUtils',
  'esri/units',
  'esri/symbols/SimpleMarkerSymbol', 
  'esri/Color',
  'esri/graphic',
  'esri/geometry/webMercatorUtils',
  './Feedback',
  '../util'
], function (
  dojoDeclare,
  dojoConnect,
  dojoHas,
  dojoOn,
  dojoLang,
  dojoTopic,
  EsriPoint,
  EsriPolyLine,
  EsriPolygon,
  esriGeometryEngine,
  geodesicUtils,
  Units,
  SimpleMarkerSymbol, 
  Color,
  EsriGraphic,
  EsriWebMercatorUtils,
  drawFeedback,
  Utils
) {
    var clz = dojoDeclare([drawFeedback], {
        orientationAngle: null,
        majorAxisLength: [],
        minorAxisLength: [],
        
        /*
         * Class Constructor
         */
        constructor: function () {
            this._utils = new Utils();
            this.syncEvents();
            this._majGraphic = new EsriGraphic();
            this._minGraphic = new EsriGraphic();
         },

        /*

        */
        syncEvents: function () {
            dojoTopic.subscribe(
                'manual-ellipse-major-axis-input',
                dojoLang.hitch(this, this.onMajorAxisManualInputHandler)
            );

            dojoTopic.subscribe(
                'manual-ellipse-minor-axis-input',
                dojoLang.hitch(this, this.onMinorAxisManualInputHandler)
            );

            dojoTopic.subscribe(
                'manual-ellipse-orientation-angle-input',
                dojoLang.hitch(this, this.onOrientationAngleManualInputHandler)
            );

            dojoTopic.subscribe(
                'manual-ellipse-center-point-input',
                dojoLang.hitch(this, this.onCenterPointManualInputHandler)
            );
        },

        /*
        Handler for major axis manual input
        */
        onMajorAxisManualInputHandler: function (majorLength) {
            if (majorLength === "") {
                return;
            }
            var map = this.map;
            //Check if we have a center point
            var centerPoint = this._points[0];
            if (centerPoint.spatialReference.wkid === 4326) {
                centerPoint = EsriWebMercatorUtils.geographicToWebMercator(centerPoint);
            }
            if (this._points.length >= 1) {
                //Convert to meters
                var lengthInMeters = this._utils.convertToMeters(Number(majorLength), this.lengthUnit);
                //We do have a center point. Get the end point
                var endPoint = this.getEndPoint(centerPoint, 1, lengthInMeters);
                //Add major length point to array
                this._points.splice(1, 0, endPoint);
                //Clear major length graphic first
                if (this._majGraphic) {
                    map.graphics.remove(this._majGraphic);
                }
                // create and add our major graphic
                var majorLine = new EsriPolyLine({
                    paths: [[
                      [centerPoint.x, centerPoint.y],
                      [endPoint.x, endPoint.y]]
                    ],
                    spatialReference: this.map.spatialReference
                });

                this._majGraphic = new EsriGraphic(majorLine, this.lineSymbol);
                map.graphics.add(this._majGraphic);
            }
        },

        /*
        Handler for minor axis manual input
        */
        onMinorAxisManualInputHandler: function (minorLength) {
            if (minorLength === "") {
                return;
            }
            var map = this.map;
            //Check if we have a center point
            var centerPoint = this._points[0];
            if (centerPoint.spatialReference.wkid === 4326) {
                centerPoint = EsriWebMercatorUtils.geographicToWebMercator(centerPoint);
            }
            if (this._points.length >= 2) {
                //Convert to meters
                var lengthInMeters = this._utils.convertToMeters(Number(minorLength), this.lengthUnit);
                //We do have a center point. Get the end point
                var endPoint = this.getEndPoint(centerPoint, 90, lengthInMeters);
                //Add major length point to array
                this._points.splice(2, 0, endPoint);
                //Clear major length graphic first
                if (this._minGraphic) {
                    map.graphics.remove(this._minGraphic);
                }
                // create and add our minor graphic
                var minorLine = new EsriPolyLine({
                    paths: [[
                      [centerPoint.x, centerPoint.y],
                      [endPoint.x, endPoint.y]]
                    ],
                    spatialReference: this.map.spatialReference
                });

                this._minGraphic = new EsriGraphic(minorLine, this.lineSymbol);
                map.graphics.add(this._minGraphic);
            }
        },

        /*
        Handler for orientation angle manual input
        */
        onOrientationAngleManualInputHandler: function (orientationAngle) {
            this.orientationAngle = Number(orientationAngle);
            //Check if we have a center, major and minor points
            if (this._points.length >= 3) {
                this._onDoubleClickHandler();
            }
        },

        /*
        Handler for the manual input of a center point
        */
        onCenterPointManualInputHandler: function (centerPoint) {
            this._points = [];
            this._points.push(centerPoint.offset(0, 0));
            this.set('startPoint', this._points[0]);
        },

        /*
        Retrieves the end point of a line given a start point and length
        */
        getEndPoint: function (startPoint, angle, distance) {
            var rotation = angle ? angle : 1;
            var result = {};
            result.x = Math.round(Math.cos(rotation * Math.PI / 180) * distance + startPoint.x);
            result.y = Math.round(Math.sin(rotation * Math.PI / 180) * distance + startPoint.y);
            return new EsriPoint({
                x: result.x,
                y: result.y,
                spatialReference: {
                    wkid: startPoint.spatialReference.wkid
                }
            });
        },

        /*
         *
         */
        _onClickHandler: function (evt) {
            var snapPoint;
            if (this.map.snappingManager) {
                snapPoint = this.map.snappingManager._snappingPoint;
            }

            var start = snapPoint || evt.mapPoint;
            this._points.push(start.offset(0, 0));
            
            switch(this._points.length)
            {
                case 1:
                    // create and add our major / minor graphics
                    var maxLine = new EsriPolyLine({
                        paths: [[
                          [start.x, start.y],
                          [start.x, start.y]]
                        ], spatialReference: this.map.spatialReference
                    });
                    
                    var minLine = new EsriPolyLine({
                        paths: [[
                          [start.x, start.y],
                          [start.x, start.y]]
                        ], spatialReference: this.map.spatialReference
                    });
                                        
                    this._majGraphic = new EsriGraphic(maxLine, this.lineSymbol);
                    this._minGraphic = new EsriGraphic(minLine, this.lineSymbol);
                    this.map.graphics.add(this._majGraphic);
                    this.map.graphics.add(this._minGraphic);
                    
                    // connect the mouse move event
                    this._onMouseMoveHandlerConnect = dojoConnect.connect(
                        this.map,
                        'onMouseMove',
                        this._onMouseMoveHandler
                    );
                    
                    // connect a double click event to handle user double clicking
                    this._onDoubleClickHandler_connect = dojoConnect.connect(this.map, 'onDblClick', dojoLang.hitch(this, this._onDoubleClickHandler));
                                        
                    var tooltip = this._tooltip;
                    if (tooltip) {
                        tooltip.innerHTML = 'Click length of major axis';
                    }
                    break;
                    
                case 2:
                    var tooltip = this._tooltip;
                    if (tooltip) {
                        tooltip.innerHTML = 'Move mouse back to start position to set minor axis & finish drawing ellipse';
                    }
                    break;
                    
                case 3:
                    this._onDoubleClickHandler();
                    break;              
            }            
        },

        /*
         *
         */
        _onMouseMoveHandler: function (evt) {            

            var snapPoint;
            if (this.map.snappingManager) {
                snapPoint = this.map.snappingManager._snappingPoint;
            }

            var end = snapPoint || evt.mapPoint;
            
            if (this._points.length === 1) {
                this._majGraphic.geometry.setPoint(0, 1, end);
                this._majGraphic.setGeometry(this._majGraphic.geometry).setSymbol(this.lineSymbol);                
                this.majorAxisLength = esriGeometryEngine.geodesicLength(this._majGraphic.geometry, 9001);          
                var majorUnitLength = this._utils.convertMetersToUnits(this.majorAxisLength, this.lengthUnit);
                dojoTopic.publish('DD_ELLIPSE_MAJOR_LENGTH_CHANGE', majorUnitLength);

            } else {
                if (this._minGraphic !== null){
                  var prevgeom = dojoLang.clone(this._minGraphic.geometry);
                  
                  var nearest = esriGeometryEngine.nearestCoordinate(this._majGraphic.geometry, end)
                  var nearestGraphic =  new EsriPoint(nearest.coordinate.x, nearest.coordinate.y,102100);
                  
                  this._minGraphic.geometry.setPoint(0, 1, nearestGraphic);
                  this._minGraphic.geometry = esriGeometryEngine.rotate(this._minGraphic.geometry,-90,this._points[0]);                  
                  this._minGraphic.setGeometry(this._minGraphic.geometry).setSymbol(this.lineSymbol);
                  
                  var minGraphicGeo = EsriWebMercatorUtils.webMercatorToGeographic(this._minGraphic.geometry);
                  this.minorAxisLength = geodesicUtils.geodesicLengths([minGraphicGeo], Units.METERS);
                  
                  var minorUnitLength = this._utils.convertMetersToUnits(this.minorAxisLength[0], this.lengthUnit);
                  
                  if (this.minorAxisLength[0] > this.majorAxisLength || this.minorAxisLength[0] == 0) {
                    this._minGraphic.setGeometry(prevgeom);
                    return; 
                  }
                  dojoTopic.publish('DD_ELLIPSE_MINOR_LENGTH_CHANGE', minorUnitLength);
                }                
            }
        },

        /*
        Gets length of line based on two points
        */
        getLineLength: function (x, y, x0, y0) {
            return Math.sqrt((x -= x0) * x + (y -= y0) * y);
        },

        /*
        Gets angle based on two points
        */
        getAngle: function (pointA, pointB) {
            var deltaX = pointB.y - pointA.y;
            var deltaY = pointB.x - pointA.x;
            var azi = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            return ((azi + 360) % 360);
        },

        /*
        Convert normal angle to esri angle so geometryEngine
        can rotate accordingly
        */
        convertAngle: function (angle) {
            if (0 <= angle && angle < 90) {
                return 90 - angle;
            }
            if (90 <= angle && angle < 180) {
                return (180 - angle) + 270;
            }
            if (180 <= angle && angle < 270) {
                return (angle - 180) + 270;
            }
            if (270 <= angle && angle < 360) {
                return 180 - (angle - 270);
            }
            return angle;
        },

        /*
         *
         */
        _onDoubleClickHandler: function (evt) {
            
            if (this._points.length >= 3)  {
              
              var elipseGeom = new EsriPolygon(this.map.spatialReference);
 
              var centerScreen = this.map.toScreen(this._majGraphic.geometry.getPoint(0,0));
              var majorScreen = this.map.toScreen(this._majGraphic.geometry.getPoint(0,1));
              var minorScreen = this.map.toScreen(this._minGraphic.geometry.getPoint(0,1));

              var majorRadius = this.getLineLength(centerScreen.x, centerScreen.y, majorScreen.x, majorScreen.y);
              var minorRadius = this.getLineLength(centerScreen.x, centerScreen.y, minorScreen.x, minorScreen.y);

              var angleDegrees = this.getAngle(
                EsriWebMercatorUtils.webMercatorToGeographic(this._points[0]),
                EsriWebMercatorUtils.webMercatorToGeographic(this._points[1])
              );

              var ellipseParams = {
                  center: centerScreen,
                  longAxis: majorRadius,
                  shortAxis: minorRadius,
                  numberOfPoints: 60,
                  map: this.map
              };

              var ellipse = EsriPolygon.createEllipse(ellipseParams);
              
              //var ellipse = this._createEllipse(ellipseParams);
              
              elipseGeom.geometry = esriGeometryEngine.rotate(ellipse,
                  this.convertAngle(angleDegrees),this._majGraphic.geometry.getPoint(0,0));

              elipseGeom = dojoLang.mixin(elipseGeom, {
                  majorAxisLength: this._utils.convertMetersToUnits(this.majorAxisLength, this.lengthUnit),
                  minorAxisLength: this._utils.convertMetersToUnits(this.minorAxisLength, this.lengthUnit),
                  angle: this.orientationAngle !== null ?
                      this.orientationAngle.toFixed(2) : angleDegrees.toFixed(2),
                  drawType: 'ellipse',
                  center: this._points[0]
              });
            }
            
            dojoConnect.disconnect(this._onMouseMoveHandlerConnect);
            this._setTooltipMessage(0);
            this._drawEnd(elipseGeom);
            this.map.graphics.clear();
            //this.map.graphics.remove(this._minGraphic);
            this._majGraphic = null;
            this._minGraphic = null;
            majorAxisLength = [];
            minorAxisLength = [];
            this.orientationAngle = null;
            this._clear();
        },
        
        _createEllipse: function(params) {
          var dx = params.center.x,
              dy = params.center.y,
              a = params.longAxis,
              b = params.shortAxis,
              numberOfPoints = params.numberOfPoints,
              map = params.map,
              pt, i, cosZeta, sinZeta, ellipse,
              path = [],
              angle = (2*Math.PI)/numberOfPoints;
          for (i = 0; i < numberOfPoints; i++) {
            cosZeta = Math.cos(i*angle);
            sinZeta = Math.sin(i*angle);      
            pt = map.toMap({x:a*cosZeta + dx, y:b*sinZeta + dy});
            path.push(pt);
          }
          path.push(path[0]);
          ellipse = new EsriPolygon(map.spatialReference);
          ellipse.addRing(path);
          return ellipse;
        }

    });
    clz.DD_ELLIPSE_MAJOR_LENGTH_CHANGE = 'DD_ELLIPSE_MAJOR_LENGTH_CHANGE';
    clz.DD_ELLIPSE_MINOR_LENGTH_CHANGE = 'DD_ELLIPSE_MINOR_LENGTH_CHANGE';
    return clz;
});
