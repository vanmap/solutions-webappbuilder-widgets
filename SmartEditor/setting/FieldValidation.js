define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    'dojo/on',
    "dojo/text!./FieldValidation.html",
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    "jimu/dijit/Popup",
    'jimu/dijit/Filter'
  ],
  function (
    declare,
    lang,
    array,
    on,
    template,
    _TemplatedMixin,
    BaseWidgetSetting,
    Table,
    Popup,
    Filter
    ) {
    return declare([BaseWidgetSetting, _TemplatedMixin], {
      baseClass: "jimu-widget-smartEditor-validation-table",
      templateString: template,
      _layerInfo: null,
      _fieldName: null,
      postCreate: function () {
        this.inherited(arguments);
        this.nls = lang.mixin(this.nls, window.jimuNls.common);
        this._initActionsTable();
        this._setActionsTable(['Hide', 'Required', 'Disabled']);
      },

      popupActionsPage: function () {
        var fieldsPopup = new Popup({
          titleLabel: this.nls.configureActions,
          width: 720,
          maxHeight: 600,
          autoHeight: true,
          content: this,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function () {

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

      _initActionsTable: function () {
        var fields2 = [{
          name: 'label',
          title: this.nls.fieldValidation.state,
          type: 'text',
          editable: true
        }, {
          name: 'actions',
          title: this.nls.actions,
          type: 'actions',
          actions: ['edit'],
          'class': 'editable'
        }];
        var args2 = {
          fields: fields2,
          selectable: false,
          style: {
            'height': '300px',
            'maxHeight': '300px'
          }
        };
        this._validationTable = new Table(args2);
        this._validationTable.placeAt(this.validationTable);
        this._validationTable.startup();
        this.own(on(this._validationTable,
          'actions-edit',
          lang.hitch(this, this._onEditFieldInfoClick)));
      },
      _onEditFieldInfoClick: function (tr) {
        var rowData = this._validationTable.getRowData(tr);
        if (rowData) {
          this._showFilter(rowData);
          //var editFields = new EditFields({
          //  nls: this.nls,
          //  _layerInfo: tr._layerInfo
          //});
          //editFields.popupEditPage();
        }
      },
      _setActionsTable: function (actions) {
        array.forEach(actions, function (action) {
          this._validationTable.addRow({
            label: action
          });
        }, this);
      },
      _showFilter: function (rowData) {

        var filter = new Filter({
          style: "width:100%;margin-top:22px;"
        });
        var filterPopup = new Popup({
          titleLabel: this.nls.fieldValidation.filterPopup,
          width: 680,
          height: 485,
          content: filter,
          rowData: rowData,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function () {
              var partsObj = filter.toJson();
              if (partsObj && partsObj.expr) {
                if (partsObj.expr === '1=1') {

                } else {
                  if (this._layerInfo.fieldValidations === undefined || this._layerInfo.fieldValidations === null) {
                    this._layerInfo.fieldValidations = [];

                  }
                  this._layerInfo.fieldValidations.push(
                   {
                     'fieldName': this._fieldName,
                     'action': rowData.label,
                     'values': partsObj.expr

                   })
                }

                filterPopup.close();
                filterPopup = null;
              } else {

              }
            })
          }, {
            label: this.nls.cancel,
            classNames: ['jimu-btn-vacation']
          }]
        });
        filter.buildByExpr(this._layerInfo.mapLayer.url, null, this._layerInfo.mapLayer.resourceInfo);
        //var filterObj = workLayer.layerObject.getDefinitionExpression();
        //if (expression.expr !== '') {
        //  filter.buildByFilterObj(url, expression.expr, definition);
        //} else {
        //  filter.buildByExpr(url, null, definition);
        //}

      }

    });
  });