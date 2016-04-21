define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    'dojo/on',
    "dojox/html/entities",
    "dojo/text!./FieldValidation.html",
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    "jimu/dijit/Popup",
    'jimu/dijit/Filter',
    'esri/lang'
  ],
  function (
    declare,
    lang,
    array,
    on,
    entities,
    template,
    _TemplatedMixin,
    BaseWidgetSetting,
    Table,
    Popup,
    Filter,
    esriLang
    ) {
    return declare([BaseWidgetSetting, _TemplatedMixin], {
      baseClass: "jimu-widget-smartEditor-rule-table",
      templateString: template,
      _resourceInfo: null,
      _url: null,
      _fieldName: null,
      _fieldValidations: null,
      postCreate: function () {
        this.inherited(arguments);
        this._initActionsTable();

        this._setActionsTable(['Hide', 'Required', 'Disabled']);

      },
      getSettings: function () {
        return this._fieldValidations;
      },
      _getConfigAction: function (actionName) {
        var result = null;
        if (this._fieldValidations !== undefined &&
          this._fieldValidations !== null) {
          if (this._fieldValidations.hasOwnProperty(this._fieldName)) {
            if (this._fieldValidations[this._fieldName].hasOwnProperty(actionName)) {
              return this._fieldValidations[this._fieldName][actionName];
            }


          }
        }
        return result;
      },

      popupActionsPage: function () {

        var fieldsPopup = new Popup({
          titleLabel: esriLang.substitute(
            { fieldname: this._fieldAlias },
            this.nls.actionPage.PageTitle),
          width: 720,
          maxHeight: 600,
          autoHeight: true,
          content: this,
          buttons: [{
            label: this.nls.ok,
            onClick: lang.hitch(this, function () {
              var rows = this._validationTable.getRows();
              if (this._fieldValidations === undefined ||
                this._fieldValidations === null) {
                this._fieldValidations = {};
              }

              //this._fieldActions[this._fieldName] = [];
              this._fieldValidations[this._fieldName] = {};
              array.forEach(rows, function (row) {
                var rowData = this._validationTable.getRowData(row);
                if (rowData.expression !== undefined && rowData.expression !== null &&
                  rowData.expression !== '') {
                  if (rowData.filter !== '') {
                    var filter = JSON.parse(entities.decode(rowData.filter))
                    this._fieldValidations[this._fieldName][rowData.label] =
                        {
                          'expression': filter.expr,
                          'filter': filter
                        };
                  }

                }
              }, this);

              fieldsPopup.close();
              return this._fieldValidations;
            })
          }, {
            label: this.nls.cancel,
            classNames: ['jimu-btn-vacation'],
            onClick: lang.hitch(this, function () {

              fieldsPopup.close();
              return null;
            })
          }],
          onClose: lang.hitch(this, function () {
          })
        });
      },

      _initActionsTable: function () {
        var fields2 = [{
          name: 'label',
          title: this.nls.actionPage.actionsSeetingsTable.rule,
          type: 'text',
          'class': 'rule'
        }, {
          name: 'expression',
          title: this.nls.actionPage.actionsSeetingsTable.expression,
          type: 'text',
          'class': 'expression'
        },
         {
           name: 'filter',
           title: 'filter',
           type: 'text',
           hidden: true
         },
        {
          name: 'actions',
          title: this.nls.actionPage.actionsSeetingsTable.actions,
          type: 'actions',
          actions: ['up', 'down', 'edit'],
          'class': 'actions'
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
        this.own(on(this._validationTable,
         'actions-delete',
         lang.hitch(this, this._onDeleteFieldInfoClick)));
      },

      _onDeleteFieldInfoClick: function (tr) {

        this._removeFilter(tr);

      },
      _onEditFieldInfoClick: function (tr) {

        this._showFilter(tr);

      },

      _setActionsTable: function (actions) {

        array.forEach(actions, function (action) {
          var configAction = this._getConfigAction(action);
          var settings = {
            label: action,
            expression: null
          };
          if (configAction !== undefined && configAction !== null) {
            if (configAction.expression !== undefined &&
              configAction.expression !== null && configAction.expression !== '') {

              settings.expression = configAction.expression;
              settings.filter = JSON.stringify(configAction.filter);
            }
          }
          this._validationTable.addRow(settings);


        }, this);
      },
      _removeFilter: function (tr) {
        this._validationTable.editRow(tr,
                    {
                      'expression': '',
                      'filter': null
                    });
      },
      _showFilter: function (tr) {
        var rowData = this._validationTable.getRowData(tr);
        if (rowData) {
          var origNLS = window.jimuNls.filterBuilder.matchMsg;

          window.jimuNls.filterBuilder.matchMsg = this.nls.filterPage.filterBuilder;

          var filter = new Filter({
            style: "width:100%;margin-top:22px;",
            noFilterTip: this.nls.filterPage.noFilterTip
          });

          var filterPopup = new Popup({

            titleLabel: esriLang.substitute(
              {
                action: rowData.label
              },
              this.nls.filterPage.PageTitle),
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
                    this._validationTable.editRow(tr,
                     {
                       'expression': '',
                       'filter': null
                     });
                  } else {
                    this._validationTable.editRow(tr,
                      {
                        'expression': partsObj.expr,
                        'filter': JSON.stringify(partsObj)
                      });
                  }

                  filterPopup.close();
                  filterPopup = null;
                }
              })
            }, {
              label: this.nls.cancel,
              classNames: ['jimu-btn-vacation']
            }]
          });

          if (rowData.filter === undefined ||
              rowData.filter === null ||
            rowData.filter === '') {
            filter.buildByExpr(this._url, null, this._resourceInfo);
          }
          else {

            filter.buildByExpr(this._url, entities.decode(rowData.expression), this._resourceInfo);
            //filter.buildByFilterObj(this._layerInfo.mapLayer.url, rowData.filter, this._layerInfo.mapLayer.resourceInfo);
          }

          //if (rowData.expression === undefined ||
          //  rowData.expression === null ||
          //  rowData.expression === '') {
          //  filter.buildByExpr(this._layerInfo.mapLayer.url, null, this._layerInfo.mapLayer.resourceInfo);

          //} else {
          //  filter.buildByExpr(this._layerInfo.mapLayer.url, rowData.expression, this._layerInfo.mapLayer.resourceInfo);
          //}

          window.jimuNls.filterBuilder.matchMsg = origNLS;

        }
      }

    });
  });