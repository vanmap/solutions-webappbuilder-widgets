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
    'esri/IdentityManager',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/LabelClass',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/renderers/SimpleRenderer',
    'esri/dijit/PopupTemplate',
    'esri/symbols/Font',
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
    esriId,
    GraphicsLayer,
    FeatureLayer,
    LabelClass,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    SimpleRenderer,
    PopupTemplate,
    Font,
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
                    
          // create a renderer for the grg layer to override default symbology
          var gridColor = new Color("#000");
          var gridLine = new SimpleLineSymbol("solid", gridColor, 2.5);
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

          this.GRGPoint = new FeatureLayer(featureCollection,{
            outFields: ["*"]
          });
          this.GRGPoint.setRenderer(gridRenderer);
         
          var json = {
            "labelExpressionInfo": {"value": "{grid}"}
          };
          
          // create a text symbol to define the style of labels
          var labelClass = new LabelClass(json);
          labelClass.symbol = new TextSymbol({
            font: new Font("11", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD, "Helvetica"),
            color: new Color("#666633")
          });
          this.GRGPoint.setLabelingInfo([labelClass]);
          
          this.map.addLayers([this.GRGPoint,this._graphicsLayerPointOfOrigin]);

          // add draw toolbar
          this.dtPoint = new Draw(this.map);
          
          this.syncEvents();
          this.initSaveToPortal();
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
          this.GRGPoint.clear();
          this._graphicsLayerPointOfOrigin.clear();
          //refresh each of the feature/graphic layers to enusre labels are removed
          for(var j = 0; j < this.map.graphicsLayerIds.length; j++) {
            this.map.getLayer(this.map.graphicsLayerIds[j]).refresh();
          }
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
        if ( this._graphicsLayerPointOfOrigin.graphics[0] && this.addGRGPointName.isValid() && this.pointCellWidth.isValid() && this.pointCellHeight.isValid() && this.gridAnglePoint.isValid()) {
          
          //get center point of AOI
          var centerPoint = this._graphicsLayerPointOfOrigin.graphics[0].geometry;
          
          var cellWidth = drawGRG.convertUnits(this.pointCellUnits.value,"meters",this.pointCellWidth.value);
          var cellHeight = drawGRG.convertUnits(this.pointCellUnits.value,"meters",this.pointCellHeight.value);
          
          if(drawGRG.checkGridSize(this.pointCellHorizontal.value,this.pointCellVertical.value))
          {
            var features = drawGRG.createGRG(this.pointCellHorizontal.value,this.pointCellVertical.value,centerPoint,cellWidth,cellHeight,this.gridAnglePoint.value,this.pointLabelStartPosition.value,this.pointLabelStyle.value); 
            //apply the edits to the feature layer
            this.GRGPoint.applyEdits(features, null, null);
            this.deleteGRGPointButtonClicked();
            html.removeClass(this.saveGRGPointButton, 'controlGroupHidden');            
          }
          
        } else {
          // Invalid entry
          var alertMessage = new Message({
            message: '<p>The GRG creation form has missing or invalid parameters, Please ensure:</p><ul><li>The GRG Name is not blank.</li><li>A GRG point has been drawn.</li><li>The cell width and height contain valid values.</li><li>The grid angle is valid.</li></ul>'
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
          this.GRGPoint.clear();          
          this.dtPoint.deactivate();
          this.deleteGRGPointButtonClicked();
          html.addClass(this.saveGRGPointButton, 'controlGroupHidden');
        },
        
        initSaveToPortal: function() {          
          
          esriId.registerOAuthInfos();
          
          this.own(dojoOn(this.saveGRGPointButton, "click", dojoLang.hitch(this, function(evt) {
          
          var featureServiceName = this.addGRGName.value;
          
          esriId.getCredential(this.appConfig.portalUrl + "/sharing", { oAuthPopupConfirmation: false }).then(dojoLang.hitch(this, function() {
              //sign in
              new arcgisPortal.Portal(this.appConfig.portalUrl).signIn().then(dojoLang.hitch(this, function(portalUser) {
               //Get the token
                var token = portalUser.credential.token;
                var orgId = portalUser.orgId;
                var userName = portalUser.username;
                
                var checkServiceNameUrl = this.appConfig.portalUrl + "sharing/rest/portals/" + orgId + "/isServiceNameAvailable";
                var createServiceUrl = this.appConfig.portalUrl + "sharing/content/users/" + userName + "/createService"; 

                this.isNameAvailable(checkServiceNameUrl, token, featureServiceName).then(dojoLang.hitch(this, function(response0) {
                  if (response0.available) {
                    //set dojoLang to busy
                    this.busyIndicator.show();
                    //create the service
                    this.createFeatureService(createServiceUrl, token, 
                      this.getFeatureServiceParams(featureServiceName)).then(dojoLang.hitch(this, function(response1) {
                        if (response1.success) {
                          var addToDefinitionUrl = response1.serviceurl.replace(new RegExp('rest', 'g'), "rest/admin") + "/addToDefinition";
                          
                          
                          this.addDefinitionToService(addToDefinitionUrl, token, 
                            this.getLayerParams(featureServiceName)).then(dojoLang.hitch(this, function(response2) {

                              if (response2.success) {
                                //Push features to new layer
                                 var newFeatureLayer = new FeatureLayer(response1.serviceurl + "/0?token=" + token, {
                                   outFields: ["*"]                                  
                                 });
                                 this.map.addLayer(newFeatureLayer);
                                
                                newFeatureLayer.applyEdits(this.GRGPoint.graphics,null,null).then(dojoLang.hitch(this, function(){
                                  this.tabSwitched();                                
                                })).otherwise(dojoLang.hitch(this,function(){this.tabSwitched();}));
                                this.map.setMapCursor("default");
                              }

                            }), function(err2) {
                              this.map.setMapCursor("default");
                              new Message({
                                message: "Add to definition: " + err2.message
                              });                              
                            });
                        } else {
                          this.map.setMapCursor("default");
                          new Message({
                            message: "Unable to create " + featureServiceName
                          });
                        }
                      }), function(err1) {
                        this.map.setMapCursor("default");
                        new Message({
                          message: "Create Service: " + err1.message
                        });
                      });
                  } else {
                    this.map.setMapCursor("default");
                    new Message({
                      message: "You already have a feature service named " + featureServiceName + ". Please choose another name."
                    });                    
                  }
                }), function(err0) {
                  this.map.setMapCursor("default");
                  new Message({
                    message: "Check Service: " + err0.message
                  });
                });

              }))
            }));
        })));
      },

      isNameAvailable: function(serviceName, token, featureServiceName) {
        //Check for the layer name
        var def = esriRequest({
          url: serviceName,
          content: {
            name: featureServiceName,
            type: "Feature Service",
            token: token,
            f: "json"
          },
          handleAs: "json",
          callbackParamName: "callback"
        },{usePost: true});
        return def;
      },

      createFeatureService: function(serviceUrl, token, createParams) {
        //create the service
        var def = esriRequest({
          url: serviceUrl,
          content: {
            f: "json",
            token: token,
            typeKeywords: "ArcGIS Server,Data,Feature Access,Feature Service,Service,Hosted Service",
            createParameters: JSON.stringify(createParams),
            outputType: "featureService"
          },
          handleAs: "json",
          callbackParamName: "callback"
        },{usePost: true});
        return def;
      },

      addDefinitionToService: function(serviceUrl, token, defParams) {
        var def = esriRequest({
          url: serviceUrl,
          content: {
            token: token,
            addToDefinition: JSON.stringify(defParams),
            f: "json"                            
          },
          handleAs: "json",
          callbackParamName: "callback"                          
        },{usePost: true});
        return def;
      },

      getFeatureServiceParams: function(featureServiceName) {
        return {
         "name" : featureServiceName,
         "serviceDescription" : "",
         "hasStaticData" : false,
         "maxRecordCount" : 1000,
         "supportedQueryFormats" : "JSON",
         "capabilities" : "Create,Delete,Query,Update,Editing",
         "description" : "",
         "copyrightText" : "",
         "spatialReference" : {
            "wkid" : 102100
            },
         "initialExtent" : {
            "xmin" : -20037507.0671618,
            "ymin" : -30240971.9583862,
            "xmax" : 20037507.0671618,
            "ymax" : 18398924.324645,
            "spatialReference" : {
               "wkid" : 102100,
               "latestWkid" : 3857
               }
            },
         "allowGeometryUpdates" : true,
         "units" : "esriMeters",
         "xssPreventionInfo" : {
            "xssPreventionEnabled" : true,
            "xssPreventionRule" : "InputOnly",
            "xssInputRule" : "rejectInvalid"
          }
        }
      },

      getLayerParams: function(layerName) {          
        return {
          "layers": [
            {
              "adminLayerInfo": {
                "geometryField": {
                  "name": "Shape"
                },
                "xssTrustedFields": ""
              },
              "id": 0,
              "name": layerName,
              "type": "Feature Layer",
              "displayField": "",
              "description": "",
              "copyrightText": "",
              "defaultVisibility": true,
              "ownershipBasedAccessControlForFeatures" : {
                "allowOthersToQuery" : false, 
                "allowOthersToDelete" : false, 
                "allowOthersToUpdate" : false
              },              
              "relationships": [],
              "isDataVersioned" : false, 
              "supportsCalculate" : true, 
              "supportsAttachmentsByUploadId" : true, 
              "supportsRollbackOnFailureParameter" : true, 
              "supportsStatistics" : true, 
              "supportsAdvancedQueries" : true, 
              "supportsValidateSql" : true, 
              "supportsCoordinatesQuantization" : true, 
              "supportsApplyEditsWithGlobalIds" : true,
              "advancedQueryCapabilities" : {
                "supportsPagination" : true, 
                "supportsQueryWithDistance" : true, 
                "supportsReturningQueryExtent" : true, 
                "supportsStatistics" : true, 
                "supportsOrderBy" : true, 
                "supportsDistinct" : true, 
                "supportsQueryWithResultType" : true, 
                "supportsSqlExpression" : true, 
                "supportsReturningGeometryCentroid" : true
              },          
              "useStandardizedQueries" : false,      
              "geometryType": "esriGeometryPolygon",
              "minScale" : 0, 
              "maxScale" : 0,
              "extent": {
                "xmin" : -20037507.0671618,
                "ymin" : -30240971.9583862,
                "xmax" : 20037507.0671618,
                "ymax" : 18398924.324645,
                "spatialReference": {
                  "wkid": 102100,
                  "latestWkid": 3857
                }
              },
              "drawingInfo": {
                "renderer": {
                 "type": "simple",
                 "symbol": {
                  "color": null,
                  "outline": {
                   "color": [
                    26,
                    26,
                    26,
                    255
                   ],
                   "width": 1.5,
                   "type": "esriSLS",
                   "style": "esriSLSSolid"
                  },
                  "type": "esriSFS",
                  "style": "esriSFSSolid"
                 }
                },
                "transparency": 0,
                "labelingInfo": [
                   {
                    "labelExpression": "[grid]",
                    "labelExpressionInfo": {"value": "{grid}"},
                    "format": null,
                    "fieldInfos": null,
                    "useCodedValues": false,
                    "maxScale": 0,
                    "minScale": 0,
                    "where": null,
                    "sizeInfo": null,
                    "labelPlacement": "esriServerPolygonPlacementAlwaysHorizontal",
                    "symbol": {
                     "color": [
                      51,
                      51,
                      51,
                      255
                     ],
                     "type": "esriTS",
                     "backgroundColor": null,
                     "borderLineColor": null,
                     "haloSize": 0,
                     "haloColor": null,
                     "horizontalAlignment": "center",
                     "rightToLeft": false,
                     "angle": 0,
                     "xoffset": 0,
                     "yoffset": 0,
                     "text": "",
                     "rotated": false,
                     "kerning": true,
                     "font": {
                      "size": 9.75,
                      "style": "normal",
                      "decoration": "none",
                      "weight": "bold",
                      "family": "Arial"
                     }
                    }
                   }
                ]
              },
              "allowGeometryUpdates": true,
              "hasAttachments": false,
              "htmlPopupType": "esriServerHTMLPopupTypeNone",
              "hasM": false,
              "hasZ": false,
              "objectIdField": "OBJECTID",
              "globalIdField": "",
              "typeIdField": "",
              "fields": [
                {
                  "name": "OBJECTID",
                  "type": "esriFieldTypeOID",
                  "actualType": "int",
                  "alias": "OBJECTID",
                  "sqlType": "sqlTypeOther",
                  "nullable": false,
                  "editable": false,
                  "domain": null,
                  "defaultValue": null
                },
                {
                  "name": "GRID",
                  "type": "esriFieldTypeString",
                  "alias": "GRID",
                  "actualType": "nvarchar",
                  "nullable": true,
                  "editable": true,
                  "domain": null,
                  "defaultValue": null,
                  "sqlType": "sqlTypeNVarchar",
                  "length": 256
                }
              ],
              "indexes": [],
              "types": [],
              "templates": [
                {
                  "name": "New Feature",
                  "description": "",
                  "drawingTool": "esriFeatureEditToolPolygon",
                  "prototype": {
                    "attributes": {
                      "GRID": null
                    }
                  }
                }
              ],
              "supportedQueryFormats": "JSON",
              "hasStaticData": false,
              "maxRecordCount": 10000,
              "standardMaxRecordCount" : 4000,               
              "tileMaxRecordCount" : 4000, 
              "maxRecordCountFactor" : 1,   
              "exceedsLimitFactor" : 1,           
              "capabilities": "Query,Editing,Create,Update,Delete"
            }
          ]
        }        
      }
      
    });
});
