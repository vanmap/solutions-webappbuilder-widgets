define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Stateful',
  'dojo/topic',
  'dojo/Deferred',
  'esri/geometry/Point',
  'esri/SpatialReference',
  'esri/geometry/webMercatorUtils',
  '../util'
], function (
  dojoDeclare,
  dojoLang,
  dojoStateful,
  dojoTopic,
  DojoDeferred,
  EsriPoint,
  EsriSpatialReference,
  EsriWMUtils,
  CoordinateUtilities
) {

  var mo = dojoDeclare([dojoStateful], {

    formatPrefix: false,
    _formatPrefixSetter: function (value) {
      this.formatPrefix = value;
    },

    inputString: null,
    _inputStringSetter: function (value) {
      this.inputString = value;
    },

    formatString: 'YN XE',
    _formatStringSetter: function (value) {
      this.formatString = value;
      //this.getFormattedValue();
    },

    inputType: 'UNKNOWN',

    formatType: 'DD',
    
    _formatTypeSetter: function (value) {
      this.formatType = value;
      this.getFormattedValue();
    },

    outputString: '',    

    coordinateEsriGeometry: null,
    
    _coordinateEsriGeometrySetter: function (value) {
        var pt;
        if (value == null) return;
      if (value.spatialReference.wkid !== 4326) {
        pt = EsriWMUtils.webMercatorToGeographic(value);
      } else {
        pt = value;
      }
      this.coordinateEsriGeometry = pt;
      this.getFormattedValue();
    },

    /**
     *
     **/
    constructor: function (args) {
      dojoDeclare.safeMixin(this, args);
      this.util = new CoordinateUtilities(this.appConfig.geometryService);
    },

    /**
     *
     **/
    getInputType: function () {
      this.inputTypeDef = new DojoDeferred();
      this.util.getCoordinateType(this.inputString).then(dojoLang.hitch(this, function(itm){
        if (itm) {
          var sortedInput = this.processCoordTextInput(this.inputString, itm[0]);
          this.util.getXYNotation(sortedInput, itm[0].name).then(dojoLang.hitch(this, function (r) {
            if (r.length <= 0 || (!r[0][0] && r[0][0] != 0)){
              this.hasError = true;
              this.valid = false;
              this.message = 'Invalid Coordinate';
              this.inputTypeDef.resolve(this);
            } else {
              this.isManual = true;
              this.valid = true;
              this.inputType = itm[0].name;
              this.coordinateEsriGeometry = new EsriPoint(
                r[0][0],
                r[0][1],
                new EsriSpatialReference({
                  wkid: 4326
                })
              );
              this.message = '';
              this.inputTypeDef.resolve(this);
            }
          })),
           dojoLang.hitch(this, function (r) {
            this.hasError = true;
            this.valid = false;
            this.inputType = 'UNKNOWN';
            this.message = 'Invalid Coordinate';
            this.inputTypeDef.resolve(this);
          });            
        } else {            
            this.hasError = true;
            this.valid = false;
            this.inputType = 'UNKNOWN';
            this.message = 'Invalid Coordinate';
            this.inputTypeDef.resolve(this);
        }
      }));
      return this.inputTypeDef;
    },
    
    /**
     *
     **/
    processCoordTextInput: function (withStr, asType) {
        
        var match = asType.pattern.exec(withStr);            
        
        var northSouthPrefix, northSouthSuffix, eastWestPrefix, eastWestSuffix, latDeg, longDeg, latMin, longMin, latSec, longSec;
        
        var prefixSuffixError = false;
        
        switch (asType.name) {
          case 'DD':
            northSouthPrefix = match[2];
            northSouthSuffix = match[7];
            eastWestPrefix = match[10];
            eastWestSuffix = match[16];
            latDeg = match[3].replace(/[,:]/, '.');
            longDeg = match[11].replace(/[,:]/, '.');             
            break; 
          case 'DDrev':
            northSouthPrefix = match[11];
            northSouthSuffix = match[16];
            eastWestPrefix = match[2];
            eastWestSuffix = match[8];
            latDeg = match[12].replace(/[,:]/, '.');
            longDeg = match[3].replace(/[,:]/, '.');  
            asType.name = 'DD';            
            break;            
          case 'DDM':            
            northSouthPrefix = match[2];
            northSouthSuffix = match[7];
            eastWestPrefix = match[10];
            eastWestSuffix = match[15];
            latDeg = match[3];
            latMin = match[4].replace(/[,:]/, '.');
            longDeg = match[11];
            longMin = match[12].replace(/[,:]/, '.');                
            break;
          case 'DDMrev':
            northSouthPrefix = match[10];
            northSouthSuffix = match[15];
            eastWestPrefix = match[2];
            eastWestSuffix = match[7];
            latDeg = match[11];
            latMin = match[12].replace(/[,:]/, '.');
            longDeg = match[3];
            longMin = match[4].replace(/[,:]/, '.');                
            asType.name = 'DDM';            
            break;
          case 'DMS':
            northSouthPrefix = match[2];
            northSouthSuffix = match[8];
            eastWestPrefix = match[11];
            eastWestSuffix = match[17];
            latDeg = match[3];
            latMin = match[4];
            latSec = match[5].replace(/[,:]/, '.');
            longDeg = match[12];
            longMin = match[13];
            longSec = match[14].replace(/[,:]/, '.');
            asType.name = 'DMS';               
            break;
          case 'DMSrev':
            northSouthPrefix = match[11];
            northSouthSuffix = match[17];
            eastWestPrefix = match[2];
            eastWestSuffix = match[8];
            latDeg = match[12];
            latMin = match[13];
            latSec = match[14].replace(/[,:]/, '.');
            longDeg = match[3];
            longMin = match[4];
            longSec = match[5].replace(/[,:]/, '.');
            asType.name = 'DMS';               
            break;
        }
        
        //check for north/south prefix/suffix
        if(northSouthPrefix && northSouthSuffix) {
              prefixSuffixError = true;                    
              new RegExp(/[Ss-]/).test(northSouthPrefix)?northSouthPrefix = '-':northSouthPrefix = '';
            } else {
              if(northSouthPrefix && new RegExp(/[Ss-]/).test(northSouthPrefix)){
                northSouthPrefix = '-';
              } else {
                if(northSouthSuffix && new RegExp(/[Ss-]/).test(northSouthSuffix)){
                  northSouthPrefix = '-';
                } else {
                  northSouthPrefix = '+';
                }
              }
            }
            
        //check for east/west prefix/suffix
        if(eastWestPrefix && eastWestSuffix) {
          prefixSuffixError = true;                    
          new RegExp(/[Ww-]/).test(eastWestPrefix)?eastWestPrefix = '-':eastWestPrefix = '';
        } else {
          if(eastWestPrefix && new RegExp(/[Ww-]/).test(eastWestPrefix)){
            eastWestPrefix = '-';
          } else {
            if(eastWestSuffix && new RegExp(/[Ww-]/).test(eastWestSuffix)){
              eastWestPrefix = '-';
            } else {
              eastWestPrefix = '+';
            }
          }
        }
        
        //give user warning if lat or long is determined as having a prefix and suffix 
        if(prefixSuffixError) {
          new JimuMessage({message: 'The input coordinate has been detected as having both a prefix and suffix for the latitude or longitude value, returned coordinate is based on the prefix.'});
        }            
        
        switch (asType.name) {
          case 'DD':               
          case 'DDrev':
            withStr = northSouthPrefix + latDeg + "," + eastWestPrefix + longDeg;
            break;              
          case 'DDM':
          case 'DDMrev':
            withStr = northSouthPrefix + latDeg + " " + latMin + "," + eastWestPrefix + longDeg + " " + longMin;
            break;
          case 'DMS':
          case 'DMSrev':
            withStr = northSouthPrefix + latDeg + " " + latMin + " " + latSec + "," + eastWestPrefix + longDeg + " " + longMin + " " + longSec;
            break;default:
            withStr = withStr;              
            break;
        }
        
        return withStr;
    },

    /**
     *
     **/
    getInputTypeSync: function () {
      var v = this.util.getCoordinateType(this.inputString);
      return v !== null;
    },

    /**
     *
     **/
    getFormattedValue: function () {
      if (!this.coordinateEsriGeometry) {
        return;
      }
      this.util.getCoordValues({
        x: this.coordinateEsriGeometry.x,
        y: this.coordinateEsriGeometry.y
      }, this.formatType, 6).then(dojoLang.hitch(this, function (r) {
        this.set('outputString', this.getCoordUI(r));
        }));
    },

    /**
     * Get coordinate notation in user provided format
     **/
    getCoordUI: function (fromValue) {
      var as = this.get('formatPrefix');
      var r;
      var formattedStr;
      switch (this.formatType) {
      case 'DD':
          r = this.util.getFormattedDDStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'DDM':
          r = this.util.getFormattedDDMStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'DMS':
          r = this.util.getFormattedDMSStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'USNG':
          r = this.util.getFormattedUSNGStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'MGRS':
          r = this.util.getFormattedMGRSStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'GARS':
          r = this.util.getFormattedGARSStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'GEOREF':
          r = this.util.getFormattedGEOREFStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      case 'UTM':
          r = this.util.getFormattedUTMStr(fromValue, this.formatString, as);
          formattedStr = r.formatResult;
          break;
      }
      return formattedStr;
    }
  });

  return mo;
});
