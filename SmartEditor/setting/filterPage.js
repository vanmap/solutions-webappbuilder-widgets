define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    'dojo/on',
    'dojo/query',
    'dojo/json',
    'dojo/dom-style',
    "dojo/text!./FilterPage.html",
    'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
    "jimu/dijit/Popup",
        'jimu/dijit/Filter',
    'esri/lang'
  ],
  function (
    declare,
    lang,
    array,
    on,
    query,
    JSON,
    domStyle,
    template,
    _TemplatedMixin,
    BaseWidgetSetting,
    Popup,
    Filter,
    esriLang) {
    return declare([BaseWidgetSetting, _TemplatedMixin], {
      baseClass: "jimu-widget-smartEditor-filter-page",
      templateString: template,
      _filter: null,
      _url: null,
      _resourceInfo: null,
      _validationTable: null,
      postCreate: function () {
        this.inherited(arguments);
        this._init();
      },
      _init: function () {
        this._origNLS = window.jimuNls.filterBuilder.matchMsg;

        window.jimuNls.filterBuilder.matchMsg = this.nls.filterPage.filterBuilder;

      

      },
      destroy: function () {
        window.jimuNls.filterBuilder.matchMsg = this._origNLS;
        this._filter = null;
        delete this._filter;
      },
      popup: function (tr) {

        var rowData = this._validationTable.getRowData(tr);
        if (rowData) {
          this._filter = new Filter({
            style: "width:100%;margin-top:22px;",
            noFilterTip: this.nls.filterPage.noFilterTip
          });
          this._filter.placeAt(this.filterControl);
          var filterPopup = new Popup({

            titleLabel: esriLang.substitute(
              {
                action: rowData.label
              },
              this.nls.filterPage.title),
            width: 680,
            height: 485,
            content: this,
            rowData: rowData,
            buttons: [{
              label: this.nls.ok,
              onClick: lang.hitch(this, function () {
                var partsObj = this._filter.toJson();
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
              classNames: ['jimu-btn jimu-btn-vacation'],
              onClick: function () {
                filterPopup.close();
                filterPopup = null;
              }
            }]
          });

          if (rowData.filter === undefined ||
              rowData.filter === null ||
            rowData.filter === '') {
            this._filter.buildByExpr(this._url, null, this._resourceInfo);
          }
          else {

            this._filter.buildByExpr(this._url, entities.decode(rowData.expression), this._resourceInfo);

          }


        }
      }

    });
  });