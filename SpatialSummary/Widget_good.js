///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'dijit/form/Select',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/dom',
        'dojo/dom-construct',
        'dojo/dom-style',
        'dojo/dom-class',
        'dojo/on',
        'dojo/query',
        'jimu/BaseWidget',
        'jimu/dijit/DrawBox',
        'jimu/dijit/SimpleTable',
        'esri/geometry/Polygon',
        'esri/graphic',
        'esri/graphicsUtils',
        'esri/geometry/Extent',
        'esri/geometry/geometryEngine',
        'esri/Color',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/layers/GraphicsLayer',
        'esri/toolbars/draw',
        'esri/tasks/QueryTask',
        'esri/tasks/query',
        './mapLayersList'], 
function(declare,
          _WidgetsInTemplateMixin,
          Select,
          array,
          lang,
          dom,
          domConstruct,
          domStyle,
          domClass,
          on,
          domQuery,
          BaseWidget,
          DrawBox,
          SimpleTable,
          Polygon, 
          Graphic, 
          graphicsUtils,
          Extent,
          geometryEngine,
          Color,
          SimpleFillSymbol,
          SimpleLineSymbol,
          GraphicsLayer,
          Draw,
          QueryTask,
          Query,
          mapLayersList) {

  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    name: 'SpatialSummary',
    baseClass : 'solutions-widget-spatial_summary',
    graphicLayer: null,
    graphicObject: null,
    operations: {
      'count':null,
      'length':null,
      'area':null    
    },
    summaryLayers: [],
    layerTables: [],
    postCreate : function() {
      //this.inherited(arguments);
    },

    startup : function() {
      this.inherited(arguments);
      //read from config into variables
      this.drawBox.setMap(this.map);
      this._bindEvents();
      
      this._initalizeLookupLayers();
            
      this.graphicLayer = new GraphicsLayer();
      this.map.addLayer(this.graphicLayer);     
    },
  
      showSelectFeatureForm: function() {
      /* radio option to select on polygon feature on the map
       * ensure polygon type is selected
       */ 
       this.btnDraw.checked = false;
       domStyle.set(this.drawArea, 'display', 'none');
    },
    
    showDrawFeatureForm: function() {
      /* radio option to draw a polygon on the map
       * show draw toolbar
       */
      this.btnSelect.checked = false;
      domStyle.set(this.drawArea, 'display', 'block');
    },
   
    _bindEvents: function() {
        //bind DrawBox
        this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,this._callbackGetInputFeature)));
    },
  
    
    _initalizeLookupLayers : function() {
      /* read operational layers and put in arrays
       * show the layers in table for user to select summary items. 
       */     
      this.summaryLayers = [];
      if ((this.map.itemInfo.itemData.operationalLayers).length > 0) {
        var lyrDet = new mapLayersList(this.map);
        lyrDet.getAllMapLayers();
        on(lyrDet, 'complete', lang.hitch(this, this._completeMapLayers));
      } else {
        //this._noLayersDisplay();
      }           
          
    },


    //After the class has returned layers, push only Featurelayers and Layers into the layer list.
    _completeMapLayers: function(args) {
      console.log(args);
      if (args) {
        array.forEach(args.data.items, lang.hitch(this, function(layer) {
      var vCount = null;
      var vLength = null;
      var vArea = null;          
          if (layer.type === 'Feature Layer') {
            if(layer.geometryType === 'esriGeometryPoint') {
              vCount = 0;  
            }
            if(layer.geometryType === 'esriGeometryLine') {
              vCount = 0;
              vLength = 0;  
            }             
            if(layer.geometryType === 'esriGeometryPolygon') {
              vCount = 0;
              vArea = 0;  
            }            
            var tempLayer = {
                            "url": layer.url,
                            "name": layer.label,
                            "fields": layer.children,
                            "paritions":[],
                            "stats":{
                                    "count":vCount,
                                    "length":vLength,
                                    "area":vArea
                                    }
                            };            
            this.summaryLayers.push(tempLayer);        
          } else if (layer.type === 'Service') {
            array.forEach(layer.children, lang.hitch(this, function(subLayer) {
              if (subLayer.type === 'Layer') {
                   var tempLayer = {
                            "url": subLayer.url,
                            "name": subLayer.label,
                            "fields": layer.children,                            
                            "paritions":[],
                            "stats":{
                                    "count":vCount,
                                    "length":vLength,
                                    "area":vArea
                                    }
                            };                
                this.summaryLayers.push(tempLayer);                                
              }
            }));
          } else {
          }
        }));
        if (this.summaryLayers.length >= 1) {
          //this.loadLayerTable();
          console.log("done");
        } else {
          //this._noLayersDisplay();
        }
      
      
      array.forEach(this.summaryLayers, lang.hitch(this,function(lay,i) {
        
          var textID = lay.name;
          var progID = lay.name + '_prog';
          var dataID = lay.name + '_data';
          var areaID = lay.name + '_area';
          var tableID = lay.name + '_table';
          var row = domConstruct.toDom("<tr class='controls'>" + "<td><div id='" + progID + "' class='' /></td>" + "<td><div id='" + textID + "' class='result-text' ></div>" + "</td></tr>");
          var rowArea = domConstruct.toDom("<div id='" + areaID + "' class='result-text' ></div>");

          var rowTable = domConstruct.toDom("<div id='" + tableID + "' class='result-text' >"+lay.name+"</div>");
          domConstruct.place(rowTable, this.tableArea);
          this.createLayerTable(tableID);
          //this.own(on(this.layerTables[i], 'actions-edit', lang.hitch(this, this.updateSummaryType)));

          domConstruct.place(row, this.resultsLoading);
          domConstruct.place(rowArea, this.resultsLoading);
          
                if(lay.stats.count != null) {
                  var row = this.layerTables[i].addRow({
                    checkbox : true,
                    func: 'Count',
                    id : lay.name,
                    url : lay.url
                  }); 
                } 
                if(lay.stats.length != null) {         
                  var row = this.layerTables[i].addRow({
                    checkbox : true,
                    func: 'Length',
                    id : lay.name,
                    url : lay.url
                  });
                }
                if(lay.stats.area != null) {
                  this.own(on(this.layerTables[i], 'row-add', lang.hitch(this, function(tr){
                    this._createDropDown(lay,i,tr);    
                  })));                   
                  var row = this.layerTables[i].addRow({
                    checkbox : true,
                    func: 'Area',
                    id : lay.name,
                    fields: null,
                    url : lay.url
                  });
                }                         
      }));        
       
        
      }
    },
   

    //This creates the layer table structure
    createLayerTable : function(pTableLoc) {
      var layerTableFields = [{
        name : 'checkbox',
        title : 'Include',
        type : 'checkbox',
        actions : ['edit']
      }, {
        name : 'func',
        title : 'Function',
        type : 'text'
      }, {
        name : 'fields',
        title : 'Fields',
        type : 'text'
      }, {
        name : 'id',
        type : 'text',
        hidden : true
      }, {
        name : 'url',
        type : 'text',
        hidden : true
      }];
      var args = {
        fields : layerTableFields,
        selectable : false
      };
      
      var table = new SimpleTable(args);
      table.placeAt(dom.byId(pTableLoc));
      table.startup();
      //this.own(on(table, 'checkbox-checked', lang.hitch(this, this.updateSummaryType)));
      
      this.layerTables.push(table);

    },

    _createDropDown: function(pLayer,pI,pTR) {
            var selectOptionArray = [];
            array.forEach(pLayer.fields, lang.hitch(this, function(field) {
              selectOptionArray.push({ "label": field.label, "value": field.name });            
            }));
            
            var selectDropDown = new Select({ options: selectOptionArray, id:"'slb" + pLayer.name + "'", name:"'slb" + pLayer.name + "'" });
            
            var childTDs = pTR.children;
            for (var i = 0; i < childTDs.length; i++) {
              var td = childTDs[i];
              if(domClass.contains(td, "fields")){
                selectDropDown.placeAt(td, "only").startup();
              }
            }
      },



    updateSummaryType: function() {
      array.forEach(this.layerTables, lang.hitch(this, function(table) {
        array.forEach(table.tbody.rows, lang.hitch(this, function(tr) {
          var rowData = table.getRowData(tr);
          console.log(rowData);
          array.forEach(this.summaryLayers, lang.hitch(this, function(layer){
            if(layer.name === rowData.id) {
              if(rowData.checkbox === true) {
                for(key in layer.stats) {
                  if (key.toLowerCase() === (rowData.func).toLowerCase()) {
                    if (layer.stats.hasOwnProperty(key)) {
                        layer.stats[key] = 0;  
                      }      
                  } 
                }
              } else {
                for(key in layer.stats) {
                  if (key.toLowerCase() === (rowData.func).toLowerCase()) {
                    if (layer.stats.hasOwnProperty(key)) {
                        layer.stats[key] = null;  
                      }      
                  } 
                }
              }
            }  
          }));
        }));
      }));     
    },


      
    _callbackGetInputFeature: function(evt) {
      /* The call back after a valid polygon has been selected
       * or after when a polygon has been drawn.
       */
        this.updateSummaryType();
        
        array.forEach(this.summaryLayers, lang.hitch(this,function(layer){
          var process = false;
          for(key in layer.stats) {
            if (layer.stats.hasOwnProperty(key)) {
              if (layer.stats[key] != null) {
                process = true;
              }
            }
          }
          if(process) {
            this.verifyInputFeatureGeom(evt,layer,evt.geometry); 
          } 
        }));
                        
    },
    
    verifyInputFeatureGeom: function(pGraphic,pLayer,pGeom) {
      /* do a check if geometry already contains less than 1000 records for each summary layer
       * if it has less than 1K, go ahead and store in chunk array
       * if over 1K, split feature by 4 extents, and recurse this function again.
       */  
              //console.log(pGraphic);
              var queryTask = new QueryTask(pLayer.url);
              var query = new Query();
                  query.returnGeometry = true;
                  query.geometry = pGeom;
                  query.outFields = ["*"];
              queryTask.executeForCount(query, lang.hitch(this, function(count){
                if (count > 500) {
                  var pExtent = pGeom.getExtent();
                  var xmid = (pExtent.xmax + pExtent.xmin) / 2;
                  var ymid = (pExtent.ymax + pExtent.ymin) / 2;
                  var extentArray = new Array();
                  extentArray[0] = new Extent(pExtent.xmin, ymid, xmid, pExtent.ymax, pGraphic.geometry.spatialReference);
                  extentArray[1] = new Extent(xmid, ymid, pExtent.xmax, pExtent.ymax, pGraphic.geometry.spatialReference);
                  extentArray[2] = new Extent(pExtent.xmin, pExtent.ymin, xmid, ymid, pGraphic.geometry.spatialReference);
                  extentArray[3] = new Extent(xmid, pExtent.ymin, pExtent.xmax, ymid, pGraphic.geometry.spatialReference);
                        array.forEach(extentArray, lang.hitch(this,function(arrExt) {
                          if(geometryEngine.intersects(arrExt, pGeom)) { 
                            
                            var newGeom = geometryEngine.clip(pGeom, arrExt);
                          
                          var recurse = this.verifyInputFeatureGeom(pGraphic, pLayer, newGeom); 
                          //console.log(enrich.mapLayer.url, arrExt);  
                          }
                        }));
                  
                } else {
                    pLayer.paritions.push(pGeom); 
                   
                            
                            this.prepGeomToService(pLayer,pGeom);               
                } 
                         
              }));
    },

    prepGeomToService: function(pLayer,pGeom) {
      /* for each chunk for each summary layer, add to deferred class object
       * call the query callback
       */
      
      
              var queryTask = new QueryTask(pLayer.url);
              var query = new Query();
                  query.returnGeometry = true;
                  query.geometry = pGeom;
                  query.outFields = ["*"];
              queryTask.execute(query, lang.hitch(this, function(results){
                if (results.features) {
                    //console.log(results.features.length);  
                        if(pLayer.stats.count != null){
                          this.sumByCount(pLayer,results.features.length);
                        }
                        
                        if(pLayer.stats.length != null){
                          this.sumByLength(pLayer,results.features,pGeom);  
                        }
                        
                        if(pLayer.stats.area != null){
                          this.sumByArea(pLayer,results.features,pGeom);  
                        }
                    
                           var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                                  new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                                  new Color([255,255,0]), 2),new Color([0,0,0,0.25])
                              );
                              
                            var gra = new Graphic(pGeom,sfs);
                            this.graphicLayer.add(gra); 
                            
                            /*
                            array.forEach(results.features, lang.hitch(this, function(res) {
                              for (var p in res.attributes) {
                                if( res.attributes.hasOwnProperty(p)) {
                                  dom.byId(pLayer.name+'_data').innerHTML = dom.byId(pLayer.name+'_data').innerHTML  + p + ":" + res.attributes[p] + " ";                                 
                                }
                              }; 
                              dom.byId(pLayer.name+'_data').innerHTML = dom.byId(pLayer.name+'_data').innerHTML + "<br>";   
                            }));
                            */
                }        
              }));      
      
      
      
    },
    
    _callbackQueryService: function() {
      /* sequentially send deferred object to query service.
       * successful execution will recurse this function
       * until all deferred objects are sent.
       */  
    },

    checkResultType: function() {
      /* after results came back, check the result with the config for summary type
       * Send to the appropriate type report
       */
    },

    sumByCount: function(pLayer,pCount) {
      /* take the result and get the record count.
       * append to the global count variable for each summary layer 
       */
      
                    var currCount = parseInt(pLayer.stats.count);
                    pLayer.stats.count = currCount + pCount;
                    dom.byId(pLayer.name).innerHTML = pLayer.name + " count :" + pLayer.stats.count;      
      
    },

    sumByType: function() {
      /* Loop through the result set and filter by the different Type specify in config
       * append to the global count variable for each Type for each summary layer 
       */
    },

    sumByLength: function(pLayer,pResults) {
      /* Loop through the result use client geomEngine to calculate length
       * append to the global length variable for each summary layer 
       */
      array.forEach(pResults, lang.hitch(this,function(result){
        var currLength = parseFloat(pLayer.stats.length);
        pLayer.stats.length =  currLength + 0; 
        dom.byId(pLayer.name).innerHTML = dom.byId(pLayer.name).innerHTML + "<br>" + pLayer.name + ' Length:' + pLayer.stats.length;  
      }));
    },

    sumByArea: function(pLayer,pResults,pGeom) {
      /* Loop through the result use client geomEngine to calculate Area
       * append to the global length variable for each summary layer 
       */
      
      array.forEach(pResults, lang.hitch(this,function(result){
        var intersectGeom = geometryEngine.intersect(result.geometry,pGeom);
        var currArea = geometryEngine.planarArea(intersectGeom);
        
        pLayer.stats.area =  currArea + parseFloat(pLayer.stats.area); 
        dom.byId(pLayer.name+'_area').innerHTML = pLayer.name + ' Area:' + pLayer.stats.area;  
      }));      
      
    },

    sumByStat: function() {
      /* example Loop through the result use client geomEngine to calculate length
       * append to the global length variable for each summary layer 
       */      
      /* Loop through the result use client geomEngine to calculate Area
       * append to the global length variable for each summary layer 
       */
    },

    unionDataToGraphic: function() {
      /* All the returned summary data, append the data back to the graphic
       * Turn graphic different color to signify completion.
       */
    },
    
    clearInputFeature: function() {
      /* clean up functions to clear graphic and data.
       * 
       */
      this.graphicLayer.clear();
      this.drawBox.clear();
      array.forEach(this.summaryLayers, lang.hitch(this, function(layer) { 
        dom.byId(layer.name).innerHTML = '';
        dom.byId(layer.name+'_area').innerHTML = '';
        if(layer.stats.count){
          layer.stats.count = 0;  
        }        
        if(layer.stats.length){
          layer.stats.length = 0;  
        }
        if(layer.stats.area){
          layer.stats.area = 0;  
        }        
      }));
    }


  });
});
