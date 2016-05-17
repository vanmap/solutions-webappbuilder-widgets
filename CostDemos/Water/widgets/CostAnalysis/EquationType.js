define([
    'dojo/_base/declare',
    'dojo/_base/html',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/query',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/text!./EquationType.html',
    './Common',

    'dijit/registry',
    'dijit/form/TextBox',
    'dijit/form/Select',
    'dojo/ready',
    'dojo/store/Memory',

    'esri/lang'
  ],
    function (
        declare,
        html,
        lang,
        on,
        query,

        _WidgetBase,
        _TemplatedMixin,
        _WidgetsInTemplateMixin,

        template,
        Common,

        registry,
        TextBox,
        Select,
        ready,
        Memory,

        esriLang

    ) {
        return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-equation-type',
            templateString: template,
            eqtGeography: null,
            eqtGeographyID: null,
            geographyEquationTypes: {},


            postCreate: function () {
                this.inherited(arguments);
            },

            startup: function () {
                this.inherited(arguments);

                //set Geography name
                this.geographyName.set("value", this.eqtGeography);

                //load geography Equation Types
                this.selectEquationType();
            },

            selectEquationType: function () {

                ready(lang.hitch(this, function () {
                    var data = {
                        identifier: 'value',
                        items: [],
                        label: 'equationType'
                    };

                    for (var i = 0; i < this.geographyEquationTypes.length; i++) {
                        var geographyid = Common.getFieldvalue(this.geographyEquationTypes[i].attributes, 'COSTGEOMID');
                        var eqtType = Common.getFieldvalue(this.geographyEquationTypes[i].attributes, 'EQUATIONTYPE');

                        if (geographyid === null) {
                            geographyid = '';
                        }
                        if (this.eqtGeographyID === geographyid) {
                            data.items.push(lang.mixin({
                                "equationType": eqtType
                            }, {
                                "value": eqtType
                            }));
                        }
                    }

                    var equationTypeStore = new Memory({
                        data: data,
                        idProperty: "value"
                    });

                    dijit.byId("selectCostEquationType").set("labelAttr", "value");
                    dijit.byId("selectCostEquationType").setStore(equationTypeStore);

                }));
            }

        });
    });