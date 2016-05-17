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
    name: 'PanTo',

    constructor: function(){
      this.icon = require.toUrl('jimu') + '/images/feature_actions/panto.svg';
    },

    isFeatureSupported: function(featureSet){
      return featureSet.features.length > 0 && featureSet.geometryType;
    },

    onExecute: function(featureSet){
      var center;
      if(featureSet.features.length > 0){
        var extent = graphicsUtils.graphicsExtent(featureSet.features);
        center = extent.getCenter();
      }else{
        var geometry = featureSet.features[0].geometry;
        if(geometry.type === 'polyline' || geometry.type === 'polygon'){
          center = geometry.getExtent().getCenter();
        }else if(geometry.type === 'extent'){
          center = geometry.getCenter();
        }else if(geometry.type === 'multipoint'){
          if(geometry.points.length > 1){
            center = geometry.getExtent().getCenter();
          }else{
            center = geometry.getPoint(0);
          }
        }else{
          center = geometry;
        }
      }

      this.map.centerAt(center);
    }

  });
  return clazz;
});