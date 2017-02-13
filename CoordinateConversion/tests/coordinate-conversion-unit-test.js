define([
  'intern!object',
  'intern/chai!assert',
  'dojo/dom-construct',
  'dojo/_base/window',
  'esri/map',
  'CC/Widget',
  'CC/util',
  'dojo/_base/lang',
  'jimu/dijit/CheckBox',
  'jimu/BaseWidget',
  'jimu/dijit/Message',
  'dijit/form/Select',
  'dijit/form/TextBox'
], function(registerSuite, assert, domConstruct, win, Map, CoordinateConversion, CCUtil, lang) {
  // local vars scoped to this module
  var map, coordinateConversion, ccUtil;
  var dms2,dms3,ds,ds2,dp,ns,pLat,pLon,pss,ms,ss;
  var totalTestCount = 0;
  var latDDArray = [];
  var lonDDArray = [];
  var latDDMArray = [];
  var lonDDMArray = [];
  var latDMSArray = [];
  var lonDMSArray = [];
   
  registerSuite({
    name: 'CoordinateConversion Widget',
     // before the suite starts
    setup: function() {
      // load claro and esri css, create a map div in the body, and create the map object and print widget for our tests
      domConstruct.place('<link rel="stylesheet" type="text/css" href="//js.arcgis.com/3.16/esri/css/esri.css">', win.doc.getElementsByTagName("head")[0], 'last');
      domConstruct.place('<link rel="stylesheet" type="text/css" href="//js.arcgis.com/3.16/dijit/themes/claro/claro.css">', win.doc.getElementsByTagName("head")[0], 'last');
      domConstruct.place('<script src="http://js.arcgis.com/3.16/"></script>', win.doc.getElementsByTagName("head")[0], 'last');
      domConstruct.place('<div id="map" style="width:300px;height:200px;" class="claro"></div>', win.body(), 'only');
      domConstruct.place('<div id="ccNode" style="width:300px;" class="claro"></div>', win.body(), 'last');

      map = new Map("map", {
       basemap: "topo",
       center: [-122.45, 37.75],
       zoom: 13,
       sliderStyle: "small"
      });
       
      ccUtil = new CCUtil({appConfig: {
        coordinateconversion: {                  
          geometryService: {url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"}
        }   
      }});
       
      //populate the arrays that will be used in the tests       
      //dms2 = degrees/minutes/seconds two figures
      dms2 = ['0','00'];
      //dms3 = degrees/minutes/seconds three figures
      dms3 = ['0','00','000'];
      //ds = degree symbol      
      ds = ['','°','˚','º','^','~','*'];
      //there has to be some seperator between degrees and minute values
      ds2 = [' ','°','˚','º','^','~','*','-','_']; 
      //ms = minute symbol      
      ms = ["","'","′"];       
      //there has to be some seperator between minute and second values
      ms2 = [' ',"'","′"];      
      //ms = second symbol
      ss = ['"','¨','˝'];            
      //dp = decimal place 
      //just test a single decimal place using both comma and decimal point
      dp = ['','.0',',0'];
      //ns = number seperator
      //we know that a comma seperator used with a comma for decimal degrees will fail so do not test for this
      ns = [' ',':',';','|','/','\\'];
      //pLat = prefix / suffix latitude - test lower and upper case
      pLat = ['n','S','+','-'];
      //pLon = prefix / suffix longitude
      pLon = ['E','W','+','-'];
      //pss = prefix / suffix spacer
      pss = ['', " "];

       
      //set up an array of each combination of DD latitude values
      for (var a = 0; a < dms2.length; a++) {
        for (var b = 0; b < dp.length; b++) {
          for (var c = 0; c < ds.length; c++) {
            latDDArray.push(dms2[a] + dp[b] + ds[c]);            
          }
        }                   
      }
      //set up an array of each combination of DD longitude values
      for (var a = 0; a < dms3.length; a++) {
        for (var b = 0; b < dp.length; b++) {
          for (var c = 0; c < ds.length; c++) {
            lonDDArray.push(dms3[a] + dp[b] + ds[c]);            
          }
        }                   
      }
      
      //set up an array of each combination of DDM latitude values
      for (var a = 0; a < dms2.length; a++) {
        for (var b = 0; b < ds2.length; b++) {
          for (var c = 0; c < dms2.length; c++) {
            for (var d = 0; d < dp.length; d++) {
              for (var e = 0; e < ms.length; e++) {
                latDDMArray.push(dms2[a] + ds2[b] + dms2[c] + dp[d] + ms[e]);                
              }
            }                   
          }
        }
      }

      //set up an array of each combination of DDM latitude values
      for (var a = 0; a < dms3.length; a++) {
        for (var b = 0; b < ds2.length; b++) {
          for (var c = 0; c < dms2.length; c++) {
            for (var d = 0; d < dp.length; d++) {
              for (var e = 0; e < ms.length; e++) {
                lonDDMArray.push(dms3[a] + ds2[b] + dms2[c] + dp[d] + ms[e]);                
              }
            }                   
          }
        }
      }
      
      //set up an array of each combination of DMS latitude values
      for (var a = 0; a < dms2.length; a++) {
        for (var b = 0; b < ds2.length; b++) {
          for (var c = 0; c < dms2.length; c++) {
            for (var d = 0; d < ms2.length; d++) {
              for (var e = 0; e < dms2.length; e++) {
                for (var f = 0; f < dp.length; f++) {
                  for (var g = 0; g < ss.length; g++) {
                    latDMSArray.push(dms2[a] + ds2[b] + dms2[c] + ms2[d] + dms2[e] + dp[f] + ss[g]);                
                  }
                }
              }
            }                   
          }
        }
      }
      
      //set up an array of each combination of DMS latitude values
      for (var a = 0; a < dms3.length; a++) {
        for (var b = 0; b < ds2.length; b++) {
          for (var c = 0; c < dms2.length; c++) {
            for (var d = 0; d < ms2.length; d++) {
              for (var e = 0; e < dms2.length; e++) {
                for (var f = 0; f < dp.length; f++) {
                  for (var g = 0; g < ss.length; g++) {
                    lonDMSArray.push(dms3[a] + ds2[b] + dms2[c] + ms2[d] + dms2[e] + dp[f] + ss[g]);                
                  }
                }
              }
            }                   
          }
        }
      }
    },

    // before each test executes
    beforeEach: function() {
      // do nothing
    },

    // after the suite is done (all tests)
    teardown: function() {
      if (map.loaded) {
        map.destroy();   
      }
      if (coordinateConversion) {
        coordinateConversion.destroy();
      }
      console.log("Total number of tests conducted is: " + totalTestCount);      
    },

    'Test Coordinate Conversion CTOR': function() {
      if (map) {
        map.on("load", function () {
          console.log('Start CTOR test');
          coordinateConversion = new CoordinateConversion({
            parentWidget: this,
            map: map,
            input: true,
            type: 'DD',
            config: {
              coordinateconversion: {
                zoomScale: 50000,
                initialCoords: ["DDM", "DMS", "MGRS", "UTM"],
                geometryService: {
                   url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer"
                }
              }   
            }         
          }, domConstruct.create("div")).placeAt("ccNode");   
          coordinateConversion.startup();
          assert.ok(coordinateConversion);
          assert.instanceOf(coordinateConversion, CoordinateConversion, 'coordinateConversion should be an instance of CoordinateConversion');       
          console.log('End CTOR test');
        });
      }
    },
     
    'Test: Auto Input Coords for DD - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
    
      //test each the DD latitude and longitude array items against each other using each of the seperators
      for (var a = 0; a < latDDArray.length; a++) {
        for (var b = 0; b < lonDDArray.length; b++) {
          for (var c = 0; c < ns.length; c++) {
            ccUtil.getCoordinateType(latDDArray[a] + ns[c] + lonDDArray[b]).then(function(itm){
             /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
             ** https://theintern.github.io/intern/#async-tests
             ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
             ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
             */
             itm && itm[0].name == 'DD'?passed=true:passed=false;
             //execute the reg ex and store in the variable match
             match = itm[0].pattern.exec(latDDArray[a].toUpperCase() + ns[c] + lonDDArray[b].toUpperCase());    
            });         
            //test to see if the regular expression identified the input as a valid input and identified it as DD (for decimal degrees)
            assert.isTrue(passed, latDDArray[a] + ns[c] + lonDDArray[b] + ' did not validate as DD Lat/Long');
            //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
            assert.equal(latDDArray[a].toUpperCase(), match[1], latDDArray[a] + ns[c] + lonDDArray[b] + " Failed");
            assert.equal(lonDDArray[b].toUpperCase(), match[9], latDDArray[a] + ns[c] + lonDDArray[b] + " Failed");
            //test to see if the regular expression has correctly identified the seperator
            assert.equal(ns[c], match[8], "Matching the seperator failed");
            //reset passed
            passed = false;
            count++;
          }
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) { 
              for (var e = 0; e < pLon.length; e++) {
                for (var f = 0; f < pss.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pLon.length; h++) {         
                      var tempLat = pLat[a].toUpperCase() + pss[b] + "00.0" + pss[c] + pLat[d].toUpperCase();
                      //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix spacer of +/- for latitude
                      if(pLon[e] == "-" || pLon[e] == "+"){
                        var tempLon = pLon[e] + "000.0" + pss[g] + pLon[h];
                      } else {
                        var tempLon = pLon[e] + pss[f] + "000.0" + pss[g] + pLon[h];
                      }               
                      ccUtil.getCoordinateType(tempLat + (" ") + tempLon).then(function(itm){
                      /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                      ** https://theintern.github.io/intern/#async-tests
                      ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                      ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                      */
                      itm && itm[0].name == 'DD'?passed=true:passed=false;
                      //execute the reg ex and store in the variable match
                      match = itm[0].pattern.exec(tempLat.toUpperCase() + (" ") + tempLon.toUpperCase());    
                      });         
                      //test to see if the regular expression identified the input as a valid input and identified it as DDM (for degrees decimal minutes)
                      assert.isTrue(passed, tempLat + (" ") + tempLon + ' did not validate as DD Lat/Long');
                      //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                      assert.equal(tempLat.toUpperCase(), match[1], tempLat + (" ") + tempLon + " Failed ");
                      assert.equal(tempLon.toUpperCase(), match[9], tempLat + (" ") + tempLon + " Failed ");
                      //test to see if the regular expression has correctly identified the seperator
                      assert.equal(" ", match[8], "Matching the seperator failed");
                      //reset passed
                      passed = false;
                      count++;
                    }
                  }               
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Decimal Degrees Lat/Long was: " + count);
      totalTestCount = totalTestCount + count;
    },
     
    'Test: Auto Input Coords for DD - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
      
      //test each the DD latitude and longitude array items against each other using each of the seperators
      for (var a = 0; a < latDDArray.length; a++) {
        for (var b = 0; b < lonDDArray.length; b++) {
          for (var c = 0; c < ns.length; c++) {
          ccUtil.getCoordinateType(lonDDArray[b] + ns[c] + latDDArray[a]).then(function(itm){
           /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
           ** https://theintern.github.io/intern/#async-tests
           ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
           ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
           */
           if (itm.length == 1) {
            itm && itm[0].name == 'DDrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(lonDDArray[b].toUpperCase() + ns[c] + latDDArray[a].toUpperCase());
           } else {
            itm && itm[1].name == 'DDrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(lonDDArray[b].toUpperCase() + ns[c] + latDDArray[a].toUpperCase());
           }
          });         
          //test to see if the regular expression identified the input as a valid input and identified it as DD (for decimal degrees)
          assert.isTrue(passed, lonDDArray[b] + ns[c] + latDDArray[a] + ' did not validate as DD Long/Lat');
          //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
          assert.equal(lonDDArray[b].toUpperCase(), match[1], lonDDArray[b] + ns[c] + latDDArray[a] + " Failed");
          assert.equal(latDDArray[a].toUpperCase(), match[10], lonDDArray[b] + ns[c] + latDDArray[a] + " Failed");
          //test to see if the regular expression has correctly identified the seperator
          assert.equal(ns[c], match[9], "Matching the seperator failed");
          //reset passed
          passed = false;
          count++;
          }
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) { 
              for (var e = 0; e < pLon.length; e++) {
                for (var f = 0; f < pss.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pLon.length; h++) {
                      var tempLon = pLon[e] + pss[f] + "000.0" + pss[g] + pLon[h];                 
                      //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix spacer of +/- for latitude
                      if(pLat[a] == "-" || pLat[a] == "+"){
                        var tempLat = pLat[a] + "00.0" + pss[c] + pLat[d]; 
                      } else {
                        var tempLat = pLat[a] + pss[b] + "00.0" + pss[c] + pLat[d]; 
                      }               
                      ccUtil.getCoordinateType(tempLon + (" ") + tempLat).then(function(itm){
                      /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                      ** https://theintern.github.io/intern/#async-tests
                      ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                      ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                      */
                      itm && itm[0].name == 'DDrev'?passed=true:passed=false;
                      //execute the reg ex and store in the variable match
                      match = itm[0].pattern.exec(tempLon.toUpperCase() + (" ") + tempLat.toUpperCase());    
                      });         
                      //test to see if the regular expression identified the input as a valid input and identified it as DD (for decimal degrees)
                      assert.isTrue(passed, tempLon + (" ") + tempLat + ' did not validate as DD Lat/Long');
                      //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                      assert.equal(tempLon.toUpperCase(), match[1], tempLon + (" ") + tempLat + " Failed ");
                      assert.equal(tempLat.toUpperCase(), match[10], tempLon + (" ") + tempLat + " Failed ");
                      //test to see if the regular expression has correctly identified the seperator
                      assert.equal(" ", match[9], "Matching the seperator failed");
                      //reset passed
                      passed = false;
                      count++;
                    }
                  }
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Decimal Degrees Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;
    },
    
    'Test: Auto Input Coords for DDM - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
    
      //test each the DD latitude and longitude array items against each other using each of the seperators
      for (var a = 0; a < latDDMArray.length; a++) {
        for (var b = 0; b < lonDDMArray.length; b++) {
          for (var c = 0; c < ns.length; c++) {
            ccUtil.getCoordinateType(latDDMArray[a] + ns[c] + lonDDMArray[b]).then(function(itm){
             /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
             ** https://theintern.github.io/intern/#async-tests
             ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
             ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
             */
             itm && itm[0].name == 'DDM'?passed=true:passed=false;
             //execute the reg ex and store in the variable match
             match = itm[0].pattern.exec(latDDMArray[a].toUpperCase() + ns[c] + lonDDMArray[b].toUpperCase());    
            });         
            //test to see if the regular expression identified the input as a valid input and identified it as DDM (for degrees decimal minutes)
            assert.isTrue(passed, latDDMArray[a] + ns[c] + lonDDMArray[b] + ' did not validate as DDM Lat/Long');
            //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
            assert.equal(latDDMArray[a].toUpperCase(), match[1], latDDMArray[a] + ns[c] + lonDDMArray[b] + " Failed");
            assert.equal(lonDDMArray[b].toUpperCase(), match[9], latDDMArray[a] + ns[c] + lonDDMArray[b] + " Failed");
            //test to see if the regular expression has correctly identified the seperator
            assert.equal(ns[c], match[8], "Matching the seperator failed");
            //reset passed
            passed = false;
            count++;
          }
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) { 
              for (var e = 0; e < pLon.length; e++) {
                for (var f = 0; f < pss.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pLon.length; h++) {         
                      var tempLat = pLat[a] + pss[b] + "00 00.0" + pss[c] + pLat[d];
                      //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix spacer of +/- for latitude
                      if(pLon[e] == "-" || pLon[e] == "+"){
                        var tempLon = pLon[e] + "000 00.0" + pss[g] + pLon[h];
                      } else {
                        var tempLon = pLon[e] + pss[f] + "000 00.0" + pss[g] + pLon[h];
                      }               
                      ccUtil.getCoordinateType(tempLat + (" ") + tempLon).then(function(itm){
                      /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                      ** https://theintern.github.io/intern/#async-tests
                      ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                      ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                      */
                      itm && itm[0].name == 'DDM'?passed=true:passed=false;
                      //execute the reg ex and store in the variable match
                      match = itm[0].pattern.exec(tempLat.toUpperCase() + (" ") + tempLon.toUpperCase());    
                      });         
                      //test to see if the regular expression identified the input as a valid input and identified it as DDM (for degrees decimal minutes)
                      assert.isTrue(passed, tempLat + (" ") + tempLon + ' did not validate as DDM Lat/Long');
                      //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                      assert.equal(tempLat.toUpperCase(), match[1], tempLat + (" ") + tempLon + " Failed ");
                      assert.equal(tempLon.toUpperCase(), match[9], tempLat + (" ") + tempLon + " Failed ");
                      //test to see if the regular expression has correctly identified the seperator
                      assert.equal(" ", match[8], "Matching the seperator failed");
                      //reset passed
                      passed = false;
                      count++;
                    }
                  }               
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Degrees Decimal Minutes Lat/Long was: " + count);
      totalTestCount = totalTestCount + count;
    },
    
    'Test: Auto Input Coords for DDM - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
      
      //test each the DD latitude and longitude array items against each other using each of the seperators
      for (var a = 0; a < latDDMArray.length; a++) {
        for (var b = 0; b < lonDDMArray.length; b++) {
          for (var c = 0; c < ns.length; c++) {
          ccUtil.getCoordinateType(lonDDMArray[b] + ns[c] + latDDMArray[a]).then(function(itm){
           /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
           ** https://theintern.github.io/intern/#async-tests
           ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
           ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
           */
           if (itm.length == 1) {
            itm && itm[0].name == 'DDMrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(lonDDMArray[b].toUpperCase() + ns[c] + latDDMArray[a].toUpperCase());
           } else {
            itm && itm[1].name == 'DDMrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(lonDDMArray[b].toUpperCase() + ns[c] + latDDMArray[a].toUpperCase());
           }
          });         
          //test to see if the regular expression identified the input as a valid input and identified it as DDM (for degrees decimal minutes)
          assert.isTrue(passed, lonDDArray[b] + ns[c] + latDDArray[a] + ' did not validate as DDM Long/Lat');
          //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
          assert.equal(lonDDMArray[b].toUpperCase(), match[1], lonDDMArray[b] + ns[c] + latDDMArray[a] + " Failed");
          assert.equal(latDDMArray[a].toUpperCase(), match[9], lonDDMArray[b] + ns[c] + latDDMArray[a] + " Failed");
          //test to see if the regular expression has correctly identified the seperator
          assert.equal(ns[c], match[8], "Matching the seperator failed");
          //reset passed
          passed = false;
          count++;
          }
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) { 
              for (var e = 0; e < pLon.length; e++) {
                for (var f = 0; f < pss.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pLon.length; h++) {         
                      var tempLon = pLon[e] + pss[f] + "000 00.0" + pss[g] + pLon[h];
                      //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix/suffix spacer +/- for latitude
                      if(pLat[a] == "-" || pLat[a] == "+"){
                        var tempLat = pLat[a] + "00 00.0" + pss[c] + pLat[d];
                      } else {
                        var tempLat = pLat[a] + pss[b] + "00 00.0" + pss[c] + pLat[d];
                      }
                      
                      ccUtil.getCoordinateType(tempLon + (" ") + tempLat).then(function(itm){
                      /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                      ** https://theintern.github.io/intern/#async-tests
                      ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                      ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                      */
                      itm && itm[0].name == 'DDMrev'?passed=true:passed=false;
                      //execute the reg ex and store in the variable match
                      match = itm[0].pattern.exec(tempLon.toUpperCase() + (" ") + tempLat.toUpperCase());    
                      });         
                      //test to see if the regular expression identified the input as a valid input and identified it as DDM (for degrees decimal minutes))
                      assert.isTrue(passed, tempLon + (" ") + tempLat + ' did not validate as DDM Long/lat');
                      //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                      assert.equal(tempLon.toUpperCase(), match[1], tempLon + (" ") + tempLat + " Failed ");
                      assert.equal(tempLat.toUpperCase(), match[9], tempLon + (" ") + tempLat + " Failed ");
                      //test to see if the regular expression has correctly identified the seperator
                      assert.equal(" ", match[8], "Matching the seperator failed");
                      //reset passed
                      passed = false;
                      count++;
                    }
                  }               
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Degrees Decimal Minutes Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;
    },
    
    'Test: Auto Input Coords for DMS - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
    
      //The arrays are too large to test each of the DMS latitude and longitude array items against each other using each of the seperators
      //So just test using the space seperator we will check the seperator in the next test
      for (var a = 0; a < latDMSArray.length; a++) {
        for (var b = 0; b < lonDMSArray.length; b++) {
          ccUtil.getCoordinateType(latDMSArray[a] + " " + lonDMSArray[b]).then(function(itm){
           /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
           ** https://theintern.github.io/intern/#async-tests
           ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
           ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
           */
           itm && itm[0].name == 'DMS'?passed=true:passed=false;
           //execute the reg ex and store in the variable match
           match = itm[0].pattern.exec(latDMSArray[a].toUpperCase() + " " + lonDMSArray[b].toUpperCase());    
          });         
          //test to see if the regular expression identified the input as a valid input and identified it as DMS (for degrees, minutes, seconds)
          assert.isTrue(passed, latDMSArray[a] + " " + lonDMSArray[b] + ' did not validate as DMS Lat/Long');
          //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
          assert.equal(latDMSArray[a].toUpperCase(), match[1], latDMSArray[a] + " " + lonDMSArray[b] + " Failed");
          assert.equal(lonDMSArray[b].toUpperCase(), match[10], latDMSArray[a] + " " + lonDMSArray[b] + " Failed");
          //test to see if the regular expression has correctly identified the seperator
          assert.equal(" ", match[9], "Matching the seperator failed");
          //reset passed
          passed = false;
          count++;
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix and seperator combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) {
              for (var e = 0; e < ns.length; e++) {
                for (var f = 0; f < pLon.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pss.length; h++) {
                      for (var i = 0; i < pLon.length; i++) {         
                        var tempLat = pLat[a] + pss[b] + "00 00 00.0" + pss[c] + pLat[d];
                        //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix spacer of +/- for latitude
                        if(pLon[f] == "-" || pLon[f] == "+"){
                          var tempLon = pLon[f] + "000 00 00.0" + pss[h] + pLon[i];
                        } else {
                          var tempLon = pLon[f] + pss[g] + "000 00 00.0" + pss[h] + pLon[i];
                        }               
                        ccUtil.getCoordinateType(tempLat + ns[e] + tempLon).then(function(itm){
                        /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                        ** https://theintern.github.io/intern/#async-tests
                        ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                        ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                        */
                        itm && itm[0].name == 'DMS'?passed=true:passed=false;
                        //execute the reg ex and store in the variable match
                        match = itm[0].pattern.exec(tempLat.toUpperCase() + ns[e] + tempLon.toUpperCase());    
                        });         
                        //test to see if the regular expression identified the input as a valid input and identified it as DMS (for degrees, minutes, seconds)
                        assert.isTrue(passed, tempLat + ns[e] + tempLon + ' did not validate as DMS Lat/Long');
                        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                        assert.equal(tempLat.toUpperCase(), match[1], tempLat + ns[e] + tempLon + " Failed ");
                        assert.equal(tempLon.toUpperCase(), match[10], tempLat + ns[e] + tempLon + " Failed ");
                        //test to see if the regular expression has correctly identified the seperator
                        assert.equal(ns[e], match[9], "Matching the seperator failed");
                        //reset passed
                        passed = false;
                        count++;
                      }
                    }               
                  }
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Degrees Decimal Minutes Lat/Long was: " + count);
      totalTestCount = totalTestCount + count;
      console.log("Total number of tests conducted is: " + totalTestCount);
    },
    
    'Test: Auto Input Coords for DMS - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;       
      
      //test each the DD latitude and longitude array items against each other using each of the seperators
      for (var a = 0; a < latDMSArray.length; a++) {
        for (var b = 0; b < lonDMSArray.length; b++) {          
          ccUtil.getCoordinateType(lonDMSArray[b] + " " + latDMSArray[a]).then(function(itm){
           /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
           ** https://theintern.github.io/intern/#async-tests
           ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
           ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
           */
           if (itm.length == 1) {
            itm && itm[0].name == 'DMSrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(lonDMSArray[b].toUpperCase() + " " + latDMSArray[a].toUpperCase());
           } else {
            itm && itm[1].name == 'DMSrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(lonDMSArray[b].toUpperCase() + " " + latDMSArray[a].toUpperCase());
           }
          });         
          //test to see if the regular expression identified the input as a valid input and identified it as DMS (for degrees, minutes, seconds)
          assert.isTrue(passed, lonDMSArray[b].toUpperCase() + " " + latDMSArray[a].toUpperCase() + ' did not validate as DMS Long/Lat');
          //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
          assert.equal(lonDMSArray[b].toUpperCase(), match[1], lonDMSArray[b] + " " + latDMSArray[a] + " Failed");
          assert.equal(latDMSArray[a].toUpperCase(), match[10], lonDMSArray[b] + " " + latDMSArray[a] + " Failed");
          //test to see if the regular expression has correctly identified the seperator
          assert.equal(" ", match[9], "Matching the seperator failed");
          //reset passed
          passed = false;
          count++;        
        }                   
      }
      
      //we have tested each combination of numbers so lets just test a single combination with each possible prefix/suffix combo
      for (var a = 0; a < pLat.length; a++) {
        for (var b = 0; b < pss.length; b++) {
          for (var c = 0; c < pss.length; c++) {
            for (var d = 0; d < pLat.length; d++) {
              for (var e = 0; e < ns.length; e++) {
                for (var f = 0; f < pLon.length; f++) {
                  for (var g = 0; g < pss.length; g++) {
                    for (var h = 0; h < pss.length; h++) {
                      for (var i = 0; i < pLon.length; i++) {         
                        var tempLon = pLon[f] + pss[g] + "000 00 00.0" + pss[h] + pLon[i];
                        //we know a space between a prefix of + or - and then number for latitude will fail so do not use a prefix/suffix spacer +/- for latitude
                        if(pLat[a] == "-" || pLat[a] == "+"){
                          var tempLat = pLat[a] + "00 00 00.0" + pss[c] + pLat[d];
                        } else {
                          var tempLat = pLat[a] + pss[b] + "00 00 00.0" + pss[c] + pLat[d];
                        }
                        
                        ccUtil.getCoordinateType(tempLon + ns[e] + tempLat).then(function(itm){
                        /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                        ** https://theintern.github.io/intern/#async-tests
                        ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                        ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                        */
                        itm && itm[0].name == 'DMSrev'?passed=true:passed=false;
                        //execute the reg ex and store in the variable match
                        match = itm[0].pattern.exec(tempLon.toUpperCase() + ns[e] + tempLat.toUpperCase());    
                        });         
                        //test to see if the regular expression identified the input as a valid input and identified it as DMS (for degrees, minutes, seconds)
                        assert.isTrue(passed, tempLon + (" ") + tempLat + ' did not validate as DMS Long/lat');
                        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                        assert.equal(tempLon.toUpperCase(), match[1], tempLon + ns[e] + tempLat + " Failed ");
                        assert.equal(tempLat.toUpperCase(), match[10], tempLon + ns[e] + tempLat + " Failed ");
                        //test to see if the regular expression has correctly identified the seperator
                        assert.equal(ns[e], match[9], "Matching the seperator failed");
                        //reset passed
                        passed = false;
                        count++;
                      }
                    }
                  }               
                }
              }
            }
          }
        }
      }
      console.log("The number of tests conducted for Degrees Decimal Minutes Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;
    },
    
    'Test: Manual Input Coords for DD - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '89.999 179.999', lat: '89.999', lon: '179.999', testSeperator: ' '},
        {testNumber: '002', testString: '90.000 180.000', lat: '90.000', lon: '180.000', testSeperator: ' '}
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          itm && itm[0].name == 'DD'?passed=true:passed=false;
          //execute the reg ex and store in the variable match
          match = itm[0].pattern.exec(validEntries[i].testString);            
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DD (for decimal degrees)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DD Lat/Long');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lat, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lon, match[9], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[8], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      console.log("The number of manual tests conducted for Decimal Degrees Lat/Long was: " + count);
      totalTestCount = totalTestCount + count;      
    },
    
    'Test: Manual Input Coords for DD - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '179.999 89.999', lat: '89.999', lon: '179.999', testSeperator: ' '},
        {testNumber: '002', testString: '180.000 90.000', lat: '90.000', lon: '180.000', testSeperator: ' '}
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          if (itm.length == 1) {
            itm && itm[0].name == 'DDrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(validEntries[i].testString);            
          } else {
            itm && itm[1].name == 'DDrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(validEntries[i].testString);            
          }
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DD (for decimal degrees)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DD Long/Lat');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lon, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lat, match[10], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[9], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      console.log("The number of manual tests conducted for Decimal Degrees Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;      
    },
    
    'Test: Manual Input Coords for DDM - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '89 59.999 179 59.999', lat: '89 59.999', lon: '179 59.999', testSeperator: ' '},
        {testNumber: '002', testString: '90 00.000 180 00.000', lat: '90 00.000', lon: '180 00.000', testSeperator: ' '}
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          itm && itm[0].name == 'DDM'?passed=true:passed=false;
          //execute the reg ex and store in the variable match
          match = itm[0].pattern.exec(validEntries[i].testString);            
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DDM (for degrees decimal minutes)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DDM Lat/Long');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lat, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lon, match[9], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[8], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      console.log("The number of manual tests conducted for Decimal Degrees Lat/Long was: " + count);
      totalTestCount = totalTestCount + count;      
    },
    
    'Test: Manual Input Coords for DDM - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '179 59.999 89 59.999', lat: '89 59.999', lon: '179 59.999', testSeperator: ' '},
        {testNumber: '002', testString: '180 00.000 90 00.000', lat: '90 00.000', lon: '180 00.000', testSeperator: ' '}
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          if (itm.length == 1) {
            itm && itm[0].name == 'DDMrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(validEntries[i].testString);            
          } else {
            itm && itm[1].name == 'DDMrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(validEntries[i].testString);            
          }
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DDM (for degrees decimal minutes)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DDM Long/Lat');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lon, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lat, match[9], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[8], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      console.log("The number of manual tests conducted for Decimal Degrees Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;      
    },
    
    'Test: Manual Input Coords for DMS - Lat / Long': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '00 59 59.666 000 59 59.666', lat: '00 59 59.666', lon: '000 59 59.666', testSeperator: ' '},
        {testNumber: '002', testString: '00 00 59.666|000 00 59.666', lat: '00 00 59.666', lon: '000 00 59.666', testSeperator: '|'},
        {testNumber: '003', testString: '00 59 00.666:000 59 00.666', lat: '00 59 00.666', lon: '000 59 00.666', testSeperator: ':'},
        {testNumber: '004', testString: '89 59 59.666 179 59 59.666', lat: '89 59 59.666', lon: '179 59 59.666', testSeperator: ' '},
        {testNumber: '005', testString: '90 00 00.000 180 00 00.000', lat: '90 00 00.000', lon: '180 00 00.000', testSeperator: ' '},
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          itm && itm[0].name == 'DMS'?passed=true:passed=false;
          //execute the reg ex and store in the variable match
          match = itm[0].pattern.exec(validEntries[i].testString);            
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DMS (for degrees, minutes, seconds)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DMS Lat/Long');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lat, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lon, match[10], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[9], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      console.log("The number of manual tests conducted for Degrees Decimal Minutes Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;      
    },
    
    'Test: Manual Input Coords for DMS - Long / Lat': function() {
      //this.skip('Skip test for now');
      var passed = false;
      var match = '';      
      var count = 0;
      
      // if you want to add specific tests that are not that you think will not be test with the automatic testing functions
      // add entries to the array below, including test number, testString, lat, long and seperator. Ensure there is no comma after your last array entry 
      var validEntries = [
        {testNumber: '001', testString: '000 59 59.666 00 59 59.666', lat: '00 59 59.666', lon: '000 59 59.666', testSeperator: ' '},
        {testNumber: '002', testString: '000 00 59.666|00 00 59.666', lat: '00 00 59.666', lon: '000 00 59.666', testSeperator: '|'},
        {testNumber: '003', testString: '000 59 00.666:00 59 00.666', lat: '00 59 00.666', lon: '000 59 00.666', testSeperator: ':'},
        {testNumber: '004', testString: '179 59 59.666 89 59 59.666', lat: '89 59 59.666', lon: '179 59 59.666', testSeperator: ' '},
        {testNumber: '005', testString: '180 00 00.000 90 00 00.000', lat: '90 00 00.000', lon: '180 00 00.000', testSeperator: ' '},
      ];

      for (var i = 0; i < validEntries.length; i++) {
        ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
          /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
          ** https://theintern.github.io/intern/#async-tests
          ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
          ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
          */
          if (itm.length == 1) {
            itm && itm[0].name == 'DMSrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[0].pattern.exec(validEntries[i].testString);            
          } else {
            itm && itm[1].name == 'DMSrev'?passed=true:passed=false;
            //execute the reg ex and store in the variable match
            match = itm[1].pattern.exec(validEntries[i].testString);            
          }
          
          //split the input string by its seperator
          latLongArray = validEntries[i].testString.split(validEntries[i].testSeperator);
        });
        
        //test to see if the regular expression identified the input as a valid inpout and identified it as DMS (for degrees, minutes, seconds)
        assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DMS Long/Lat');
        
        //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
        assert.equal(validEntries[i].lon, match[1], validEntries[i].testString + " Failed");
        assert.equal(validEntries[i].lat, match[10], validEntries[i].testString + " Failed");
                
        //test to see if the regular expression has correctly identified the seperator
        assert.equal(validEntries[i].testSeperator, match[9], "Matching the seperator failed");
        
        //reset passed
        passed = false;
        count++;                        
      }
      
      console.log("The number of manual tests conducted for Degrees Decimal Minutes Long/Lat was: " + count);
      totalTestCount = totalTestCount + count;      
    },
      
    });
});