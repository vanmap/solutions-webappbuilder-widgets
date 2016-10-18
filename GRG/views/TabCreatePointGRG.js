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
    'dojo/on',
    'dojo/topic',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/Message',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/graphic',
    'esri/toolbars/draw',
    'esri/toolbars/edit',
    'esri/tasks/Geoprocessor',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/FeatureSet',
    'dojo/text!../templates/TabCreatePointGRG.html'
], function (
    dojo,
    dojoDeclare,
    dojoLang,
    dojoOn,
    dojoTopic,
    array,
    html,
    dojoDomClass,
    dijitWidgetBase,    
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    Message,
    GraphicsLayer,
    SimpleMarkerSymbol,
    SimpleFillSymbol,
    Graphic,
    Draw,
    Edit,
    Geoprocessor,
    Query,
    QueryTask,
    FeatureSet,
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
          this.gpCreatePointGRG = new Geoprocessor(this.createPointGRGService);
         
          // create graphics layer for grid extent and add to map
          this._graphicsLayerPointOfOrigin = new GraphicsLayer();
          this._pointSym = new SimpleMarkerSymbol(this.pointSymbol);
          
          this._graphicsLayerGridSize = new GraphicsLayer();
          this._cellSym = new SimpleFillSymbol(this.cellAreaFillSymbol);
          
          this.map.addLayers([this._graphicsLayerPointOfOrigin,this._graphicsLayerGridSize]);

          // add draw toolbar
          this.dt = new Draw(this.map);
          this.dtCell = new Draw(this.map);
          
          // add edit toolbar that will be used for rotating grid 
          this.editToolbar = new Edit(this.map);
                    
          this.syncEvents();
          
          this.own(dojoOn(
            this.createPointGRGButton, 
            'click', dojoLang.hitch(this, this.createGRG)
          ));
        },
        
        syncEvents: function () {
          
          dojoTopic.subscribe('DD_WIDGET_OPEN', dojoLang.hitch(this, this.setGraphicsShown));
          dojoTopic.subscribe('DD_WIDGET_CLOSE', dojoLang.hitch(this, this.setGraphicsHidden));
          dojoTopic.subscribe('TAB_SWITCHED', dojoLang.hitch(this, this.tabSwitched));

          this.own(
            this.dt.on(
              'draw-complete',
              dojoLang.hitch(this, this.drawPointComplete)
          ));
          
          this.own(
            this.dtCell.on(
              'draw-complete',
              dojoLang.hitch(this, this.drawPointCellComplete)
          ));

          this.own(dojoOn(
            this.addPointAreaBtn,
            'click',
            dojoLang.hitch(this, this.extentButtonClicked)
          ));

          this.own(dojoOn(
            this.addCellPointBtn,
            'click',
            dojoLang.hitch(this, this.cellAreaButtonClicked)
          ));
          
          this.own(dojoOn(
            this.pointRotateCellBtn,
            'click',
            dojoLang.hitch(this, this.rotateButtonClicked)
          ));
          
          this.own(dojoOn(
            this.pointDeleteCellBtn,
            'click',
            dojoLang.hitch(this, this.deleteCellButtonClicked)
          ));
          
          this.editToolbar.on("rotate-stop", dojoLang.hitch(this,function(evt){
            this.editToolbar.deactivate();
          }));
        },

        extentButtonClicked: function () {
          this._graphicsLayerPointOfOrigin.clear();
          this.map.disableMapNavigation();
          this.dtCell.deactivate();
          html.removeClass(this.addCellPointBtn, 'jimu-state-active');
          this.dt.activate('point');
          html.addClass(this.addPointAreaBtn, 'jimu-state-active');
        },
        
        rotateButtonClicked: function () {
          if (this._graphicsLayerGridSize.graphics[0]) {
            this.editToolbar.activate(Edit.ROTATE,this._graphicsLayerGridSize.graphics[0])
          }
          else{
            var alertMessage = new Message({
              message: '<p>NO cell area drawn</p>'
            });
          }
        },
        
        deleteCellButtonClicked: function () {          
          html.removeClass(this.addCellPointBtn, 'jimu-state-hidden');
          html.addClass(this.pointRotateCellBtn, 'jimu-state-hidden');
          html.addClass(this.pointDeleteCellBtn, 'jimu-state-hidden');
          this.pointCellWidth.setAttribute('disabled',false);
          this.pointCellHeight.setAttribute('disabled',false);
          this._graphicsLayerGridSize.clear();          
        },        
        
        cellAreaButtonClicked: function () {
          this._graphicsLayerGridSize.clear();
          this.map.disableMapNavigation();
          this.dt.deactivate();
          html.removeClass(this.addPointAreaBtn, 'jimu-state-active');
          this.dtCell.activate('rectangle');
          html.addClass(this.addCellPointBtn, 'jimu-state-active');
        },

        drawPointComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._pointSym);
          this._graphicsLayerPointOfOrigin.add(graphic);
          this.pointCanvasArea.value = parseInt(evt.geometry.x) + " " + parseInt(evt.geometry.y);
          this.map.enableMapNavigation();
          this.dt.deactivate();
          html.removeClass(this.addPointAreaBtn, 'jimu-state-active');
        },
        
        drawPointCellComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._cellSym);
          this._graphicsLayerGridSize.add(graphic);
          this.pointCellWidth.setValue(parseInt(evt.geometry.getExtent().xmax - evt.geometry.getExtent().xmin));
          this.pointCellHeight.setValue(parseInt(evt.geometry.getExtent().ymax - evt.geometry.getExtent().ymin));
          this.pointCellWidth.setAttribute('disabled',true);
          this.pointCellHeight.setAttribute('disabled',true);
          this.map.enableMapNavigation();
          this.dtCell.deactivate();
          html.removeClass(this.addCellPointBtn, 'jimu-state-active');
          html.addClass(this.addCellPointBtn, 'jimu-state-hidden');
          html.removeClass(this.pointRotateCellBtn, 'jimu-state-hidden');
          html.removeClass(this.pointDeleteCellBtn, 'jimu-state-hidden');
        },
        
        createGRG: function () {
                 
          if ( this.addPointGRGName.isValid() && this.pointCellHorizontal.isValid() && this.pointCellVertical.isValid() && this.pointCellWidth.isValid() && this.pointCellHeight.isValid() && this.pointCanvasArea.value != "") {
            // Check if grid of same name exists
            var queryTask = new QueryTask(this.gridFeatureService);
            var query = new Query();
            query.returnGeometry = false;
            query.outFields = ["grg_name"];
            query.where = "1=1";
            query.returnDistinctValues = true;
            queryTask.execute(query,dojoLang.hitch(this,this.processQueryResults));
          } else {
            // Invalid entry
            var alertMessage = new Message({
              message: '<p>The GRG creation form has missing or invalid parameters, Please ensure:</p><ul><li>The GRG Name is not blank.</li><li>The canvas area is not blank.</li><li>The number of cells horizontal and vertical contain valid values.</li><li>The cell width and height contain valid values.</li></ul>'
            });          
          }                
        },
        
        processQueryResults: function (results) {
          var gridNameArray = [];
          array.forEach(results.features, dojoLang.hitch(this, function (feature) {            
            gridNameArray.push(feature.attributes.grg_name);
          }));
          if (gridNameArray.includes(this.addPointGRGName.value))
          { 
            // Grid Name already exists alert user
            var alertMessage = new Message({
              message: '<p>A grid with the name supplied already exists, please enter a different name.</p>'
            });
          }
          else
          {
            // Do the post
            var pointOfOrigin = [];
            pointOfOrigin.push(this._graphicsLayerPointOfOrigin.graphics[0]);
            var pointOfOriginFeatureSet = new FeatureSet();
            pointOfOriginFeatureSet.features = pointOfOrigin;
            
            var params = { 
              "GRG_Name": this.addPointGRGName.value,
              "Target_Point_of_Origin": pointOfOriginFeatureSet,
              "Number_of_Horizontal_Cells": this.pointCellHorizontal.value,
              "Number_of_Vertical_Cells": this.pointCellVertical.value,
              "Cell_Width": this.pointCellWidth.value,
              "Cell_Height": this.pointCellHeight.value,
              "Cell_Units": this.pointCellUnits.value,
              "Labeling_Start_Position": this.pointLabelStartPosition.value,
              "Labeling_Style": this.pointLabelStyle.value
            };
            
            if (this.pointCellWidth.disabled == true && this._graphicsLayerGridSize.graphics[0] && this._graphicsLayerPointOfOrigin.graphics[0]) {           
              //if user has drawn grid size add to params
              var Canvas_Area = [];
              Canvas_Area.push(this._graphicsLayerGridSize.graphics[0]);
              var canvasAreaFeatureSet = new FeatureSet();
              canvasAreaFeatureSet.features = Canvas_Area;
              
              params.Grid_Size = canvasAreaFeatureSet;
              params.Cell_Width = 0;
              params.Cell_Height = 0;
            }
            this.map.setMapCursor("wait");
            this.gpCreatePointGRG.submitJob(params, dojoLang.hitch(this,this.gpComplete));            
          }
        },
        
        gpComplete: function () {
          //clear user drawn graphics using existing function          
          this.tabSwitched();
          
          //refresh each of the feature layers to up date grids after creation
          for(var j = 0; j < this.map.graphicsLayerIds.length; j++) {
            this.map.getLayer(this.map.graphicsLayerIds[j]).refresh();
          }
          
          //reset form value and mouse cursor
          this.pointCanvasArea.value = "";
          this.map.setMapCursor("default");
          
          //reset the draw grid size buttons
          this.deleteCellButtonClicked();      
        },
        
        setGraphicsHidden: function () {
          if (this._graphicsLayerPointOfOrigin) {
            this._graphicsLayerPointOfOrigin.hide();
          }
          if (this._graphicsLayerGridSize) {
            this._graphicsLayerGridSize.hide();
          }
        },
        
        setGraphicsShown: function () {
          if (this._graphicsLayerPointOfOrigin) {
            this._graphicsLayerPointOfOrigin.show();
          }
          if (this._graphicsLayerGridSize) {
            this._graphicsLayerGridSize.show();
          }
        },
        
        tabSwitched: function () {
          if (this._graphicsLayerPointOfOrigin) {
            this._graphicsLayerPointOfOrigin.clear();
          }
          if (this._graphicsLayerGridSize) {
            this._graphicsLayerGridSize.clear();
          }
        }
    });
});
