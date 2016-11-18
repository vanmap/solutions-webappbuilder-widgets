
define([
  "dojo/_base/declare",
  'dojo/_base/array',
  "dojo/_base/lang",
  'dojo/_base/Color',
  "dojo/on",
  "dijit/_WidgetsInTemplateMixin",
  "jimu/BaseWidgetSetting",
  "jimu/dijit/CheckBox",
  "jimu/dijit/ColorPickerButton",
  "dijit/form/TextBox",
  "dojo/parser",
  'jimu/LayerInfos/LayerInfos',
  'dojo/_base/html'
  
], function(
  declare, 
  arrayUtils, 
  lang, 
  Color, 
  on, 
  _WidgetsInTemplateMixin, 
  BaseWidgetSetting,
  CheckBox,
  colorPickerButton,
  textBox, 
  parser, 
  LayerInfos,
  html
  ) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

    baseClass: 'jimu-widget-select-setting',
    //get a list of feature services from the web map
    //enable user to choose feature service
    //enable user to select fields to map to, offer options on what to do with the omitted fields

    _jimuLayerInfos: null,
    _layersTable: null,
    _editableLayerInfos: null,


      startup: function() {
        this.inherited(arguments);
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            this._jimuLayerInfos = operLayerInfos;
            this._init();
            this.setConfig();
          }));
      },




      getConfig: function() {

        var layersTableData =  this._layersTable.getData();
          array.forEach(this._editableLayerInfos, function(layerInfo, index) {
            layerInfo._editFlag = layersTableData[index].edit;
            layerInfo.disableGeometryUpdate = layersTableData[index].disableGeometryUpdate;
         // if(layerInfo._editFlag) {
           // delete layerInfo._editFlag;
              checkedLayerInfos.push(layerInfo);
         // }
          });
      return this.config;
    },

     _init: function() {
       // this._initToolbar();
       // this._initLayersTable();
    },


     _setLayersTable: function(LayerInfos) {
        array.forEach(LayerInfos, function(layerInfo) {
          var _jimuLayerInfo = this._jimuLayerInfos.getLayerInfoById(layerInfo.featureLayer.id);
          var addRowResult = this._layersTable.addRow({
            label: _jimuLayerInfo.title,
            edit: layerInfo._editFlag,
            disableGeometryUpdate: layerInfo.disableGeometryUpdate
          });
          addRowResult.tr._layerInfo = layerInfo;

          // var editableCheckBox;
          // var editableCheckBoxDomNode = query(".editable .jimu-checkbox", addRowResult.tr)[0];
          // if(editableCheckBoxDomNode) {
          //   editableCheckBox = registry.byNode(editableCheckBoxDomNode);
          //   // this.own(on(editableCheckBox,
          //   // 'change',
          //   // lang.hitch(this, function() {
          //   //   console.log(layerInfo.id);
          //   // })));
          //   editableCheckBox.onChange = lang.hitch(this, function(checked) {
          //     layerInfo._editFlag = checked;
          //   });
          // }
        }, this);
      },

   
   

     setConfig: function() {
        // if (!config.editor.layerInfos) { //***************
        //   config.editor.layerInfos = [];
        // }
        this._editableLayerInfos = this._getEditableLayerInfos();
        this._setLayersTable(this._editableLayerInfos);
      },

 
  });
});