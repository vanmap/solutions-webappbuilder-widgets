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
    'dojo/on',
    'dojo/keys',
    'dojo/string',
    'dojo/topic',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/mouse',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/TooltipDialog',
    'dijit/popup',
    'dojo/text!../templates/VisibilityControl.html',

    './jquery.knob.min',
    'jimu/dijit/Message',
    './DrawFeedBack',
    

    'esri/map',
    'esri/toolbars/draw',
    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'esri/tasks/Geoprocessor',
    'esri/tasks/FeatureSet',
    'esri/graphicsUtils',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/Color',
    './CoordinateInput',
    './EditOutputCoordinate'
    
], function (
    dojoDeclare,
    dojoLang,
    dojoOn,
    dojoKeys,
    dojoString,
    dojoTopic,
    dojoDom,
    dojoDomClass,
    dojoMouse,
    dijitWidgetBase,
    dijitTemplatedMixin,    
    dijitWidgetsInTemplate,
    dijitTooltipDialog,
    DijitPopup,
    vistemplate,
    knob,
    Message,
    DrawFeedBack,
    Map,
    Draw,
    Graphic,
    GraphicsLayer, 
    Geoprocessor, 
    FeatureSet, 
    graphicsUtils,
    SimpleFillSymbol, 
    SimpleLineSymbol, 
    SimpleMarkerSymbol, 
    Color, 
    CoordInput,
    EditOutputCoordinate   
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

        constructor: function(args) {
            dojoDeclare.safeMixin(this, args);
        },

        postCreate: function () {
            this._ptSym = new SimpleMarkerSymbol(this.pointSymbol);          
            this._initGL();            
            this.distanceUnit = this.distanceUnitDD.get('value');
            this.observerHeightUnit = this.observerHeightDD.get('value');
            this.coordTool = new CoordInput({appConfig: this.appConfig}, this.observerCoords);      
            this.coordTool.inputCoordinate.formatType = 'DD';
            this.coordinateFormat = new dijitTooltipDialog({
              content: new EditOutputCoordinate(),
              style: 'width: 400px'
            });
            
            // add extended toolbar
            this.dt = new DrawFeedBack(this.map,this.coordTool.inputCoordinate.util);
            this._syncEvents(); 
        },      

        startup: function(){
            var updateValues = dojoLang.hitch(this,function(a,b,c) {
              this.angleUnits.checked?this.LA = a/17.777777777778:this.LA = a;
              this.FOV = Math.round(b);
              this.angleUnits.checked?this.tooltip.innerHTML  = c + " mils":this.tooltip.innerHTML  = c + " degrees";              
            });
              $("input.fov").knob({
                'min':0,
                'max':360,
                'cursor':0,
                'inputColor': '#ccc',
                'width': 160,
                'height': 160,
                'draw': function(){updateValues(this.v,this.o.cursor,this.cv)}
              });

            this.gp = new Geoprocessor(this.viewshedService.url);
            this.gp.setOutputSpatialReference({wkid: 102100});
        },

        

        _syncEvents: function() {
          
            this.coordTool.inputCoordinate.watch('outputString', dojoLang.hitch(this, function (r, ov, nv) {
              if(!this.coordTool.manualInput){this.coordTool.set('value', nv);}
            }));
            
            this.dt.watch('startPoint' , dojoLang.hitch(this, function (r, ov, nv) {
                this.coordTool.inputCoordinate.set('coordinateEsriGeometry', nv);
                this.dt.addStartGraphic(nv, this._ptSym);
              }));

            this.own(           
            
              dojoOn(this.coordTool, 'keyup',dojoLang.hitch(this, this.coordToolKeyWasPressed)),
              
              this.dt.on('draw-complete',dojoLang.hitch(this, this.feedbackDidComplete)),
              
              dojoOn(this.coordinateFormatButton, 'click',dojoLang.hitch(this, this.coordinateFormatButtonWasClicked)),
              
              dojoOn(this.addPointBtn, 'click',dojoLang.hitch(this, this.pointButtonWasClicked)),
              
              dojoOn(this.btnCreate, 'click',dojoLang.hitch(this, this.createButtonWasClicked)),
              
              dojoOn(this.btnClear, "click", dojoLang.hitch(this, this.onClearBtnClicked)),
              
              dojoOn(this.minObsRange,'keyup', dojoLang.hitch(this, this.minObsRangeKeyWasPressed)),
              
              dojoOn(this.FOVInput,'mousemove', dojoLang.hitch(this, this.mouseMoveOverFOVInput)),
              
              dojoOn(this.FOVInput,dojoMouse.leave, dojoLang.hitch(this, this.mouseMoveOutFOVInput)),
              
              dojoOn(this.FOVGroup,dojoMouse.leave, dojoLang.hitch(this, function(){this.tooltip.hidden = true;})),
              
              dojoOn(this.FOVGroup,dojoMouse.enter, dojoLang.hitch(this, this.mouseMoveOverFOVGroup)),
              
              dojoOn(this.FOVInput,dojoMouse.enter, dojoLang.hitch(this, function(){this.tooltip.hidden = true;})),
              
              this.angleUnits.on('change',dojoLang.hitch(this, this.angleUnitsDidChange)),
              
              
              
              this.observerHeightDD.on('change',dojoLang.hitch(this, this.distanceUnitDDDidChange)),
              
              this.distanceUnitDD.on('change',dojoLang.hitch(this, this.distanceUnitDDDidChange)),
              
              dojoOn(this.coordinateFormat.content.applyButton, 'click', dojoLang.hitch(this, function () {
                var fs = this.coordinateFormat.content.formats[this.coordinateFormat.content.ct];
                var cfs = fs.defaultFormat;
                var fv = this.coordinateFormat.content.frmtSelect.get('value');
                if (fs.useCustom) {
                    cfs = fs.customFormat;
                }
                this.coordTool.inputCoordinate.set(
                  'formatPrefix',
                  this.coordinateFormat.content.addSignChkBox.checked
                );
                this.coordTool.inputCoordinate.set('formatString', cfs);
                this.coordTool.inputCoordinate.set('formatType', fv);
                this.setCoordLabel(fv);
                DijitPopup.close(this.coordinateFormat);                
              })),
              
              dojoOn(this.coordinateFormat.content.cancelButton, 'click', dojoLang.hitch(this, function () {
                DijitPopup.close(this.coordinateFormat);
              }))
            );
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
        
        /*
         * catch key press in start point
         */
        coordToolKeyWasPressed: function (evt) {
          this.coordTool.manualInput = true;
          if (evt.keyCode === dojoKeys.ENTER) {
            this.coordTool.inputCoordinate.getInputType().then(dojoLang.hitch(this, function (r) {
              if(r.inputType == "UNKNOWN"){
                var alertMessage = new Message({
                  message: 'Unable to determine input coordinate type please check your input.'
                });
              } else {
                dojoTopic.publish(
                  'visibility-observer-point-input',
                  this.coordTool.inputCoordinate.coordinateEsriGeometry
                );
                this.setCoordLabel(r.inputType);
                var fs = this.coordinateFormat.content.formats[r.inputType];
                this.coordTool.inputCoordinate.set('formatString', fs.defaultFormat);
                this.coordTool.inputCoordinate.set('formatType', r.inputType);
                this.dt.addStartGraphic(r.coordinateEsriGeometry, this._ptSym);
                this.enableFOVDial();
              }
            }));
          }
        },
        
        /*
         * catch key press in min obs range, if valid, set max obs range min value accordingly
         */
        minObsRangeKeyWasPressed: function (evt) {
          if(this.minObsRange.isValid())
          {
            this.maxObsRange.constraints.min = Number(this.minObsRange.displayedValue) + 0.001;
            this.maxObsRange.set('value',Number(this.minObsRange.displayedValue) + 1);            
          }
        },
        
        
        /*
         * 
         */
        mouseMoveOverFOVGroup: function (evt) {
          if(this.FOVInput.disabled == false) {             
            this.tooltip.hidden = false;
          }          
        },
        
        /*
         * 
         */
        mouseMoveOverFOVInput: function (evt) {
          if(this.FOVInput.disabled == false)
          {
            $(document).ready(function(){
                  $(document).mousemove(function(e){
                     var cpos = { top: e.pageY + 10, left: e.pageX + 10 };
                     $('#tooltip').offset(cpos);
                  });
                });
          }            
        },
        
        /*
         * 
         */
        mouseMoveOutFOVInput: function (evt) {
          this.tooltip.hidden = false;
          this.FOVInput.blur();
        },
        
        /*
         *
         */
        angleUnitsDidChange: function () {
          $("input.fov").val(0).trigger('change');
          if(this.angleUnits.checked) {
            $("input.fov").trigger('configure',
              {
                  "max": 6400,
                  "units": 'mils',
                  "v": 0,
                  "units": 'mils',
                  "milsValue": 0,
                  "inputColor":"#f37371" 
              }
            ); 
          } else {
            $("input.fov").trigger('configure',
              {
                  "max": 360,
                  "units": 'degrees',
                  "v": 0,
                  "units": 'degrees',
                  "milsValue": 0,
                  "inputColor":"#f37371"                   
              }
            );        
          }
        },
        
        /*
         *
         */
        distanceUnitDDDidChange: function () {
          this.distanceUnit = this.distanceUnitDD.get('value');
          this.observerHeightUnit = this.observerHeightDD.get('value'); 
        },
        
        /*
         *
         */
        setCoordLabel: function (toType) {
          this.coordInputLabel.innerHTML = dojoString.substitute(
            'Center Point (${crdType})', {
                crdType: toType
            });
        },
        
        /*
         *
         */
        feedbackDidComplete: function (results) {          
          dojoDomClass.remove(this.addPointBtn, 'jimu-state-active');
          this.dt.deactivate();
          this.map.enableMapNavigation();
          this.enableFOVDial();
        },
        
        /*
         *
         */
        enableFOVDial: function () { 
        if(this.FOVInput.disabled)
          {
          this.FOVInput.disabled = false;
            $("input.fov").trigger('configure',
                {
                    "fgColor":"#00ff66",
                    "bgColor":"#f37371",
                    "inputColor":"#f37371"                     
                }
            );
          }
        },
        
        /*
         *
         */
        coordinateFormatButtonWasClicked: function () {
          this.coordinateFormat.content.set('ct', this.coordTool.inputCoordinate.formatType);
          DijitPopup.open({
              popup: this.coordinateFormat,
              around: this.coordinateFormatButton
          });
        },
        
        /*
         * Button click event, activate feedback tool
         */
        pointButtonWasClicked: function () {
          this.coordTool.manualInput = false;
          dojoTopic.publish('clear-points');
          this.dt._setTooltipMessage(0);
          
          this.map.disableMapNavigation();          
          this.dt.activate('point');
          var tooltip = this.dt._tooltip;
          if (tooltip) {
            tooltip.innerHTML = 'Click to add observer location';
          }
          dojoDomClass.toggle(this.addPointBtn, 'jimu-state-active');
        },
        
        /*
         * Button click event, send viewshed request
         */
        createButtonWasClicked: function () {
          
          if(this.dt.startGraphic && this.minObsRange.isValid() && this.maxObsRange.isValid() && this.observerHeight.isValid() && this.FOVInput.value != 0)
          {
            var newObserver = new Graphic(this.coordTool.inputCoordinate.coordinateEsriGeometry);
            var featureSet = new FeatureSet();
            featureSet.features = [newObserver];

            var params = {
              "Input_Observer": featureSet,
              "Near_Distance__RADIUS1_": parseInt(this.coordTool.inputCoordinate.util.convertToMeters(this.minObsRange.value, this.distanceUnit)),
              "Maximum_Distance__RADIUS2_": parseInt(this.coordTool.inputCoordinate.util.convertToMeters(this.maxObsRange.value, this.distanceUnit)),
              "Observer_Offset__OFFSETA_": parseInt(this.coordTool.inputCoordinate.util.convertToMeters(this.observerHeight.value, this.observerHeightUnit))
            };
          
            this.viewshed(params);
          } else {
            var alertMessage = new Message({
              message: '<p>The visibility creation form has missing or invalid parameters, Please ensure:</p><ul><li>An observer location has been set.</li><li>The observer Field of View is not 0.</li><li>The observer height contains a valid value.</li><li>The min and max observable distances contain valid values.</li></ul>'
            });
          }
        },

        gpError: function () {
            var alertMessage = new Message({
              message: 'An error occured whilst creating visibility. Please ensure your observer location falls within the extent of your elevation surface.</p>'
            });
            this.map.setMapCursor("default");
        },   

        onClearBtnClicked: function () {
            this.graphicsLayer.clear();
            this.dt.removeStartGraphic();
            //reset dialog
            this.FOVInput.disabled = true;
            $("input.fov").val(0).trigger('change');
            $("input.fov").trigger('configure',
                {
                    "fgColor":"#ccc",
                    "bgColor":"#ccc",
                    "inputColor":"#ccc"                     
                }
            );
            this.tooltip.hidden = true;
        },

        isNumeric: function(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }           
    });
});