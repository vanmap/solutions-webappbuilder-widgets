define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dijit/_WidgetBase',
  'dojo/on',
  'dojo/topic',
  'jimu/WidgetManager',
  'jimu/PopupActions/PopupAction'
], function(
  declare, lang, _WidgetBase, on, topic, WidgetManager, PopupAction
) {
  return declare([_WidgetBase], {
    name: null,
    map: null,
    popupUnion: null,
    directionWidgetState: null,
    //attrWidget: null,
    appConfig: null,

    constructor: function() {
      this.own(topic.subscribe("appConfigChanged", lang.hitch(this, this._onAppConfigChanged)));
    },

    postCreate: function() {
      this.inherited(arguments);

      this.getDirectionsBtn = new PopupAction({
        popupUnion: this.popupUnion,
        buttonInfo: {
          label: window.jimuNls.popupManager.getDirections,
          baseClass: "get-directions",
          'onClick': lang.hitch(this, this._onGetDirectionsClick)
        }
      });

      this._updateDirectionWidgetState();

      this.own(on(this.getDirectionsBtn,
                  "selectionChange",
                  lang.hitch(this, this._onSelectionChange)));

    },


    _updateDirectionWidgetState: function() {
      this.directionWidgetState =
            this.appConfig.getConfigElementsByName("Directions")[0];
    },

    _onGetDirectionsClick: function(selectedFeature, showEvent) {
      /*jshint unused: false*/
      if(this.directionWidgetState && this.directionWidgetState.visible) {
        WidgetManager.getInstance().triggerWidgetOpen(this.directionWidgetState.id)
        .then(lang.hitch(this, function(directionWidget) {
          directionWidget.setStartStop(showEvent.target.location);
        }));
      }
    },

    _onSelectionChange: function(selectedFeature) {
      /*jshint unused: false*/
      if( this.directionWidgetState &&
          this.directionWidgetState.visible) {
        this.show();
      } else {
        this.hide();
      }
    },

    _onAppConfigChanged: function(appConfig) {
      this.appConfig = appConfig;
      this._updateDirectionWidgetState();
    },

    show: function() {
      this.getDirectionsBtn.show();
    },

    hide: function() {
      this.getDirectionsBtn.hide();
    },

    destroy: function() {
      this.getDirectionsBtn.destroy();
      this.inherited(arguments);
    }
  });
});