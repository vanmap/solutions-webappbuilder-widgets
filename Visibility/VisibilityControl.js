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
///////////////////////////////////////////////////////////////////////////

/*global define*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dojo/on',
    'dojo/topic',
    'dojo/dom-attr',
    'dojo/dom',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./VisibilityControl.html',

    './jquery.knob.min',
    './RangeSlider/nouislider.min',
    'jimu/dijit/Message',
    'jimu/dijit/DrawBox',

    'esri/map',
    'esri/layers/GraphicsLayer',
    'esri/tasks/Geoprocessor',
    'esri/tasks/FeatureSet',
    'esri/tasks/LinearUnit',
    'esri/graphicsUtils',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/config',
    'esri/Color',
    'esri/symbols/jsonUtils',

    'dijit/form/HorizontalSlider', 
    'dijit/form/HorizontalRule', 
    'dijit/form/HorizontalRuleLabels',
    'dijit/form/VerticalSlider',
    'dijit/form/VerticalRule',
    'dijit/form/VerticalRuleLabels'   

], function (
    dojoDeclare,
    dojoLang,
    dojoDomStyle,
    dojoOn,
    dojoTopic,
    dojoDomAttr,
    dojoDom,
    dijitWidgetBase,
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    vistemplate,
    knob,
    noUiSlider,
    Message,
    DrawBox,
    Map, 
    GraphicsLayer, 
    Geoprocessor, 
    FeatureSet, 
    LinearUnit, 
    graphicsUtils,
    SimpleFillSymbol, 
    SimpleLineSymbol, 
    SimpleMarkerSymbol, 
    esriConfig, 
    Color, 
    jsonUtils        
) {
    'use strict';
    return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
        templateString: vistemplate,
        baseClass: 'jimu-widget-visibility-control',
        FOV: 180,
        LA: 180,
        viewshedService: null,
        map: null,
        gp: null,
        drawBox: null,

        constructor: function(args) {
            dojoDeclare.safeMixin(this, args);
        },

        postCreate: function () {              
            this._initDrawBox();
            this._initEvents();  
            this._initGL();
        },      

        startup: function(){
            var updateValues = dojoLang.hitch(this,function(a,b) {this.LA = a;this.FOV = b});
              $("input.fov").knob({
                'min':0,
                'max':360,
                'cursor':90,
                'inputColor': '#ccc',
                'width': 170,
                'height': 170,
                'draw': function(){updateValues(this.v,this.o.cursor)}
              });

            this.gp = new Geoprocessor(this.viewshedService.url);
            this.gp.setOutputSpatialReference({wkid: 102100});

            var distanceSlider = dojoDom.byId('distanceSlider');
            if (distanceSlider) {
              noUiSlider.create(distanceSlider, {
                start: [3, 5],
                behaviour: 'drag',
                step: 0.5,
                connect: true,
                range: {
                  'min': 0,
                  'max': 10
                },
                pips: {
                mode: 'count',
                values: 3,
                density: 10
                }
              });
            }

            var obsHeightSlider = dojoDom.byId('obsHeightSlider');
            if (obsHeightSlider) {
              noUiSlider.create(obsHeightSlider, {
                start: 2,
                step: 1,
                orientation: 'vertical',
                direction: 'rtl', //put 0 to bottom
                range: {
                  'min': 0,
                  'max': 20
                },
                pips: {
                mode: 'count',
                values: 5,
                density: 5
                }
              });
            }
        },

        _initDrawBox: function() {
            try {
              this.drawBox = new DrawBox({
                map: this.map,
                showClear: false,
                keepOneGraphic: true,
                deactivateAfterDrawing: true,
                geoTypes: ['POINT']
              });              
              this.drawBox.setMap(this.map);
              var symbol = new SimpleMarkerSymbol({
                "color": [255,0,0,64],
                "size": 12,
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "outline": {
                  "color": [0,0,0,255],
                  "width": 1,
                  "type": "esriSLS",
                  "style": "esriSLSSolid"
                }
              });
              this.drawBox.setPointSymbol(symbol); 
              this.drawBox.placeAt(this.drawBoxContainer);
            } catch(error) {
              console.log(error);
            }        
        },

        _initEvents: function() {
            if (this.btnClear) {
              this.own(dojoOn(this.btnClear, "click", dojoLang.hitch(this, this.onClearBtnClicked)));
            }
            if (this.drawBox) {
              this.own(dojoOn(this.drawBox, "icon-selected", dojoLang.hitch(this, function(){
                  this.drawBox.clear();
                })));
              this.own(dojoOn(this.drawBox, 'DrawEnd', dojoLang.hitch(this, function (graphic) {
                  graphic.name = "remove_me";
                  var featureSet = new FeatureSet();
                  featureSet.features = [graphic];

                  var params = {
                    "Input_Observer": featureSet,
                    "Near_Distance__RADIUS1_": parseInt((dojoDom.byId("distanceSlider").noUiSlider.get()[0])*1000),
                    "Maximum_Distance__RADIUS2_": parseInt((dojoDom.byId("distanceSlider").noUiSlider.get()[1])*1000),
                    "Observer_Offset__OFFSETA_": parseInt(dojoDom.byId("obsHeightSlider").noUiSlider.get())
                  };              

                  this.viewshed(params);
                })));        
            }
        },

        _initGL: function () {        
            this.graphicsLayer = new GraphicsLayer(),
            this.graphicsLayer.name = "Viewshed Layer";
            this.map.addLayer(this.graphicsLayer);
        },

        viewshed: function (gpParams) { 
            this.map.setMapCursor("wait");

            if (!this.isNumeric(gpParams["Left_Azimuth__AZIMUTH1_"]) && !this.isNumeric(gpParams["Right_Azimuth__AZIMUTH2_"])) {
              var Azimuth1 = parseInt(this.LA - (this.FOV / 2));
              if(Azimuth1 < 0)
              {
                  Azimuth1 = Azimuth1 + 360;
              }
              var Azimuth2 = parseInt(this.LA + (this.FOV / 2));
              if(Azimuth2 > 360)
              {
                  Azimuth2 = Azimuth2 - 360;
              }
              if(this.FOV == 360)
              {
                  Azimuth1 = 0;
                  Azimuth2 = 360;
              }
              gpParams["Left_Azimuth__AZIMUTH1_"] = Azimuth1;
              gpParams["Right_Azimuth__AZIMUTH2_"] = Azimuth2;
            }
            this.gp.execute(gpParams, dojoLang.hitch(this, this.drawViewshed), dojoLang.hitch(this, this.gpError));
        },

        drawViewshed: function (results, messages) {         
            var visibleArea = new SimpleFillSymbol();
                visibleArea.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0]), 1));
                visibleArea.setColor(new Color([0, 255, 0, 0.5]));
            var notVisibleArea = new SimpleFillSymbol();
                notVisibleArea.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 0]), 1));
                notVisibleArea.setColor(new Color([255, 0, 0, 0.5]));
            var viewshed = results[0].value.features;
            for (var w = 0, wl = viewshed.length; w < wl; w++) {
              var feature = viewshed[w];
              if(feature.attributes.gridcode != 0)
              {
                feature.setSymbol(visibleArea);
                this.graphicsLayer.add(feature);
              }
              else
              {
                feature.setSymbol(notVisibleArea);
                this.graphicsLayer.add(feature);
              }            
            }     
            var fullWedge = new SimpleFillSymbol();
                fullWedge.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([0, 0, 0, 1]), 1));
                fullWedge.setColor(new Color([0, 0, 0, 0]));
                var fullWedgeGraphics = results[2].value.features;
            for (var w = 0, wl = fullWedgeGraphics.length; w < wl; w++) {
              var feature = fullWedgeGraphics[w];
              feature.setSymbol(fullWedge);
              this.graphicsLayer.add(feature);
            }
            var wedge = new SimpleFillSymbol();
                wedge.setOutline(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 1]), 1));
                wedge.setColor(new Color([0, 0, 0, 0]));
            var wedgeGraphics = results[1].value.features;
            for (var w = 0, wl = wedgeGraphics.length; w < wl; w++) {
              var feature = wedgeGraphics[w];
              feature.setSymbol(wedge);
              this.graphicsLayer.add(feature);
            }

            this.map.setExtent(graphicsUtils.graphicsExtent(this.graphicsLayer.graphics), true);
            this.map.setMapCursor("default");
        },

        gpError: function () {
            var alertMessage = new Message({
                          message: 'An error occured whilst creating visibility. Please ensure your observer location falls within the extent of your elevation surface.</p>'
                        });
            this.map.setMapCursor("default");
            this.drawBox.clear();      
        },   

        onClearBtnClicked: function () {
            this.graphicsLayer.clear();  
            this.drawBox.clear();   
        },

        isNumeric: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }           
    });
});