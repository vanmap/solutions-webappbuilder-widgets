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
  'esri/graphicsUtils',
  '../BaseFeatureAction'
], function(declare, graphicsUtils, BaseFeatureAction){
  var clazz = declare(BaseFeatureAction, {
    name: 'ZoomTo',

    constructor: function(){
      this.icon = require.toUrl('jimu') + '/images/feature_actions/zoomto.svg';
    },

    isFeatureSupported: function(featureSet){
      return featureSet.features.length > 0 && featureSet.features[0].geometry;
    },

    onExecute: function(featureSet){
      var extent;
      if (featureSet.features.length > 0) {
        if (featureSet.features.length === 1 && featureSet.geometryType === "point") {
          var levelOrFactor = 15;
          levelOrFactor = this.map.getMaxZoom() > -1 ? this.map.getMaxZoom() : 0.1;
          this.map.centerAndZoom(featureSet.features[0].geometry, levelOrFactor);
        } else {
          extent = graphicsUtils.graphicsExtent(featureSet.features);
          this.map.setExtent(extent.expand(1.1));
        }
      }
    }

  });
  return clazz;
});