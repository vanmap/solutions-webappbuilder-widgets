define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    'dojo/on',
    "dojo/text!./EditFields.html",
     "./FieldValidation",
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    "jimu/dijit/Popup"
  ],
  function (
    declare,
    lang,
    array,
    on,
    template,
    FieldValidation,
    _TemplatedMixin,
    BaseWidgetSetting,
    Table,
    Popup) {
    return declare([BaseWidgetSetting, _TemplatedMixin], {
      baseClass: "jimu-widget-smartEditor-setting-fields",
      templateString: template,
      _layerInfo: null,
      _fieldValid: null,
      _fieldValidations:null,
      postCreate: function () {
        this.inherited(arguments);
        this._initFieldsTable();
        this._setFiedsTable(this._layerInfo.fieldInfos);
        this._fieldValidations = this._layerInfo.fieldValidations === undefined ? {} : lang.clone(this._layerInfo.fieldValidations)
      },

      popupEditPage: function () {
        var fieldsPopup = new Popup({
          titleLabel: this.nls.fieldsPage.PageTitle,
          width: 720,
          maxHeight: 700,
          autoHeight: true,
          content: this,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function () {
              this._resetFieldInfos();
              
              this._layerInfo.fieldValidations = this._fieldValidations;
              //if (this._fieldValid !== undefined && this._fieldValid !== null) {
                //var savedSettings = this._fieldValid.getSettings();
                //if (savedSettings !== undefined && savedSettings !== null) {
                //  this._layerInfo.fieldValidations = {};
                //  for (var k in savedSettings) {
                //    if (savedSettings.hasOwnProperty(k)) {
                //      this._layerInfo.fieldValidations[k] =this._fieldValidations 
                //    }
                //  }
                //}
              //}

              fieldsPopup.close();
            })
          }, {
            label: this.nls.cancel,
            classNames: ['jimu-btn-vacation'],
            onClick: lang.hitch(this, function () {
              fieldsPopup.close();
            })
          }],
          onClose: lang.hitch(this, function () {
          })
        });
      },

      _initFieldsTable: function () {
        var fields2 = [{
          name: 'isEditable',
          title: this.nls.fieldsPage.fieldsSettingsTable.edit,
          type: 'checkbox',
          'class': 'editable'
        }, {
          name: 'canPresetValue',
          title: this.nls.fieldsPage.fieldsSettingsTable.canPresetValue,
          type: 'checkbox',
          'class': 'preset'
        }, {
          name: 'fieldName',
          title: this.nls.fieldsPage.fieldsSettingsTable.fieldName,
          type: 'text',
          'class': 'fieldName'
        }, {
          name: 'label',
          title: this.nls.fieldsPage.fieldsSettingsTable.fieldAlias,
          type: 'text',
          editable: true,
          'class': 'fieldLabel'
        }, {
          name: 'actions',
          title: this.nls.fieldsPage.fieldsSettingsTable.actions,
          type: 'actions',
          actions: ['up', 'down', 'edit'],
          'class': 'action'
        }];

        var args2 = {
          fields: fields2,
          selectable: false,
          style: {
            'height': '300px',
            'maxHeight': '300px'
          }
        };
        this._fieldsTable = new Table(args2);
        this._fieldsTable.placeAt(this.fieldsTable);
        this._fieldsTable.startup();
        this.own(on(this._fieldsTable,
          'actions-edit',
          lang.hitch(this, this._onEditFieldInfoClick)));
      },
      _onEditFieldInfoClick: function (tr) {
        var rowData = this._fieldsTable.getRowData(tr);
        if (rowData && rowData.isEditable) {
          this._fieldValid = new FieldValidation({
            nls: this.nls,
            _resourceInfo: this._layerInfo.mapLayer.resourceInfo,
            _url: this._layerInfo.mapLayer.url,
            _fieldValidations: this._fieldValidations,
            _fieldName: rowData.fieldName,
            _fieldAlias: rowData.label
          });
          var result = this._fieldValid.popupActionsPage();
          if (result !== null) {

          }
        }
      },
      _setFiedsTable: function (fieldInfos) {
        array.forEach(fieldInfos, function (fieldInfo) {
          this._fieldsTable.addRow({
            fieldName: fieldInfo.fieldName,
            isEditable: fieldInfo.isEditable,
            canPresetValue: fieldInfo.canPresetValue,
            label: fieldInfo.label
          });
        }, this);
      },

      _resetFieldInfos: function () {
        var newFieldInfos = [];
        var fieldsTableData = this._fieldsTable.getData();
        array.forEach(fieldsTableData, function (fieldData) {
          newFieldInfos.push({
            "fieldName": fieldData.fieldName,
            "label": fieldData.label,
            "canPresetValue": fieldData.canPresetValue,
            "isEditable": fieldData.isEditable
          });
        });

        this._layerInfo.fieldInfos = newFieldInfos;
      }

    });
  });