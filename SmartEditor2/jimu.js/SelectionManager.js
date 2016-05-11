///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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

define([
    'dojo/_base/declare',
    'dojo/_base/Deferred',
    'dojo/_base/lang',
    'dojo/_base/array',
    'esri/layers/FeatureLayer',
    'esri/geometry/geometryEngine'
  ],
  function(declare, Deferred, lang, array, FeatureLayer, geometryEngine) {
    var instance = null;

    var clazz = declare(null, {

      setSelectionSymbol: function(layer, map){
        var type = layer.geometryType;
        if (type === 'esriGeometryPoint') {
          layer.setSelectionSymbol(map.infoWindow.markerSymbol);
        } else if (type === 'esriGeometryPolyline') {
          layer.setSelectionSymbol(map.infoWindow.lineSymbol);
        } else if (type === 'esriGeometryPolygon') {
          layer.setSelectionSymbol(map.infoWindow.fillSymbol);
        }
      },

      //features must have objectIdField attribute, such as OBJECTID
      updateSelectionByFeatures: function(layer, features, selectionMethod){
        //selectionMethod default value is SELECTION_NEW
        //def must be a dojo/_base/Deferred object, because it has callback method and API will call this method
        var def = new Deferred();
        //def.then(function() {}, function() {});
        var response = {
          features: features
        };
        layer._selectHandler(response, selectionMethod, null, null, def);
        return def;
      },

      addFeaturesToSelection: function(layer, features){
        return this.updateSelectionByFeatures(layer, features, FeatureLayer.SELECTION_ADD);
      },

      removeFeaturesFromSelection: function(layer, features){
        return this.updateSelectionByFeatures(layer, features, FeatureLayer.SELECTION_SUBTRACT);
      },

      clearSelection: function(layer){
        return this.updateSelectionByFeatures(layer, [], FeatureLayer.SELECTION_NEW);
      },

      getClientFeaturesByGeometry: function(layer, geometry){
        var features = array.filter(layer.graphics, lang.hitch(this, function(g) {
          return geometryEngine.intersects(geometry, g.geometry);
        }));
        return features;
      },

      getUnionGeometryBySelectedFeatures: function(layer){
        var unionGeometry = null;
        var features = layer.getSelectedFeatures();
        if (features.length > 0) {
          var geometries = array.map(features, lang.hitch(this, function(feature) {
            return feature.geometry;
          }));
          unionGeometry = geometryEngine.union(geometries);
        }
        return unionGeometry;
      }
    });

    // clazz.addFeaturesToSelectionByGeometry = function(layer, geometry) {
    //   var features = clazz.getClientFeaturesByGeometry(layer, geometry);
    //   return clazz.addFeaturesToSelection(layer, features);
    // };

    // clazz.removeFeaturesFromSelectionByGeometry = function(layer, geometry) {
    //   var features = clazz.getClientFeaturesByGeometry(layer, geometry);
    //   return clazz.removeFeaturesFromSelection(layer, features);
    // };

    // clazz.selectFeaturesByGeometry = function(layer, geometry, selectionMethod, map){
    //   var def = null;
    //   if(layer.getMap()){
    //     //layer is a normal FeatureLayer or a FeatureCollection
    //     var features = clazz.getClientFeaturesByGeometry(layer, geometry);
    //     def = clazz.updateSelectionByFeatures(layer, features, selectionMethod);
    //   }else{
    //     //layer is a virtual FeatureLayer under MapService
    //     var query = null;
    //     var queryParams = new EsriQuery();
    //     queryParams.geometry = geometry;
    //     queryParams.outSpatialReference = map.spatialReference;
    //     queryParams.returnGeometry = true;
    //     queryParams.outFields = [];
    //     def = layer.selectFeatures(query, selectionMethod);
    //   }
    //   return def;
    // };

    // clazz.buffer = function(geometry, distance, bufferUnit){
    //   geometry = geometryEngine.simplify(geometry);
    //   var bufferGeometry = geometryEngine.buffer(geometry, distance, bufferUnit, true);
    //   return bufferGeometry;
    // };

    clazz.getInstance = function(){
      if(!instance){
        instance = new clazz();
      }
      return instance;
    };

    return clazz;
  });