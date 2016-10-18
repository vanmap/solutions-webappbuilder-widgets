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
    'esri/symbols/SimpleFillSymbol',
    'esri/graphic',
    'esri/toolbars/draw',
    'esri/toolbars/edit',
    'esri/tasks/Geoprocessor',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/FeatureSet',
    'dojo/text!../templates/TabCreateAreaGRG.html'
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
          this.gpCreateAreaGRG = new Geoprocessor(this.createAreaGRGService);
         
          // create graphics layer for grid extent and add to map
          this._graphicsLayerGRGExtent = new GraphicsLayer();
          this._extentSym = new SimpleFillSymbol(this.canavasAreaFillSymbol);
          
          this._graphicsLayerCellSize = new GraphicsLayer();
          this._cellSym = new SimpleFillSymbol(this.cellAreaFillSymbol);
          
          this.map.addLayers([this._graphicsLayerGRGExtent,this._graphicsLayerCellSize]);

          // add draw toolbar
          this.dt = new Draw(this.map);
          this.dtCell = new Draw(this.map);
          
          // add edit toolbar that will be used for rotating grid 
          this.editToolbar = new Edit(this.map);
                    
          this.syncEvents();
          
          this.own(dojoOn(
            this.createGRGButton, 
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
              dojoLang.hitch(this, this.drawCanvasComplete)
          ));
          
          this.own(
            this.dtCell.on(
              'draw-complete',
              dojoLang.hitch(this, this.drawPointAreaComplete)
          ));

          this.own(dojoOn(
            this.addCanvasAreaBtn,
            'click',
            dojoLang.hitch(this, this.extentButtonClicked)
          ));

          this.own(dojoOn(
            this.addCellAreaBtn,
            'click',
            dojoLang.hitch(this, this.cellAreaButtonClicked)
          ));
          
          this.own(dojoOn(
            this.rotateCellBtn,
            'click',
            dojoLang.hitch(this, this.rotateButtonClicked)
          ));
          
          this.own(dojoOn(
            this.deleteCellBtn,
            'click',
            dojoLang.hitch(this, this.deleteCellButtonClicked)
          ));
          
          this.editToolbar.on("rotate-stop", dojoLang.hitch(this,function(evt){
            this.editToolbar.deactivate();
          }));
        },

        extentButtonClicked: function () {
          this._graphicsLayerGRGExtent.clear();
          this.map.disableMapNavigation();
          this.dtCell.deactivate();
          html.removeClass(this.addCellAreaBtn, 'jimu-state-active');
          this.dt.activate('extent');
          html.addClass(this.addCanvasAreaBtn, 'jimu-state-active');
        },
        
        rotateButtonClicked: function () {
          if (this._graphicsLayerCellSize.graphics[0]) {
            this.editToolbar.activate(Edit.ROTATE,this._graphicsLayerCellSize.graphics[0])
          }
          else{
            var alertMessage = new Message({
              message: '<p>NO cell area drawn</p>'
            });
          }
        },
        
        deleteCellButtonClicked: function () {          
          html.removeClass(this.addCellAreaBtn, 'jimu-state-hidden');
          html.addClass(this.rotateCellBtn, 'jimu-state-hidden');
          html.addClass(this.deleteCellBtn, 'jimu-state-hidden');
          this.cellWidth.setAttribute('disabled',false);
          this.cellHeight.setAttribute('disabled',false);
          this._graphicsLayerCellSize.clear();          
        },        
        
        cellAreaButtonClicked: function () {
          this._graphicsLayerCellSize.clear();
          this.map.disableMapNavigation();
          this.dt.deactivate();
          html.removeClass(this.addCanvasAreaBtn, 'jimu-state-active');
          this.dtCell.activate('rectangle');
          html.addClass(this.addCellAreaBtn, 'jimu-state-active');
        },

        drawCanvasComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._extentSym);
          this._graphicsLayerGRGExtent.add(graphic);
          this.canvasArea.value = parseInt(evt.geometry.xmin) + " " + parseInt(evt.geometry.ymin) + " " + parseInt(evt.geometry.xmax) + " " + parseInt(evt.geometry.ymax);
          this.map.enableMapNavigation();
          this.dt.deactivate();
          html.removeClass(this.addCanvasAreaBtn, 'jimu-state-active');
        },
        
        drawPointAreaComplete: function (evt) {          
          var graphic = new Graphic(evt.geometry, this._cellSym);
          this._graphicsLayerCellSize.add(graphic);
          this.cellWidth.setValue(parseInt(evt.geometry.getExtent().xmax - evt.geometry.getExtent().xmin));
          this.cellHeight.setValue(parseInt(evt.geometry.getExtent().ymax - evt.geometry.getExtent().ymin));
          this.cellWidth.setAttribute('disabled',true);
          this.cellHeight.setAttribute('disabled',true);
          this.map.enableMapNavigation();
          this.dtCell.deactivate();
          html.removeClass(this.addCellAreaBtn, 'jimu-state-active');
          html.addClass(this.addCellAreaBtn, 'jimu-state-hidden');
          html.removeClass(this.rotateCellBtn, 'jimu-state-hidden');
          html.removeClass(this.deleteCellBtn, 'jimu-state-hidden');
        },
        
        createGRG: function () {                 
          //check form inouts for validity
          if ( this.addGRGName.isValid() && this.cellWidth.isValid() && this.cellHeight.isValid() && this.canvasArea.value != "") {
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
              message: '<p>The GRG creation form has missing or invalid parameters, Please ensure:</p><ul><li>The GRG Name is not blank.</li><li>The canvas area is not blank.</li><li>The cell width and height contain valid values.</li></ul>'
            });          
          }                
        },
        
        processQueryResults: function (results) {
          var gridNameArray = [];
          array.forEach(results.features, dojoLang.hitch(this, function (feature) {            
            gridNameArray.push(feature.attributes.grg_name);
          }));
          if (gridNameArray.includes(this.addGRGName.value))
          { 
            // Grid Name already exists alert user
            var alertMessage = new Message({
              message: '<p>A grid with the name supplied already exists, please enter a different name.</p>'
            });
          }
          else
          {
            // Do the post  
            var params = { 
                "GRG_Name": this.addGRGName.value, 
                "Canvas_Area": this.canvasArea.value,
                "Cell_Width": this.cellWidth.value,
                "Cell_Height": this.cellHeight.value,
                "Cell_Units": this.cellUnits.value,
                "Labeling_Start_Position": this.labelStartPosition.value,
                "Labeling_Style": this.labelStyle.value
              };
            
            if (this.cellWidth.disabled == true && this._graphicsLayerCellSize.graphics[0]) {
              //if user has drawn grid size add to params
              var features = [];
              features.push(this._graphicsLayerCellSize.graphics[0]);
              var featureSet = new FeatureSet();
              featureSet.features = features;
              
              params.Draw_Cell = featureSet;
              params.Cell_Width = 0;
              params.Cell_Height = 0;
            }
            this.map.setMapCursor("wait");
            this.gpCreateAreaGRG.submitJob(params, dojoLang.hitch(this,this.gpComplete));            
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
          this.canvasArea.value = "";
          this.map.setMapCursor("default");
          
          //reset the draw grid size buttons
          this.deleteCellButtonClicked();      
        },
        
        setGraphicsHidden: function () {
          if (this._graphicsLayerGRGExtent) {
            this._graphicsLayerGRGExtent.hide();
          }
          if (this._graphicsLayerCellSize) {
            this._graphicsLayerCellSize.hide();
          }
        },
        
        setGraphicsShown: function () {
          if (this._graphicsLayerGRGExtent) {
            this._graphicsLayerGRGExtent.show();
          }
          if (this._graphicsLayerCellSize) {
            this._graphicsLayerCellSize.show();
          }
        },
        
        tabSwitched: function () {
          if (this._graphicsLayerGRGExtent) {
            this._graphicsLayerGRGExtent.clear();
          }
          if (this._graphicsLayerCellSize) {
            this._graphicsLayerCellSize.clear();
          }
        }
    });
});
