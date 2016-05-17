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
  'jimu/BaseFeatureAction',
  'jimu/WidgetManager',
  'jimu/LayerInfos/LayerInfos'
], function(declare, BaseFeatureAction, WidgetManager, LayerInfos){
  var clazz = declare(BaseFeatureAction, {
    map: null,

    constructor: function(){
      this.icon = this.appConfig.getConfigElementById(this.widgetId).folderUrl +
        'images/show_relatedrecords_action.svg';
    },

    isFeatureSupported: function(featureSet){
      var layerInfos = LayerInfos.getInstanceSync();
      if(featureSet.features.length === 0){
        return false;
      }

      var feature = featureSet.features[0];
      if(layerInfos &&
          feature._layer &&
          feature._layer.relationships &&
          (feature._layer.relationships.length > 0)) {
        var layerInfo = layerInfos.getLayerInfoById(feature._layer.id);
        if(layerInfo) {
          return layerInfo.getRelatedTableInfoArray().then(function(relatedTableInfoArray) {
            if(relatedTableInfoArray.length > 0) {
              return true;
            } else {
              return false;
            }
          });
        } else {
          return false;
        }
      } else {
        return false;
      }
    },

    onExecute: function(featureSet){
      var feature = featureSet.features[0];
      var layerInfos = LayerInfos.getInstanceSync();
      var selectedLayerInfo = layerInfos.getLayerInfoById(feature._layer.id);
      var featureKey = feature.attributes[feature._layer.objectIdField];

      WidgetManager.getInstance().triggerWidgetOpen(this.widgetId)
      .then(function(attrWidget) {
        attrWidget.showRelatedRecordsFromPopup(selectedLayerInfo, [featureKey]);
      });
    }
  });
  return clazz;
});