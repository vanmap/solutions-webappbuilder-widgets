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
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/ValidationTextBox'
],
    function (declare, BaseWidgetSetting, _WidgetsInTemplateMixin) {
        return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

            baseClass: 'jimu-widget-setting-grg',

            startup: function () {
                this.inherited(arguments);
                if (!this.config.createAreaGRGService) {
                    this.config.createAreaGRGService = {
                      url: {}
                    };
                }
                if (!this.config.createPointGRGService) {
                    this.config.createPointGRGService = {
                      url: {}
                    };
                }
                if (!this.config.deleteGRGService) {
                    this.config.deleteGRGService = {
                      url: {}
                    };
                }
                if (!this.config.gridFeatureService) {
                    this.config.gridFeatureService = {
                      url: {}
                    };
                }                                                
                this.setConfig(this.config);
            },

            setConfig: function (config) {
                this.config = config;
                if (config.createAreaGRGService.url !== undefined) {
                    this.createAreaServiceUrl.set('value', config.createAreaGRGService.url);
                }
                if (config.createPointGRGService.url !== undefined) {
                    this.createPointServiceUrl.set('value', config.createPointGRGService.url);
                }
                if (config.deleteGRGService.url !== undefined) {
                    this.deleteServiceUrl.set('value', config.deleteGRGService.url);
                }
                if (config.gridFeatureService.url !== undefined) {
                    this.gridAreaServiceUrl.set('value', config.gridFeatureService.url);
                }                                                
            },

            getConfig: function () {
                this.config.createAreaGRGService.url = this.createAreaServiceUrl.get('value');
                this.config.createPointGRGService.url = this.createPointServiceUrl.get('value');
                this.config.deleteGRGService.url = this.deleteServiceUrl.get('value');
                this.config.gridFeatureService.url = this.gridAreaServiceUrl.get('value');                                                
                return this.config;
            }
        });
    });