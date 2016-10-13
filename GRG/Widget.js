///////////////////////////////////////////////////////////////////////////
// Copyright (c) 2015 Esri. All Rights Reserved.
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
  'dojo/topic',
  'dojo/aspect',
  'dijit/registry',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer3',
  './views/TabCreateAreaGRG',
  './views/TabCreatePointGRG',
  './views/TabDeleteGRG'
], function (
  dojoDeclare,
  dojoTopic,
  aspect,
  registry,
  dijitWidgetsInTemplate,
  jimuBaseWidget,
  JimuTabContainer3,
  TabCreateAreaGRG,
  TabCreatePointGRG,
  TabDeleteGRG
) {
  'use strict';
  var clz = dojoDeclare([jimuBaseWidget, dijitWidgetsInTemplate], {
    baseClass: 'jimu-widget-GRG',

    /**
     *
     **/
    postCreate: function () {

      this.createAreaGRGTab = new TabCreateAreaGRG({
        map: this.map,
        canavasAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,0,255,0],
          outline: {
            color: [0, 0, 255, 255],
            width: 1.25,
            type: 'esriSLS',
            style: 'esriSLSSolid'
          }
        },
        cellAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,255,0,0],
          outline: {
            color: [0, 255, 0, 255],
            width: 1.25,
            type: 'esriSLS',
            style: 'esriSLSSolid'
          }
        }
        },
        this.createTabAreaNode
      );
      
      this.createPointGRGTab = new TabCreatePointGRG({
        map: this.map,
        pointSymbol: {
          'color': [255, 0, 0, 255],
          'size': 8,
          'type': 'esriSMS',
          'style': 'esriSMSCircle',
          'outline': {
              'color': [255, 0, 0, 255],
              'width': 1,
              'type': 'esriSLS',
              'style': 'esriSLSSolid'
          }
        },
        cellAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,255,0,0],
          outline: {
            color: [0, 255, 0, 255],
            width: 1.25,
            type: 'esriSLS',
            style: 'esriSLSSolid'
          }
        }
        },
        this.createTabPointNode
      );

      this.removeGRGTab = new TabDeleteGRG({
        map: this.map
        },
        this.deleteTabNode
      );

      this.tab = new JimuTabContainer3({
        tabs: [
          {
            title: 'Area',
            content: this.createAreaGRGTab
          },
          {
            title: 'Point',
            content: this.createPointGRGTab
          },
          {
            title: 'Remove',
            content: this.removeGRGTab
          }
        ]
      }, this.tabContainer);
      
      var tabContainer1 = registry.byId('tabContainer');
    
      aspect.after(tabContainer1, "selectTab", function() {
          dojoTopic.publish('TAB_SWITCHED');        
      });
    },

    onClose: function () {
      dojoTopic.publish('DD_WIDGET_CLOSE');
    },

    onOpen: function () {
      dojoTopic.publish('DD_WIDGET_OPEN');
    }
  });
  return clz;
});
