///////////////////////////////////////////////////////////////////////////
// Helyx SIS Helicopter Planning Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define([
  'dojo/_base/declare',
  'jimu/BaseWidget',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/on',
  'dojo/aspect',
  'dojo/_base/lang',
  'dojo/_base/array',
  'esri/symbols/SimpleLineSymbol',
  'esri/dijit/Measurement',
  'esri/geometry/geometryEngine',
  'dojo/i18n!esri/nls/jsapi',
  'dojo/query',
  'jimu/dijit/SimpleTable'  
],
  function (declare, BaseWidget, _WidgetsInTemplateMixin,
    on, aspect, lang, array, SimpleLineSymbol, Measurement, geometryEngine, esriBundle, query) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'widget-heli-planning',
      declaredClass: 'HeliPlanning',
      elevLineSymbol: null,
      measureTool: null,
      lastMeasure: null,
      distance: null,
      
      

      postCreate: function () {
        this.inherited(arguments);
        var target = false,
            tooltip = false,
            tip = false;
                
        this._initMeasureTool = lang.hitch(this, this._initMeasureTool);
        this._setTable(this.config.HeliParams);
        
        if (this.config.symbols && this.config.symbols.simplelinesymbol) {
          this.elevLineSymbol = new SimpleLineSymbol(this.config.symbols.simplelinesymbol);
        } else {
          this.elevLineSymbol = new SimpleLineSymbol();
        }
        
        this._initMeasureTool();
      },

      startup: function () {
        this.inherited(arguments);
      },

      onClose: function () {
        if (this.measureTool) {
          this.measureTool.setTool("distance", false);
          this.measureTool.clearResult();
        }
      },

      onOpen: function () {
        if (this.lastMeasure && this.measureTool) {
          this.measureTool.measure(this.lastMeasure);
        }
      },

      _initMeasureTool: function () {
        // MEASUREMENT TOOL //
        this.measureTool = new Measurement({
          map: this.map,
          lineSymbol: this.elevLineSymbol,
          }, this._measureNode);
        aspect.after(this.measureTool, 'setTool', lang.hitch(this, function () {
          if (this.measureTool.activeTool) {
            this.map.setInfoWindowOnClick(false);
            this.disableWebMapPopup();
          } else {
            this.map.setInfoWindowOnClick(true);
            this.enableWebMapPopup();
          }
        }));
        this.measureTool.startup();
        
        // HIDE AREA AND LOCATION TOOLS //
        this.measureTool.hideTool('area');
        this.measureTool.hideTool('location');
        
        // CHANGE THE DEFAULT LABEL TEXT FOR THE THE MEASUREMENT WIDGET RESULT //
        var measLbl = query(".esriMeasurementResultLabel", this.domNode)[0];  
          if(measLbl){  
            measLbl.innerHTML = measLbl.innerText = "Flying Distance:";  
          }

        //Activate then deactivate the distance tool to enable the measure units
        on.once(this.measureTool, "tool-change", lang.hitch(this, function () {
          this.measureTool.setTool("distance", false);
          this.measureTool.clearResult();
        }));
        this.measureTool.setTool("distance", true);

        // CALCULATE FLY TIMES ON DISTANCE END//
        this.measureTool.on('measure-end', lang.hitch(this, this._onMeasureEnd));

        // Clear existing drawings when distance tool is clicked.
        this.measureTool._distanceButton.on("click", lang.hitch(this, this._onMeasureClick));

      },

      disableWebMapPopup: function () {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          if (handler) {
            handler.remove();
            this.map.webMapResponse.clickEventHandle = null;
          }
        }
      },
      
      enableWebMapPopup: function () {
        if (this.map && this.map.webMapResponse) {
          var handler = this.map.webMapResponse.clickEventHandle;
          var listener = this.map.webMapResponse.clickEventListener;
          if (listener && !handler) {
            this.map.webMapResponse.clickEventHandle = on(
              this.map,
              'click',
              lang.hitch(this.map, listener)
            );
          }
        }
      },
      
      _setTable:function(HeliParams){
        this.distanceTable.clear();
        array.forEach(HeliParams, lang.hitch(this, function(item){
           var rowData = {
              vehicle:item.vehicle,
              maxSpeed:item.maxSpeed,
              maxTime: "---",
              cruiseSpeed:item.cruiseSpeed,
              cruiseTime: "---"
            };
            var result = this.distanceTable.addRow(rowData);
        }));
      },

      _onMeasureClick: function () {
        this.map.infoWindow.clearFeatures();
        this.map.infoWindow.hide();
        this.emit("measure-distance-checked", {
          checked: this.measureTool._distanceButton.checked
        });
      },

      _onMeasureEnd: function (evt) {
        if (evt.toolName === "distance") {
          this.lastMeasure = evt.geometry;
          this.distance = geometryEngine.geodesicLength(evt.geometry, "nautical-miles");
          var result = [];
          var trs = this.distanceTable.getRows();
          result = array.map(trs, lang.hitch(this, function(tr){            
            var data = this.distanceTable.getRowData(tr);            
            var maxTime = this._calcTime(this.distance,data.maxSpeed);
            var cruiseTime = this._calcTime(this.distance,data.cruiseSpeed);            
            this.distanceTable.editRow(tr,{maxTime:maxTime,cruiseTime:cruiseTime});     
          }));
        }
      },
      
      _padZero: function (number) {
        if (number < 10) {
          strNumber = "0" + number;
          return strNumber;
        } else {
          return number;
        }
      },

      _calcTime: function (distance,speed) {
        var hours = Math.floor(Number(distance) / Number(speed));
        var minutes = Math.floor(Number(distance) / Number(speed) * 60) - (hours * 60);
        if (minutes == 60) {
          minutes=0;
          hours++;
        }
        var seconds =((Number(distance) / Number(speed)) * 60) - (minutes + (hours * 60));
        seconds = Math.round(seconds * 60);
        if (seconds == 60) {
          seconds=0;
          minutes++
        }
        return this._padZero(hours) + ":" + this._padZero(minutes) + ":" + this._padZero(seconds);
      },
      
      destroy: function () {
        this.inherited(arguments);
      }
    });
  });