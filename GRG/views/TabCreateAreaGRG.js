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
    'esri/IdentityManager',
    'esri/config',
    'esri/arcgis/OAuthInfo',
    'esri/geometry/geometryEngine',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/LabelClass',
    'esri/request',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/dijit/PopupTemplate',
    'esri/Color',
    'esri/graphic',
    'esri/toolbars/draw',
    'esri/symbols/TextSymbol',
    './drawGRG',
    'dojo/text!../templates/TabCreateAreaGRG.html',
    'dijit/form/NumberSpinner'
], function (
    dojo,
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
    esriId,
    esriConfig,
    OAuthInfo,
    geometryEngine,
    GraphicsLayer,
    FeatureLayer,
    LabelClass,
    esriRequest,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleRenderer,
    PopupTemplate,
    Color,
    Graphic,
    Draw,
    TextSymbol,
    drawGRG,
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
          
          console.log(this.esriId);
          console.log(this.info);
          
          this.angle = 0;
          this.currentUnit = 'meters';
          
          // create graphics layer for grid extent and add to map
          this._graphicsLayerGRGExtent = new GraphicsLayer();
          this._extentSym = new SimpleFillSymbol(this.GRGAreaFillSymbol);          
          this.map.addLayers([this._graphicsLayerGRGExtent]);
          
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
            "labelExpressionInfo": {"value" : "{grid}"}
          };

          var labelClass = new LabelClass(json);

          labelClass.symbol = GRGLabel;
          
          var popupTemplate = new PopupTemplate({
            title: "{grid}",
            description: "{grid}"
          });

          this._featureLayer = new FeatureLayer(featureCollection,{
            infoTemplate: popupTemplate,
            showLabels: true,
            outFields: ["*"]
          });

          this._featureLayer.setLabelingInfo([labelClass]);
          this._featureLayer.setRenderer(gridRenderer);
          
          this.map.addLayer(this._featureLayer);          
          
          // add draw toolbar
          this.dt = new Draw(this.map);
                    
          this.syncEvents();                  
        },
        
        syncEvents: function () {
          
          dojoTopic.subscribe('DD_WIDGET_OPEN', dojoLang.hitch(this, this.setGraphicsShown));
          dojoTopic.subscribe('DD_WIDGET_CLOSE', dojoLang.hitch(this, this.setGraphicsHidden));
          dojoTopic.subscribe('TAB_SWITCHED', dojoLang.hitch(this, this.tabSwitched));
          
          this.own(dojoOn(
            this.createGRGButton,
            'click',
            dojoLang.hitch(this, this.createGRG)
          ));
          
          this.own(dojoOn(
            this.addGRGAreaBtn,
            'click',
            dojoLang.hitch(this, this.addGRGAreaButtonClicked)
          ));

          this.own(dojoOn(
            this.saveGRGButton,
            'click',
            dojoLang.hitch(this, this.saveGRG)
          ));          
                    
          this.own(dojoOn(
            this.deleteGRGAreaBtn,
            'click',
            dojoLang.hitch(this, this.deleteGRGAreaButtonClicked)
          ));
          
          this.own(dojoOn(
            this.gridAngle, 
            'change',
            dojoLang.hitch(this, this.angleChange)
          ));
          
          this.own(dojoOn(
            this.cellUnits, 
            'change',
            dojoLang.hitch(this, this.cellUnitsChange)
          ));
          
          this.own(
            this.dt.on(
              'draw-complete',
              dojoLang.hitch(this, this.drawGRGAreaComplete)
          ));
        },
        
        angleChange: function () {          
          if (this.gridAngle.isValid() && !isNaN(this.gridAngle.value) && this._graphicsLayerGRGExtent.graphics[0]){                        
            var rotateBy = this.gridAngle.getValue() - this.angle;            
            var geom = geometryEngine.rotate(this._graphicsLayerGRGExtent.graphics[0].geometry, rotateBy*-1);
            this._graphicsLayerGRGExtent.clear();
            var graphic = new Graphic(geom, this._extentSym);
            this._graphicsLayerGRGExtent.add(graphic);            
            this.angle = this.gridAngle.getValue();
          }          
        },
        
        cellUnitsChange: function () {
          this.cellWidth.setValue(drawGRG.convertUnits(this.currentUnit,this.cellUnits.value,this.cellWidth.value));
          this.cellHeight.setValue(drawGRG.convertUnits(this.currentUnit,this.cellUnits.value,this.cellHeight.value));
          this.currentUnit = this.cellUnits.value;
        },
        
        deleteGRGAreaButtonClicked: function () {
          this._graphicsLayerGRGExtent.clear();
          
          //reset the angle
          this.angle = 0;
          this.gridAngle.setValue(0);         
          
          html.removeClass(this.addGRGAreaBtn, 'jimu-state-active');          
          html.removeClass(this.addGRGArea, 'controlGroupHidden');
          html.addClass(this.addGRGArea, 'controlGroup');
          html.removeClass(this.deleteGRGArea, 'controlGroup');
          html.addClass(this.deleteGRGArea, 'controlGroupHidden');          
        },        
        
        addGRGAreaButtonClicked: function () {
          this._featureLayer.clear();
          this.map.disableMapNavigation();
          this.dt.activate('rectangle');
          dojoClass.toggle(this.addGRGAreaBtn, 'jimu-state-active');
          html.addClass(this.saveGRGButton, 'controlGroupHidden');
        },

        drawGRGAreaComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._extentSym);          
          this._graphicsLayerGRGExtent.add(graphic);
          this.map.enableMapNavigation();
          this.dt.deactivate();
          
          this.cellWidth.setValue(parseInt((geometryEngine.distance(evt.geometry.getPoint(0,0), evt.geometry.getPoint(0,1), this.cellUnits.value))/9));
          this.cellHeight.setValue(parseInt((geometryEngine.distance(evt.geometry.getPoint(0,0), evt.geometry.getPoint(0,3), this.cellUnits.value))/9));
          
                    
          dojoClass.toggle(this.addGRGArea, "controlGroupHidden");
          dojoClass.toggle(this.deleteGRGArea, "controlGroupHidden");
        },
        
        createGRG: function () {                 
          //check form inputs for validity
          if (this._graphicsLayerGRGExtent.graphics[0] && this.cellWidth.isValid() && this.cellHeight.isValid()) {
            
            var geom = this._graphicsLayerGRGExtent.graphics[0].geometry;

            //work out width and height of AOI
            var GRGAreaWidth = geometryEngine.distance(geom.getPoint(0,0), geom.getPoint(0,1), 'meters');
            var GRGAreaHeight = geometryEngine.distance(geom.getPoint(0,0), geom.getPoint(0,3), 'meters');
            
            var cellWidth = drawGRG.convertUnits(this.cellUnits.value,"meters",this.cellWidth.value);
            var cellHeight = drawGRG.convertUnits(this.cellUnits.value,"meters",this.cellHeight.value);
   
            //work out how many cells are needed horizontally & Vertically to cover the whole canvas area
            var numCellsHorizontal = Math.ceil(GRGAreaWidth/cellWidth);
            var numCellsVertical = Math.ceil(GRGAreaHeight/cellHeight);
            
            if(drawGRG.checkGridSize(numCellsHorizontal,numCellsVertical))
            {
              
              //get center point of AOI
              var centerPoint = geom.getCentroid();
              
              var features = drawGRG.createGRG(numCellsHorizontal,numCellsVertical,centerPoint,cellWidth,cellHeight,this.angle,this.labelStartPosition.value,this.labelStyle.value); 
              
              //apply the edits to the feature layer
              this._featureLayer.applyEdits(features, null, null);
              
              this.deleteGRGAreaButtonClicked();
              
              if(esriId.checkSignInStatus(this.info.portalUrl + "/sharing"))
              {
                html.removeClass(this.saveGRGButton, 'controlGroupHidden');
              }
              
              
              
            }
          }
          else {
            // Invalid entry
            var alertMessage = new Message({
              message: '<p>The GRG creation form has missing or invalid parameters, Please ensure:</p><ul><li>A GRG area has been drawn.</li><li>The cell width and height contain valid values.</li></ul>'
            });          
          }
        },
        
        saveGRG: function () {
          console.log("save grg");
           
          var path = "sharing/rest/content/users/" + this.esriId.credentials[0].userId + "/createService";
          
          //1. generateToken
          //2. isServiceNameAvailable
          // http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Check_Service_Name/02r300000076000000/
          //3. createService
          //4. addToDefinition
          
          esriRequest({
            url: this.info.portalUrl + path,
            content: { 
              token: this.esriId.credentials[0].token,
              title: "test",
              outputType: "featureService",
              createParameters: {
                 "name" : "EmptyServiceName",
                 "serviceDescription" : "",
                 "hasStaticData" : false,
                 "maxRecordCount" : 1000,
                 "supportedQueryFormats" : "JSON",
                 "capabilities" : "Create,Delete,Query,Update,Editing"                 
              },
            },
          }, { usePost: true }).then(this._saveSuccessful, this._error);

        },
        
        _error: function(){console.log("fail");},
        
        _saveSuccessful: function(){console.log("published");},
        
        setGraphicsHidden: function () {
          if (this._graphicsLayerGRGExtent) {
            this._graphicsLayerGRGExtent.hide();
          }
        },
        
        setGraphicsShown: function () {
          if (this._graphicsLayerGRGExtent) {
            this._graphicsLayerGRGExtent.show();
          }
        },
        
        tabSwitched: function () {
          this._featureLayer.clear();
          this.dt.deactivate();
          this.deleteGRGAreaButtonClicked();
          html.addClass(this.saveGRGButton, 'controlGroupHidden');
        }      
  });
});
