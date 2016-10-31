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
    'dojo',
    'dijit/registry',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/on',
    'dojo/topic',
    'dojo/_base/html',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/Message',
    'esri/geometry/geometryEngine',
    'esri/geometry/Polygon',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/LabelClass',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/dijit/PopupTemplate',
    'esri/Color',
    'esri/graphic',
    'esri/toolbars/draw',
    'esri/symbols/TextSymbol',
    './drawGRG',
    'esri/toolbars/edit',
    'esri/SpatialReference',
    'dojo/text!../templates/TabCreatePointGRG.html'
], function (
    dojo,
    registry,
    dojoDeclare,
    dojoLang,
    dojoClass,
    dojoOn,
    dojoTopic,
    html,
    dijitWidgetBase,    
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    Message,
    geometryEngine,
    Polygon,
    GraphicsLayer,
    FeatureLayer,
    LabelClass,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    SimpleRenderer,
    PopupTemplate,
    Color,
    Graphic,
    Draw,
    TextSymbol,
    drawGRG,
    Edit,
    SpatialReference,
    templateStr    
) {
    'use strict';
    return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
        templateString: templateStr,
        baseClass: 'jimu-widget-TabLine',

        constructor: function (args) {
          dojoDeclare.safeMixin(this, args);
        },

        postCreate: function () {
          
          this.currentPointUnit = 'meters';
          
          // create graphics layer for grid extent and add to map
          this._graphicsLayerPointOfOrigin = new GraphicsLayer();
          this._pointSym = new SimpleMarkerSymbol(this.pointSymbol);
          this.map.addLayers([this._graphicsLayerPointOfOrigin]);

          // add draw toolbar
          this.dtPoint = new Draw(this.map);
          
          // create a renderer for the grg layer to override default symbology
          var gridColor = new Color("#000");
          var gridLine = new SimpleLineSymbol("solid", gridColor, 1.5);
          var gridSymbol = new SimpleFillSymbol("solid", gridLine, null);
          var gridRenderer = new SimpleRenderer(gridSymbol);
          
          var featureCollection = {
            "layerDefinition": {
              "geometryType": "esriGeometryPolygon",
              "objectIdField": "ObjectID",
              "fields": [{
              "name": "ObjectID",
              "alias": "ObjectID",
              "type": "esriFieldTypeOID"
              }, {
              "name": "grid",
              "alias": "grid",
              "type": "esriFieldTypeString"
              }]
            }
          };
          
          // create a text symbol to define the style of labels
          var GRGLabel = new TextSymbol().setColor(gridColor);
          GRGLabel.font.setSize("12pt");
          GRGLabel.font.setFamily("arial");
          
          var json = {
            "labelExpressionInfo": {"value": "{grid}"}
          };
          
          var labelClass = new LabelClass(json);
          
          labelClass.symbol = GRGLabel; // symbol also can be set in LabelClass' json
          
          var popupTemplate = new PopupTemplate({
            title: "{grid}",
            description: "{grid}"
          });
          
          this._featureLayerPoint = new FeatureLayer(featureCollection,{
            infoTemplate: popupTemplate,
            showLabels: true,
            outFields: ["*"]
          });
          
          this._featureLayerPoint.setRenderer(gridRenderer);
          this._featureLayerPoint.setLabelingInfo([labelClass]);

          this.map.addLayer(this._featureLayerPoint);
          
          this.syncEvents();
        },
        
        syncEvents: function () {
          
          dojoTopic.subscribe('DD_WIDGET_OPEN', dojoLang.hitch(this, this.setGraphicsShown));
          dojoTopic.subscribe('DD_WIDGET_CLOSE', dojoLang.hitch(this, this.setGraphicsHidden));
          dojoTopic.subscribe('TAB_SWITCHED', dojoLang.hitch(this, this.tabSwitched));

          this.own(
            this.dtPoint.on(
              'draw-complete',
              dojoLang.hitch(this, this.drawPointComplete)
          ));

          this.own(dojoOn(
            this.addGRGPointBtn,
            'click',
            dojoLang.hitch(this, this.addGRGPointClicked)
          ));
          
          this.own(dojoOn(
            this.deleteGRGPointBtn,
            'click',
            dojoLang.hitch(this, this.deleteGRGPointButtonClicked)
          ));  
          
          this.own(dojoOn(
            this.createPointGRGButton, 
            'click', dojoLang.hitch(this, this.createPointGRG)
          ));

          this.own(dojoOn(
            this.pointCellUnits, 
            'change',
            dojoLang.hitch(this, this.cellPointUnitsChange)
          ));
        },
        
        addGRGPointClicked: function () {
          this._featureLayerPoint.clear();
          this._graphicsLayerPointOfOrigin.clear();
          this.map.disableMapNavigation();
          this.dtPoint.activate('point');
          html.addClass(this.addGRGPointBtn, 'jimu-state-active');
          html.addClass(this.saveGRGPointButton, 'controlGroupHidden');
        },
        
        cellPointUnitsChange: function () {
          this.pointCellWidth.setValue(drawGRG.convertUnits(this.currentPointUnit,this.pointCellUnits.value,this.pointCellWidth.value));
          this.pointCellHeight.setValue(drawGRG.convertUnits(this.currentPointUnit,this.pointCellUnits.value,this.pointCellHeight.value));
          this.currentPointUnit = this.pointCellUnits.value;
        },
        
        deleteGRGPointButtonClicked: function () {
          this._graphicsLayerPointOfOrigin.clear();
          
          html.removeClass(this.addGRGPointBtn, 'jimu-state-active');          
          html.removeClass(this.addGRGPoint, 'controlGroupHidden');
          html.addClass(this.addGRGPoint, 'controlGroup');
          html.removeClass(this.deleteGRGPoint, 'controlGroup');
          html.addClass(this.deleteGRGPoint, 'controlGroupHidden');          
        },

        drawPointComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._pointSym);
          this._graphicsLayerPointOfOrigin.add(graphic);
          this.map.enableMapNavigation();      
          this.dtPoint.deactivate();
          
          dojoClass.toggle(this.addGRGPoint, "controlGroupHidden");
          dojoClass.toggle(this.deleteGRGPoint, "controlGroupHidden");
        },
        
        createPointGRG: function () {
        //check form inouts for validity
        if ( this._graphicsLayerPointOfOrigin.graphics[0] && this.pointCellWidth.isValid() && this.pointCellHeight.isValid() && this.gridAnglePoint.isValid()) {
          
          //get center point of AOI
          var centerPoint = this._graphicsLayerPointOfOrigin.graphics[0].geometry;
          
          var cellWidth = drawGRG.convertUnits(this.pointCellUnits.value,"meters",this.pointCellWidth.value);
          var cellHeight = drawGRG.convertUnits(this.pointCellUnits.value,"meters",this.pointCellHeight.value);
          
          if(drawGRG.checkGridSize(this.pointCellHorizontal.value,this.pointCellVertical.value))
          {
            var features = drawGRG.createGRG(this.pointCellHorizontal.value,this.pointCellVertical.value,centerPoint,cellWidth,cellHeight,this.gridAnglePoint.value,this.pointLabelStartPosition.value,this.pointLabelStyle.value); 
            this._featureLayerPoint.applyEdits(features, null, null);
            this.deleteGRGPointButtonClicked();
            html.removeClass(this.saveGRGPointButton, 'controlGroupHidden');            
          }
          
        } else {
          // Invalid entry
          var alertMessage = new Message({
            message: '<p>The GRG creation form has missing or invalid parameters, Please ensure:</p><ul><li>A GRG point has been drawn.</li><li>The cell width and height contain invalid values.</li><li>The grid angle is invalid.</li></ul>'
          });          
        }
      },
        
        setGraphicsHidden: function () {
          if (this._graphicsLayerPointOfOrigin) {
            this._graphicsLayerPointOfOrigin.hide();
          }
        },
        
        setGraphicsShown: function () {
          if (this._graphicsLayerPointOfOrigin) {
            this._graphicsLayerPointOfOrigin.show();
          }          
        },
        
        tabSwitched: function () {
          this._featureLayerPoint.clear();
          this.dtPoint.deactivate();
          this.deleteGRGPointButtonClicked();
          html.addClass(this.saveGRGPointButton, 'controlGroupHidden');
        }
    });
});
