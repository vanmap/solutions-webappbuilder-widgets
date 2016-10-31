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
  'esri/IdentityManager',
  'esri/arcgis/OAuthInfo',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidget',
  'jimu/dijit/TabContainer',
  './views/TabCreateAreaGRG',
  './views/TabCreatePointGRG'
], function (
  dojoDeclare,
  dojoTopic,
  aspect,
  registry,
  esriId,
  OAuthInfo,
  dijitWidgetsInTemplate,
  jimuBaseWidget,
  TabContainer,
  TabCreateAreaGRG,
  TabCreatePointGRG
) {
  'use strict';
  var clz = dojoDeclare([jimuBaseWidget, dijitWidgetsInTemplate], {
    baseClass: 'jimu-widget-GRG',
  /**
     *
     **/
    postCreate: function () {
      //when widget opens check to see if user is logged in, if not force user to login
      var info = this.appLogin();
      
      this.createAreaGRGTab = new TabCreateAreaGRG({
        map: this.map,
        esriId: esriId,
        info: info,
        GRGAreaFillSymbol: {
          type: 'esriSFS',
          style: 'esriSFSNull',
          color: [0,0,255,0],
          outline: {
            color: [0, 0, 255, 255],
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
        esriId: esriId,
        info: info,
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

      this.tab = new TabContainer({
        tabs: [
          {
            title: 'Create GRG By Area',
            content: this.createAreaGRGTab,
                   
          },
          {
            title: 'Create GRG By Point',
            content: this.createPointGRGTab
          }
        ]
      }, this.tabContainer);
     
      this.tab.selectTab('Create GRG By Area');
      
      var tabContainer1 = registry.byId('tabContainer');
    
      aspect.after(tabContainer1, "selectTab", function() {
          dojoTopic.publish('TAB_SWITCHED');        
      });
    },
    
    appLogin: function () {
      var info = new OAuthInfo({
          appId : this.appConfig.appId,
          portalUrl : this.appConfig.portalUrl,
          popup : false,
          popupCallbackUrl: window.location.href
        });
      
      esriId.registerOAuthInfos([info]);
      esriId.checkSignInStatus(info.portalUrl + "/sharing").then(
        function () {
        console.log('logged in');
      }).otherwise(
        function (error) {
        console.log(error);
        esriId.getCredential(info.portalUrl + "/sharing", {
          oAuthPopupConfirmation : false
        }).then(function () {
          console.log('logged in');
        });
      });
      return info;
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
