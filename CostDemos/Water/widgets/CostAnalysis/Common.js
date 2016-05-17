define([
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/Deferred',
  'dojo/when',
  'dojo/promise/all',
  'jimu/portalUtils',

  'esri/lang',
  'esri/request',
  'esri/layers/FeatureLayer'

],
    function (
        lang,
        array,
        Deferred,
        when,
        all,
        portalUtils,

        esriLang,
        esriRequest,
        FeatureLayer

    ) {
      var common = {
        map: null,
        layerInfosObj: null
      };

      common.setMap = function (map) {
        this.map = map;
      };

      //Get Layers from map
      common.getLayers = function (map, layerInfos) {
        this.map = map;
        var layers = [];
        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = map.getLayer(featureLayer.id);
          layer.name = ((featureLayer.title === null || featureLayer.title === undefined) ? layer.name : featureLayer.title);
          if (!layer) {
            if (!layerInfos[i].featureLayer.options) {
              layerInfos[i].featureLayer.options = {};
            }
            if (!layerInfos[i].featureLayer.options.outFields) {
              if (layerInfos[i].fieldInfos) {
                layerInfos[i].featureLayer.options.outFields = [];
                for (var j = 0; j < layerInfos[i].fieldInfos.length; j++) {
                  layerInfos[i].featureLayer.options.outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              } else {
                layerInfos[i].featureLayer.options.outFields = ["*"];
              }
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
            layers.push(layerInfos[i]);
          }
        }
        return layers;
      };
      common.getLayerbyTitleFromMap = function (map, layerTitle) {
        var ids = map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = map.getLayer(ids[i]);
          var title = "";
          if (layer.url) {

            if (layer.name === layerTitle) {
              return layer;
            }
          }
        }
        return null;
      };

      //common.getLayerbyTitleFromMap = function (map, layerTitle) {
      //  var ids = map.graphicsLayerIds;
      //  var len = ids.length;
      //  for (var i = 0; i < len; i++) {
      //    var layer = map.getLayer(ids[i]);
      //    var title = "";
      //    if (layer.url) {
      //      if (map && map.itemInfo.itemData.operationalLayers) {
      //        var len = map.itemInfo.itemData.operationalLayers.length;
      //        for (var i = 0; i < len; i++) {
      //          if (map.itemInfo.itemData.operationalLayers[i].url.toLowerCase() === layer.url.toLowerCase()) {
      //            title = map.itemInfo.itemData.operationalLayers[i].title;
      //            break;
      //          }
      //        }
      //      }
      //    }
      //    if (title === layerTitle) {
      //      layer.name = title;
      //      return layer;
      //    }
      //  }
      //  return null;
      //};


      //get MapUrls for finding feature in different
      common.getMapUrls = function (layers) {
        var mapUrls = [];
        for (var i = 0; i < layers.length; i++) {
          var featurelayer = layers[i].featureLayer;
          var featurelayerUrl = featurelayer.url;
          var url = featurelayerUrl.substring(0, featurelayerUrl.lastIndexOf("/"));
          if (mapUrls.length === 0) {
            mapUrls.push(url);
          } else {
            for (var j = 0; j < mapUrls.length; j++) {
              if (mapUrls[j].toUpperCase() !== url.toUpperCase()) {
                mapUrls.push(url);
              }
            }
          }
        }
        return mapUrls;

      };

      // to get flat table
      common.getFlatTables = function (projectTables, tableName) {
        for (var i = 0; i < projectTables.length; i++) {
          if (projectTables[i].title === tableName) {
            return projectTables[i];
          }
        }
      };

      common.getFieldNameFromLayer = function (featureLayer, fieldName) {

        for (var i = 0; i < featureLayer.fields.length; i++) {
          if (featureLayer.fields[i].name.toUpperCase() === fieldName.toUpperCase()) {
            return featureLayer.fields[i].name;
          }

        }
      };

      //to get fieldName from feature Attribute
      common.getActualFieldName = function (attributes, fieldName) {
        for (var key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            if (key.toUpperCase() === fieldName.toUpperCase()) {
              return key;
            }
          }
        }
      };

      // to get field value from feature Attribute
      common.getFieldvalue = function (attributes, fieldName) {
        for (var key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            if (key.toUpperCase() === fieldName.toUpperCase()) {
              return attributes[key];
            }
          }
        }
      };

      //clear selected features on widget close
      common.clearSelectedFeaturesFromMap = function (map) {
        var ids = map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = map.getLayer(ids[i]);
          if (layer.type === 'Feature Layer') {
            if (layer.featureLayers === undefined) {
              var selectedFeatures = layer.getSelectedFeatures();
              if (selectedFeatures.length > 0) {
                layer.clearSelection();
              }
            }
          }
        }
        return;
      };
      return common;
    });