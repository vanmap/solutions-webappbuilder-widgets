define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/_base/array',
    'dojo/Deferred', 
    'dojo/dom-construct',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/registry',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    './VisibilityControl'
	],

function(
    dojoDeclare,
    dojoLang,
    dojoTopic,
    dojoArray,
    Deferred,
    domConstruct,
    dijitWidgetsInTemplateMixin,
    dijitRegistry,
    jimuBaseWidget,
    jimuMessage,
    VisibilityControl
  ){
	  var clazz = dojoDeclare([jimuBaseWidget, dijitWidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-visiblity',      

		  startup: function(){
        if (this.config) {
          if (this.config.viewshedService.url) {
            if (!this._isURL(this.config.viewshedService.url)) {
              new jimuMessage({message: "Please supply a valid viewshed service."});
              return;
            }
          }
        }        
        var visibilityCtrl = new VisibilityControl({
          viewshedService: this.config.viewshedService,
          map: this.map
        }, domConstruct.create("div")).placeAt(this.visibilityContainer);
        visibilityCtrl.startup();
      },

      _isURL: function(s) {
        // source: http://stackoverflow.com/questions/1701898/how-to-detect-whether-a-string-is-in-url-format-using-javascript
       var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
       return regexp.test(s);
      },
    });
    return clazz;
});  