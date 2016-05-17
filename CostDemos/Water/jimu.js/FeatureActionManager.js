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

define(['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/Deferred',
    'dojo/promise/all',
    './featureActions/main',
    './utils'
  ],
  function(declare, lang, array, topic, Deferred, all, frameWorkActions, jimuUtils) {
    var instance = null,
    clazz = declare(null, {

      constructor: function() {
        this._actions = [];

        if(window.isBuilder){
          topic.subscribe("app/mapLoaded", lang.hitch(this, this._onMapLoaded));
          topic.subscribe("app/mapChanged", lang.hitch(this, this._onMapChanged));
        }else{
          topic.subscribe("mapLoaded", lang.hitch(this, this._onMapLoaded));
          topic.subscribe("mapChanged", lang.hitch(this, this._onMapChanged));
        }

        // if(window.isBuilder){
        //   topic.subscribe("app/sceneViewLoaded", lang.hitch(this, this._onSceneViewLoaded));
        //   topic.subscribe("app/sceneViewChanged", lang.hitch(this, this._onSceneViewChanged));
        // }else{
        //   topic.subscribe("sceneViewLoaded", lang.hitch(this, this._onSceneViewLoaded));
        //   topic.subscribe("sceneViewChanged", lang.hitch(this, this._onSceneViewChanged));
        // }

        if(window.isBuilder){
          topic.subscribe("app/appConfigLoaded", lang.hitch(this, this._onAppConfigLoaded));
          topic.subscribe("app/appConfigChanged", lang.hitch(this, this._onAppConfigChanged));
        }else{
          topic.subscribe("appConfigLoaded", lang.hitch(this, this._onAppConfigLoaded));
          topic.subscribe("appConfigChanged", lang.hitch(this, this._onAppConfigChanged));
        }

        this._registerFrameworkActions();
      },

      getAllActions: function(){
        return this._actions;
      },

      getSupportedActions: function(featureSet){
        featureSet = this._getFeatureSet(featureSet);
        var defs = [];
        array.forEach(this._actions, function(action){
          var def = this.testActionSupportFeature(action, featureSet);
          def.action = action;
          defs.push(def);
        }, this);

        return all(defs).then(lang.hitch(this, function(results){
          return results.map(lang.hitch(this, function(result, i){
            return {
              result: result,
              action: this._actions[i]
            };
          })).filter(function(obj){
            return obj.result;
          }).map(function(obj){
            return obj.action;
          });
        }));
      },

      testActionSupportFeature: function(action, featureSet){
        featureSet = this._getFeatureSet(featureSet);
        var ret = action.isFeatureSupported(featureSet);
        var def = new Deferred();
        if(typeof ret.then === 'function'){
          //if action def reject, we change to resolve(false) here.
          ret.then(function(result){
            def.resolve(result);
          }, function(err){
            console.error(err);
            def.resolve(false);
          });
        }else{
          def.resolve(ret);
        }
        return def;
      },

      registerAction: function(actionOptions){
        var def = new Deferred();
        require([actionOptions.uri], lang.hitch(this, function(actionClass){
          var action = new actionClass({
            map: this.map,
            appConfig: this.appConfig,
            label: actionOptions.label,
            name: actionOptions.name,
            widgetId: actionOptions.widgetId
          });

          //make sure one action is registered once only, for one widget
          if(array.some(this._actions, function(_action){
            return action.name === _action.name && action.widgetId === _action.widgetId;
          })){
            console.warn('Feature/FeatureSet action has been registered.', action.name);
            def.reject('Feature/FeatureSet action has been registered.', action.name);
            return;
          }

          this._actions.push(action);
          def.resolve(action);
        }));

        return def;
      },

      removeActionsByWidgetId: function(widgetId){
        this._actions = array.filter(this._actions, function(_action) {
          return _action.widgetId !== widgetId;
        }, this);
      },

      getActionsByWidgetId: function(widgetId){
        return array.filter(this._actions, function(_action) {
          return _action.widgetId === widgetId;
        }, this);
      },

      _registerFrameworkActions: function(){
        array.forEach(frameWorkActions, function(action){
          this.registerAction({
            uri: action.uri,
            widgetId: 'framework',
            label: window.jimuNls.featureActions[action.name],
            name: action.name
          });
        }, this);
      },

      _getFeatureSet: function(val){
        //val can be: feature, [feature], featureSet
        if(Object.prototype.toString.call(val) === '[object Object]'){
          if(!val.features){
            return jimuUtils.toFeatureSet([val]);
          }else{
            return val;
          }
        }else{
          return jimuUtils.toFeatureSet(val);
        }
      },

      _onAppConfigLoaded: function(_appConfig) {
        var appConfig = lang.clone(_appConfig);
        this.appConfig = appConfig;
        this._setActionsAppConfig(_appConfig);
      },

      _onMapLoaded: function(map) {
        this.map = map;
        this._setActionsMap(map);
      },

      _onMapChanged: function(map) {
        this.map = map;
        this._setActionsMap(map);
      },

      _setActionsMap: function(map){
        array.forEach(this._actions, function(_action) {
          _action.setMap(map);
        }, this);
      },

      _onAppConfigChanged: function(_appConfig) {
        var appConfig = lang.clone(_appConfig);
        this.appConfig = appConfig;
        this._setActionsAppConfig(_appConfig);
      },

      _setActionsAppConfig: function(appConfig){
        array.forEach(this._actions, function(_action) {
          _action.setAppConfig(appConfig);
        }, this);
      }
    });

    clazz.getInstance = function() {
      if (instance === null) {
        instance = new clazz();
        window._featureActionManager = instance;
      }
      return instance;
    };
    return clazz;
  });