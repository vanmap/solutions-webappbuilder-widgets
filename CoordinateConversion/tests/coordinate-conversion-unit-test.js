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
        
        'Test: Input Coords for DD - Lat / Long': function() {
            // create an array of all the strings we want to test
            var validEntries = [
              //check all zeros upto 6 decimal places
              {testNumber: '001', testString: '0 000', testSeperator: ' '},
              {testNumber: '002', testString: '0.0 000.0', testSeperator: ' '},
              {testNumber: '003', testString: '0.000 000.000', testSeperator: ' '},
              {testNumber: '004', testString: '0.0000 000.0000', testSeperator: ' '},
              {testNumber: '005', testString: '0.00000 000.00000', testSeperator: ' '},
              {testNumber: '006', testString: '0.000000 000.000000', testSeperator: ' '},
               //check plus and minus signs as hemishere designators
              {testNumber: '007', testString: '+0 000', testSeperator: ' '},
              {testNumber: '008', testString: '+0.0 000.0', testSeperator: ' '},
              {testNumber: '009', testString: '+0.000 000.000', testSeperator: ' '},
              {testNumber: '010', testString: '+0.0000 000.0000', testSeperator: ' '},
              {testNumber: '011', testString: '0 +000', testSeperator: ' '},
              {testNumber: '012', testString: '0.0 +000.0', testSeperator: ' '},
              {testNumber: '013', testString: '0.000 +000.000', testSeperator: ' '},
              {testNumber: '014', testString: '0.0000 +000.0000', testSeperator: ' '},
              {testNumber: '015', testString: '+0 +000', testSeperator: ' '},
              {testNumber: '016', testString: '+0.0 +000.0', testSeperator: ' '},
              {testNumber: '017', testString: '+0.000 +000.000', testSeperator: ' '},
              {testNumber: '018', testString: '+0.0000 +000.0000', testSeperator: ' '},
              {testNumber: '019', testString: '-0 000', testSeperator: ' '},
              {testNumber: '020', testString: '-0.0 000.0', testSeperator: ' '},
              {testNumber: '021', testString: '-0.000 000.000', testSeperator: ' '},
              {testNumber: '022', testString: '-0.0000 000.0000', testSeperator: ' '},
              {testNumber: '023', testString: '0 -000', testSeperator: ' '},
              {testNumber: '024', testString: '0.0 -000.0', testSeperator: ' '},
              {testNumber: '025', testString: '0.000 -000.000', testSeperator: ' '},
              {testNumber: '026', testString: '0.0000 -000.0000', testSeperator: ' '},
              {testNumber: '027', testString: '-0 -000', testSeperator: ' '},
              {testNumber: '028', testString: '-0.0 -000.0', testSeperator: ' '},
              {testNumber: '029', testString: '-0.000 -000.000', testSeperator: ' '},
              {testNumber: '030', testString: '-0.0000 -000.0000', testSeperator: ' '},
              {testNumber: '031', testString: '0+ 000', testSeperator: ' '},
              {testNumber: '032', testString: '0.0+ 000.0', testSeperator: ' '},
              {testNumber: '033', testString: '0.000+ 000.000', testSeperator: ' '},
              {testNumber: '034', testString: '0.0000+ 000.0000', testSeperator: ' '},
              {testNumber: '035', testString: '0 000+', testSeperator: ' '},
              {testNumber: '036', testString: '0.0 000.0+', testSeperator: ' '},
              {testNumber: '037', testString: '0.000 000.000+', testSeperator: ' '},
              {testNumber: '038', testString: '0.0000 000.0000+', testSeperator: ' '},
              {testNumber: '039', testString: '0- 000', testSeperator: ' '},
              {testNumber: '040', testString: '0.0- 000.0', testSeperator: ' '},
              {testNumber: '041', testString: '0.000- 000.000', testSeperator: ' '},
              {testNumber: '042', testString: '0.0000- 000.0000', testSeperator: ' '},
              {testNumber: '043', testString: '0 000-', testSeperator: ' '},
              {testNumber: '044', testString: '0.0 000.0-', testSeperator: ' '},
              {testNumber: '045', testString: '0.000 000.000-', testSeperator: ' '},
              {testNumber: '046', testString: '0.0000 000.0000-', testSeperator: ' '},
              {testNumber: '047', testString: '0+ 000+', testSeperator: ' '},
              {testNumber: '048', testString: '0.0+ 000.0+', testSeperator: ' '},
              {testNumber: '049', testString: '0.000+ 000.000+', testSeperator: ' '},
              {testNumber: '050', testString: '0.0000+ 000.0000+', testSeperator: ' '},
              {testNumber: '051', testString: '0- 000-', testSeperator: ' '},
              {testNumber: '052', testString: '0.0- 000.0-', testSeperator: ' '},
              {testNumber: '053', testString: '0.000- 000.000-', testSeperator: ' '},
              {testNumber: '054', testString: '0.0000- 000.0000-', testSeperator: ' '},
              //check letters as hemipshere designators
              {testNumber: '055', testString: '0N 0', testSeperator: ' '},
              {testNumber: '056', testString: '0.0N 0.0', testSeperator: ' '},
              {testNumber: '057', testString: '0.000N 0.00', testSeperator: ' '},
              {testNumber: '058', testString: '0.0000N 0.000', testSeperator: ' '},
              {testNumber: '059', testString: 'N0 0', testSeperator: ' '},
              {testNumber: '060', testString: 'N0.0 0.0', testSeperator: ' '},
              {testNumber: '061', testString: 'N0.000 0.00', testSeperator: ' '},
              {testNumber: '062', testString: 'N0.0000 0.000', testSeperator: ' '},
              {testNumber: '063', testString: '0N 0E', testSeperator: ' '},
              {testNumber: '064', testString: '0.0N 0.0E', testSeperator: ' '},
              {testNumber: '065', testString: '0.000N 0.00E', testSeperator: ' '},
              {testNumber: '066', testString: '0.0000N 0.000E', testSeperator: ' '},
              {testNumber: '067', testString: '0N E0', testSeperator: ' '},
              {testNumber: '068', testString: '0.0N E0.0', testSeperator: ' '},
              {testNumber: '069', testString: '0.000N E0.00', testSeperator: ' '},
              {testNumber: '070', testString: '0.0000N E0.000', testSeperator: ' '},
              {testNumber: '071', testString: '0N 0W', testSeperator: ' '},
              {testNumber: '072', testString: '0.0N 0.0W', testSeperator: ' '},
              {testNumber: '073', testString: '0.000N 0.00W', testSeperator: ' '},
              {testNumber: '074', testString: '0.0000N 0.000W', testSeperator: ' '},
              {testNumber: '075', testString: 'N0 0W', testSeperator: ' '},
              {testNumber: '076', testString: 'N0.0 0.0W', testSeperator: ' '},
              {testNumber: '077', testString: 'N0.000 0.00W', testSeperator: ' '},
              {testNumber: '078', testString: 'N0.0000 0.000W', testSeperator: ' '},
              {testNumber: '079', testString: 'N0 W0', testSeperator: ' '},
              {testNumber: '080', testString: 'N0.0 W0.0', testSeperator: ' '},
              {testNumber: '081', testString: 'N0.000 W0.00', testSeperator: ' '},
              {testNumber: '082', testString: 'N0.0000 W0.000', testSeperator: ' '},
              {testNumber: '083', testString: '0S 0', testSeperator: ' '},
              {testNumber: '084', testString: '0.0S 0', testSeperator: ' '},
              {testNumber: '085', testString: '0.000S 0', testSeperator: ' '},
              {testNumber: '086', testString: '0.0000S 0', testSeperator: ' '},
              {testNumber: '087', testString: 'S0 0', testSeperator: ' '},
              {testNumber: '088', testString: 'S0.0 0', testSeperator: ' '},
              {testNumber: '089', testString: 'S0.000 0', testSeperator: ' '},
              {testNumber: '090', testString: 'S0.0000 0', testSeperator: ' '},
              {testNumber: '091', testString: '0S 0E', testSeperator: ' '},
              {testNumber: '092', testString: '0.0S 0.0E', testSeperator: ' '},
              {testNumber: '093', testString: '0.000S 0.00E', testSeperator: ' '},
              {testNumber: '094', testString: '0.0000S 0.000E', testSeperator: ' '},
              {testNumber: '095', testString: '0S E0', testSeperator: ' '},
              {testNumber: '096', testString: '0.0S E0.0', testSeperator: ' '},
              {testNumber: '097', testString: '0.000S E0.00', testSeperator: ' '},
              {testNumber: '098', testString: '0.0000S E0.000', testSeperator: ' '},
              {testNumber: '099', testString: '0S 0W', testSeperator: ' '},
              {testNumber: '100', testString: '0.0S 0.0W', testSeperator: ' '},
              {testNumber: '101', testString: '0.000S 0.00W', testSeperator: ' '},
              {testNumber: '102', testString: '0.0000S 0.000W', testSeperator: ' '},
              {testNumber: '103', testString: 'S0 W0', testSeperator: ' '},
              {testNumber: '104', testString: 'S0.0 W0.0', testSeperator: ' '},
              {testNumber: '105', testString: 'S0.000 W0.00', testSeperator: ' '},
              {testNumber: '106', testString: 'S0.0000 W0.000', testSeperator: ' '},
              {testNumber: '107', testString: '0n 0', testSeperator: ' '},
              {testNumber: '108', testString: '0.0n 0.0', testSeperator: ' '},
              {testNumber: '109', testString: '0.000n 0.00', testSeperator: ' '},
              {testNumber: '110', testString: '0.0000n 0.000', testSeperator: ' '},
              {testNumber: '111', testString: 'n0 0', testSeperator: ' '},
              {testNumber: '112', testString: 'n0.0 0.0', testSeperator: ' '},
              {testNumber: '113', testString: 'n0.000 0.00', testSeperator: ' '},
              {testNumber: '114', testString: 'n0.0000 0.000', testSeperator: ' '},
              {testNumber: '115', testString: '0n 0e', testSeperator: ' '},
              {testNumber: '116', testString: '0.0n 0.0e', testSeperator: ' '},
              {testNumber: '117', testString: '0.000n 0.00e', testSeperator: ' '},
              {testNumber: '118', testString: '0.0000n 0.000e', testSeperator: ' '},
              {testNumber: '119', testString: '0n e0', testSeperator: ' '},
              {testNumber: '120', testString: '0.0n e0.0', testSeperator: ' '},
              {testNumber: '121', testString: '0.000n e0.00', testSeperator: ' '},
              {testNumber: '122', testString: '0.0000n e0.000', testSeperator: ' '},
              {testNumber: '123', testString: '0n 0w', testSeperator: ' '},
              {testNumber: '124', testString: '0.0n 0.0w', testSeperator: ' '},
              {testNumber: '125', testString: '0.000n 0.00w', testSeperator: ' '},
              {testNumber: '126', testString: '0.0000n 0.000w', testSeperator: ' '},
              {testNumber: '127', testString: 'n0 0w', testSeperator: ' '},
              {testNumber: '128', testString: 'n0.0 0.0w', testSeperator: ' '},
              {testNumber: '129', testString: 'n0.000 0.00w', testSeperator: ' '},
              {testNumber: '130', testString: 'n0.0000 0.000w', testSeperator: ' '},
              {testNumber: '131', testString: 'n0 w0', testSeperator: ' '},
              {testNumber: '132', testString: 'n0.0 w0.0', testSeperator: ' '},
              {testNumber: '133', testString: 'n0.000 w0.00', testSeperator: ' '},
              {testNumber: '134', testString: 'n0.0000 w0.000', testSeperator: ' '},
              {testNumber: '135', testString: '0s 0', testSeperator: ' '},
              {testNumber: '136', testString: '0.0s 0', testSeperator: ' '},
              {testNumber: '137', testString: '0.000s 0', testSeperator: ' '},
              {testNumber: '138', testString: '0.0000s 0', testSeperator: ' '},
              {testNumber: '139', testString: 's0 0', testSeperator: ' '},
              {testNumber: '140', testString: 's0.0 0', testSeperator: ' '},
              {testNumber: '141', testString: 's0.000 0', testSeperator: ' '},
              {testNumber: '142', testString: 's0.0000 0', testSeperator: ' '},
              {testNumber: '143', testString: '0s 0e', testSeperator: ' '},
              {testNumber: '144', testString: '0.0s 0.0e', testSeperator: ' '},
              {testNumber: '145', testString: '0.000s 0.00e', testSeperator: ' '},
              {testNumber: '146', testString: '0.0000s 0.000e', testSeperator: ' '},
              {testNumber: '147', testString: '0s e0', testSeperator: ' '},
              {testNumber: '148', testString: '0.0s e0.0', testSeperator: ' '},
              {testNumber: '149', testString: '0.000s e0.00', testSeperator: ' '},
              {testNumber: '150', testString: '0.0000s e0.000', testSeperator: ' '},
              {testNumber: '151', testString: '0s 0w', testSeperator: ' '},
              {testNumber: '152', testString: '0.0s 0.0w', testSeperator: ' '},
              {testNumber: '153', testString: '0.000s 0.00w', testSeperator: ' '},
              {testNumber: '154', testString: '0.0000 0.000w', testSeperator: ' '},
              {testNumber: '155', testString: 's0 w0', testSeperator: ' '},
              {testNumber: '156', testString: 's0.0 w0.0', testSeperator: ' '},
              {testNumber: '157', testString: 's0.000 w0.00', testSeperator: ' '},
              {testNumber: '158', testString: 's0.0000 w0.000', testSeperator: ' '},
              //check degree symbols
              {testNumber: '159', testString: '0° 000°', testSeperator: ' '},
              {testNumber: '160', testString: '0.0° 000.0°', testSeperator: ' '},
              {testNumber: '161', testString: '0.000° 000.000°', testSeperator: ' '},
              {testNumber: '162', testString: '0.0000° 000.0000°', testSeperator: ' '},
              {testNumber: '163', testString: '0˚ 000˚', testSeperator: ' '},
              {testNumber: '164', testString: '0.0˚ 000.0˚', testSeperator: ' '},
              {testNumber: '165', testString: '0.000˚ 000.000˚', testSeperator: ' '},
              {testNumber: '166', testString: '0.0000˚ 000.0000˚', testSeperator: ' '},
              {testNumber: '167', testString: '0º 000º', testSeperator: ' '},
              {testNumber: '168', testString: '0.0º 000.0º', testSeperator: ' '},
              {testNumber: '169', testString: '0.000º 000.000º', testSeperator: ' '},
              {testNumber: '170', testString: '0.0000º 000.0000º', testSeperator: ' '},
              {testNumber: '171', testString: '0^ 000^', testSeperator: ' '},
              {testNumber: '172', testString: '0.0^ 000.0^', testSeperator: ' '},
              {testNumber: '173', testString: '0.000^ 000.000^', testSeperator: ' '},
              {testNumber: '174', testString: '0.0000^ 000.0000^', testSeperator: ' '},
              {testNumber: '175', testString: '0* 000*', testSeperator: ' '},
              {testNumber: '176', testString: '0.0* 000.0*', testSeperator: ' '},
              {testNumber: '177', testString: '0.000* 000.000*', testSeperator: ' '},
              {testNumber: '178', testString: '0.0000* 000.0000*', testSeperator: ' '},
              {testNumber: '179', testString: '0~ 000~', testSeperator: ' '},
              {testNumber: '180', testString: '0.0~ 000.0~', testSeperator: ' '},
              {testNumber: '181', testString: '0.000~ 000.000~', testSeperator: ' '},
              {testNumber: '182', testString: '0.0000~ 000.0000~', testSeperator: ' '},
              //check separator symbol
              {testNumber: '183', testString: '0,000', testSeperator: ','},
              {testNumber: '184', testString: '0.0,000.0', testSeperator: ','},
              {testNumber: '185', testString: '0.000,000.000', testSeperator: ','},
              {testNumber: '186', testString: '0.0000,000.0000', testSeperator: ','},
              {testNumber: '187', testString: '0:000', testSeperator: ':'},
              {testNumber: '188', testString: '0.0:000.0', testSeperator: ':'},
              {testNumber: '189', testString: '0.000:000.000', testSeperator: ':'},
              {testNumber: '190', testString: '0.0000:000.0000', testSeperator: ':'},
              {testNumber: '191', testString: '0;000', testSeperator: ';'},
              {testNumber: '192', testString: '0.0;000.0', testSeperator: ';'},
              {testNumber: '193', testString: '0.000;000.000', testSeperator: ';'},
              {testNumber: '194', testString: '0.0000;000.0000', testSeperator: ';'},
              {testNumber: '195', testString: '0|000', testSeperator: '|'},
              {testNumber: '196', testString: '0.0|000.0', testSeperator: '|'},
              {testNumber: '197', testString: '0.000|000.000', testSeperator: '|'},
              {testNumber: '198', testString: '0.0000|000.0000', testSeperator: '|'},
              {testNumber: '199', testString: '0/000', testSeperator: '/'},
              {testNumber: '200', testString: '0.0/000.0', testSeperator: '/'},
              {testNumber: '201', testString: '0.000/000.000', testSeperator: '/'},
              {testNumber: '202', testString: '0.0000/000.0000', testSeperator: '/'},
              {testNumber: '203', testString: '0\\000', testSeperator: '\\'},
              {testNumber: '204', testString: '0.0\\000.0', testSeperator: '\\'},
              {testNumber: '205', testString: '0.000\\000.000', testSeperator: '\\'},
              {testNumber: '206', testString: '0.0000\\000.0000', testSeperator: '\\'},
              //Check Valid Degrees Lat from 5 to 90 increments of 5
              {testNumber: '207', testString: '5 147', testSeperator: ' '},
              {testNumber: '208', testString: '10 147', testSeperator: ' '},
              {testNumber: '209', testString: '15 147', testSeperator: ' '},
              {testNumber: '210', testString: '20 147', testSeperator: ' '},
              {testNumber: '211', testString: '25 147', testSeperator: ' '},
              {testNumber: '212', testString: '30 147', testSeperator: ' '},
              {testNumber: '213', testString: '35 147', testSeperator: ' '},
              {testNumber: '214', testString: '40 147', testSeperator: ' '},
              {testNumber: '215', testString: '45 147', testSeperator: ' '},
              {testNumber: '216', testString: '50 147', testSeperator: ' '},
              {testNumber: '217', testString: '55 147', testSeperator: ' '},
              {testNumber: '218', testString: '60 147', testSeperator: ' '},
              {testNumber: '219', testString: '65 147', testSeperator: ' '},
              {testNumber: '220', testString: '70 147', testSeperator: ' '},
              {testNumber: '221', testString: '75 147', testSeperator: ' '},
              {testNumber: '222', testString: '80 147', testSeperator: ' '},
              {testNumber: '223', testString: '85 147', testSeperator: ' '},
              {testNumber: '224', testString: '90 147', testSeperator: ' '},
              //Check Valid Degrees Long from 5 to 180 increments of 5
              {testNumber: '225', testString: '45 005', testSeperator: ' '},
              {testNumber: '226', testString: '45 010', testSeperator: ' '},
              {testNumber: '227', testString: '45 015', testSeperator: ' '},
              {testNumber: '228', testString: '45 020', testSeperator: ' '},
              {testNumber: '229', testString: '45 025', testSeperator: ' '},
              {testNumber: '230', testString: '45 030', testSeperator: ' '},
              {testNumber: '231', testString: '45 035', testSeperator: ' '},
              {testNumber: '232', testString: '45 040', testSeperator: ' '},
              {testNumber: '233', testString: '45 045', testSeperator: ' '},
              {testNumber: '234', testString: '45 050', testSeperator: ' '},
              {testNumber: '235', testString: '45 055', testSeperator: ' '},
              {testNumber: '236', testString: '45 060', testSeperator: ' '},
              {testNumber: '237', testString: '45 065', testSeperator: ' '},
              {testNumber: '238', testString: '45 070', testSeperator: ' '},
              {testNumber: '239', testString: '45 075', testSeperator: ' '},
              {testNumber: '240', testString: '45 080', testSeperator: ' '},
              {testNumber: '241', testString: '45 085', testSeperator: ' '},
              {testNumber: '242', testString: '45 090', testSeperator: ' '},
              {testNumber: '243', testString: '45 095', testSeperator: ' '},
              {testNumber: '244', testString: '45 100', testSeperator: ' '},
              {testNumber: '245', testString: '45 105', testSeperator: ' '},
              {testNumber: '246', testString: '45 110', testSeperator: ' '},
              {testNumber: '247', testString: '45 115', testSeperator: ' '},
              {testNumber: '248', testString: '45 120', testSeperator: ' '},
              {testNumber: '249', testString: '45 125', testSeperator: ' '},
              {testNumber: '250', testString: '45 130', testSeperator: ' '},
              {testNumber: '251', testString: '45 135', testSeperator: ' '},
              {testNumber: '252', testString: '45 140', testSeperator: ' '},
              {testNumber: '253', testString: '45 145', testSeperator: ' '},
              {testNumber: '254', testString: '45 150', testSeperator: ' '},
              {testNumber: '255', testString: '45 155', testSeperator: ' '},
              {testNumber: '256', testString: '45 160', testSeperator: ' '},
              {testNumber: '257', testString: '45 165', testSeperator: ' '},
              {testNumber: '258', testString: '45 170', testSeperator: ' '},
              {testNumber: '259', testString: '45 175', testSeperator: ' '},
              {testNumber: '260', testString: '45 180', testSeperator: ' '},
              //check commas used instead of decimal points
              {testNumber: '261', testString: '0 000', testSeperator: ' '},
              {testNumber: '262', testString: '0,0 000,0', testSeperator: ' '},
              {testNumber: '263', testString: '0,000 000,00', testSeperator: ' '},
              {testNumber: '264', testString: '0,0000 000,000', testSeperator: ' '},
              {testNumber: '265', testString: '0,00000 000,0000', testSeperator: ' '},
              {testNumber: '266', testString: '0,000000 000,00000', testSeperator: ' '},
              {testNumber: '267', testString: '0 000', testSeperator: ' '},
              {testNumber: '268', testString: '0,0 000.0', testSeperator: ' '},
              {testNumber: '269', testString: '0,000 000.000', testSeperator: ' '},
              {testNumber: '270', testString: '0,0000 000.0000', testSeperator: ' '},
              {testNumber: '271', testString: '0,00000 000.00000', testSeperator: ' '},
              {testNumber: '272', testString: '0,000000 000.000000', testSeperator: ' '},
              {testNumber: '273', testString: '0 000', testSeperator: ' '},
              {testNumber: '274', testString: '0.0 000,0', testSeperator: ' '},
              {testNumber: '275', testString: '0.000 000,00', testSeperator: ' '},
              {testNumber: '276', testString: '0.0000 000,000', testSeperator: ' '},
              {testNumber: '277', testString: '0.00000 000,0000', testSeperator: ' '},
              {testNumber: '278', testString: '0.000000 000,00000', testSeperator: ' '}            
            ]
            var passed = true;
            var match = '';
            var latLongArray = []; 
            
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
                assert.equal(latLongArray[0], match[1]);
                assert.equal(latLongArray[1], match[9]);
                
                //reset passed
                passed = false
            }
        },
        
        'Test: Input Coords for DD - Long / Lat': function() {
            // create an array of all the strings we want to test
            var validEntries = [
              //check all zeros upto 6 decimal places
              {testNumber: '001', testString: '000 0', testSeperator: ' '},
              {testNumber: '002', testString: '000.0 0.0', testSeperator: ' '},
              {testNumber: '003', testString: '000.000 0.000', testSeperator: ' '},
              {testNumber: '004', testString: '000.0000 0.0000', testSeperator: ' '},
              {testNumber: '005', testString: '000.00000 0.00000', testSeperator: ' '},
              {testNumber: '006', testString: '000.000000 0.000000', testSeperator: ' '},
               //check plus and minus signs as hemishere designators
              {testNumber: '007', testString: '000 +0', testSeperator: ' '},
              {testNumber: '008', testString: '000.0 +0.0', testSeperator: ' '},
              {testNumber: '009', testString: '000.000 +0.000', testSeperator: ' '},
              {testNumber: '010', testString: '000.0000 +0.0000', testSeperator: ' '},
              {testNumber: '011', testString: '+000 0', testSeperator: ' '},
              {testNumber: '012', testString: '+000.0 0.0', testSeperator: ' '},
              {testNumber: '013', testString: '+000.000 0.000', testSeperator: ' '},
              {testNumber: '014', testString: '+000.0000 0.0000', testSeperator: ' '},
              {testNumber: '015', testString: '+000 +0', testSeperator: ' '},
              {testNumber: '016', testString: '+000.0 +0.0', testSeperator: ' '},
              {testNumber: '017', testString: '+000.000 +0.000', testSeperator: ' '},
              {testNumber: '018', testString: '+000.0000 +0.0000', testSeperator: ' '},
              {testNumber: '019', testString: '000 -0', testSeperator: ' '},
              {testNumber: '020', testString: '000.0 -0.0', testSeperator: ' '},
              {testNumber: '021', testString: '000.000 -0.000', testSeperator: ' '},
              {testNumber: '022', testString: '000.0000 -0.0000', testSeperator: ' '},
              {testNumber: '023', testString: '-000 0', testSeperator: ' '},
              {testNumber: '024', testString: '-000.0 0.0', testSeperator: ' '},
              {testNumber: '025', testString: '-000.000 0.000', testSeperator: ' '},
              {testNumber: '026', testString: '-000.0000 0.0000', testSeperator: ' '},
              {testNumber: '027', testString: '-000 -0', testSeperator: ' '},
              {testNumber: '028', testString: '-000.0 -0.0', testSeperator: ' '},
              {testNumber: '029', testString: '-000.000 -0.000', testSeperator: ' '},
              {testNumber: '030', testString: '-000.0000 -0.0000', testSeperator: ' '},
              {testNumber: '031', testString: '000 0+', testSeperator: ' '},
              {testNumber: '032', testString: '000.0 0.0+', testSeperator: ' '},
              {testNumber: '033', testString: '000.000 0.000+', testSeperator: ' '},
              {testNumber: '034', testString: '000.0000 0.0000+', testSeperator: ' '},
              {testNumber: '035', testString: '000+ 0', testSeperator: ' '},
              {testNumber: '036', testString: '000.0+ 0.0', testSeperator: ' '},
              {testNumber: '037', testString: '000.000+ 0.000', testSeperator: ' '},
              {testNumber: '038', testString: '000.0000+ 0.0000', testSeperator: ' '},
              {testNumber: '039', testString: '000 0-', testSeperator: ' '},
              {testNumber: '040', testString: '000.0 0.0-', testSeperator: ' '},
              {testNumber: '041', testString: '000.000 0.000-', testSeperator: ' '},
              {testNumber: '042', testString: '000.0000 0.0000-', testSeperator: ' '},
              {testNumber: '043', testString: '000- 0', testSeperator: ' '},
              {testNumber: '044', testString: '000.0- 0.0', testSeperator: ' '},
              {testNumber: '045', testString: '000.000- 0.000', testSeperator: ' '},
              {testNumber: '046', testString: '000.0000- 0.0000', testSeperator: ' '},
              {testNumber: '047', testString: '000+ 0+', testSeperator: ' '},
              {testNumber: '048', testString: '000.0+ 0.0+', testSeperator: ' '},
              {testNumber: '049', testString: '000.000+ 0.000+', testSeperator: ' '},
              {testNumber: '050', testString: '000.0000+ 0.0000+', testSeperator: ' '},
              {testNumber: '051', testString: '000- 0-', testSeperator: ' '},
              {testNumber: '052', testString: '000.0- 0.0-', testSeperator: ' '},
              {testNumber: '053', testString: '000.000- 0.000-', testSeperator: ' '},
              {testNumber: '054', testString: '000.0000- 0.0000-', testSeperator: ' '},
              //check letters as hemipshere designators
              {testNumber: '055', testString: '0 0N', testSeperator: ' '},
              {testNumber: '056', testString: '0.0 0.0N', testSeperator: ' '},
              {testNumber: '057', testString: '0.00 0.000N', testSeperator: ' '},
              {testNumber: '058', testString: '0.000 0.0000N', testSeperator: ' '},
              {testNumber: '059', testString: '0 N0', testSeperator: ' '},
              {testNumber: '060', testString: '0.0 N0.0', testSeperator: ' '},
              {testNumber: '061', testString: '0.00 N0.000', testSeperator: ' '},
              {testNumber: '062', testString: '0.000 N0.0000', testSeperator: ' '},
              {testNumber: '063', testString: '0E 0N', testSeperator: ' '},
              {testNumber: '064', testString: '0.0E 0.0N', testSeperator: ' '},
              {testNumber: '065', testString: '0.00E 0.000N', testSeperator: ' '},
              {testNumber: '066', testString: '0.000E 0.0000N', testSeperator: ' '},
              {testNumber: '067', testString: 'E0 0N', testSeperator: ' '},
              {testNumber: '068', testString: 'E0.0 0.0N', testSeperator: ' '},
              {testNumber: '069', testString: 'E0.00 0.000N', testSeperator: ' '},
              {testNumber: '070', testString: 'E0.000 0.0000N', testSeperator: ' '},
              {testNumber: '071', testString: '0W 0N', testSeperator: ' '},
              {testNumber: '072', testString: '0.0W 0.0N', testSeperator: ' '},
              {testNumber: '073', testString: '0.00W 0.000N', testSeperator: ' '},
              {testNumber: '074', testString: '0.000W 0.0000N', testSeperator: ' '},
              {testNumber: '075', testString: '0W N0', testSeperator: ' '},
              {testNumber: '076', testString: '0.0W N0.0', testSeperator: ' '},
              {testNumber: '077', testString: '0.00W N0.000', testSeperator: ' '},
              {testNumber: '078', testString: '0.000W N0.0000', testSeperator: ' '},
              {testNumber: '079', testString: 'W0 N0', testSeperator: ' '},
              {testNumber: '080', testString: 'W0.0 N0.0', testSeperator: ' '},
              {testNumber: '081', testString: 'W0.00 N0.000', testSeperator: ' '},
              {testNumber: '082', testString: 'W0.000 N0.0000', testSeperator: ' '},
              {testNumber: '083', testString: '0 0S', testSeperator: ' '},
              {testNumber: '084', testString: '0 0.0S', testSeperator: ' '},
              {testNumber: '085', testString: '0 0.000S', testSeperator: ' '},
              {testNumber: '086', testString: '0 0.0000S', testSeperator: ' '},
              {testNumber: '087', testString: '0 S0', testSeperator: ' '},
              {testNumber: '088', testString: '0 S0.0', testSeperator: ' '},
              {testNumber: '089', testString: '0 S0.000', testSeperator: ' '},
              {testNumber: '090', testString: '0 S0.0000', testSeperator: ' '},
              {testNumber: '091', testString: '0E 0S', testSeperator: ' '},
              {testNumber: '092', testString: '0.0E 0.0S', testSeperator: ' '},
              {testNumber: '093', testString: '0.00E 0.000S', testSeperator: ' '},
              {testNumber: '094', testString: '0.000E 0.0000S', testSeperator: ' '},
              {testNumber: '095', testString: 'E0 0S', testSeperator: ' '},
              {testNumber: '096', testString: 'E0.0 0.0S', testSeperator: ' '},
              {testNumber: '097', testString: 'E0.00 0.000S', testSeperator: ' '},
              {testNumber: '098', testString: 'E0.000 0.0000S', testSeperator: ' '},
              {testNumber: '099', testString: '0W 0S', testSeperator: ' '},
              {testNumber: '100', testString: '0.0W 0.0S', testSeperator: ' '},
              {testNumber: '101', testString: '0.00W 0.000S', testSeperator: ' '},
              {testNumber: '102', testString: '0.000W 0.0000S', testSeperator: ' '},
              {testNumber: '103', testString: 'W0 S0', testSeperator: ' '},
              {testNumber: '104', testString: 'W0.0 S0.0', testSeperator: ' '},
              {testNumber: '105', testString: 'W0.00 S0.000', testSeperator: ' '},
              {testNumber: '106', testString: 'W0.000 S0.0000', testSeperator: ' '},
              {testNumber: '107', testString: '0 0n', testSeperator: ' '},
              {testNumber: '108', testString: '0.0 0.0n', testSeperator: ' '},
              {testNumber: '109', testString: '0.00 0.000n', testSeperator: ' '},
              {testNumber: '110', testString: '0.000 0.0000n', testSeperator: ' '},
              {testNumber: '111', testString: '0 n0', testSeperator: ' '},
              {testNumber: '112', testString: '0.0 n0.0', testSeperator: ' '},
              {testNumber: '113', testString: '0.00 n0.000', testSeperator: ' '},
              {testNumber: '114', testString: '0.000 n0.0000', testSeperator: ' '},
              {testNumber: '115', testString: '0e 0n', testSeperator: ' '},
              {testNumber: '116', testString: '0.0e 0.0n', testSeperator: ' '},
              {testNumber: '117', testString: '0.00e 0.000n', testSeperator: ' '},
              {testNumber: '118', testString: '0.000e 0.0000n', testSeperator: ' '},
              {testNumber: '119', testString: 'e0 0n', testSeperator: ' '},
              {testNumber: '120', testString: 'e0.0 0.0n', testSeperator: ' '},
              {testNumber: '121', testString: 'e0.00 0.000n', testSeperator: ' '},
              {testNumber: '122', testString: 'e0.000 0.0000n', testSeperator: ' '},
              {testNumber: '123', testString: '0w 0n', testSeperator: ' '},
              {testNumber: '124', testString: '0.0w 0.0n', testSeperator: ' '},
              {testNumber: '125', testString: '0.00w 0.000n', testSeperator: ' '},
              {testNumber: '126', testString: '0.000w 0.0000n', testSeperator: ' '},
              {testNumber: '127', testString: '0w n0', testSeperator: ' '},
              {testNumber: '128', testString: '0.0w n0.0', testSeperator: ' '},
              {testNumber: '129', testString: '0.00w n0.000', testSeperator: ' '},
              {testNumber: '130', testString: '0.000w n0.0000', testSeperator: ' '},
              {testNumber: '131', testString: 'w0 n0', testSeperator: ' '},
              {testNumber: '132', testString: 'w0.0 n0.0', testSeperator: ' '},
              {testNumber: '133', testString: 'w0.00 n0.000', testSeperator: ' '},
              {testNumber: '134', testString: 'w0.000 n0.0000', testSeperator: ' '},
              {testNumber: '135', testString: '0 0s', testSeperator: ' '},
              {testNumber: '136', testString: '0 0.0s', testSeperator: ' '},
              {testNumber: '137', testString: '0 0.000s', testSeperator: ' '},
              {testNumber: '138', testString: '0 0.0000s', testSeperator: ' '},
              {testNumber: '139', testString: '0 s0', testSeperator: ' '},
              {testNumber: '140', testString: '0 s0.0', testSeperator: ' '},
              {testNumber: '141', testString: '0 s0.000', testSeperator: ' '},
              {testNumber: '142', testString: '0 s0.0000', testSeperator: ' '},
              {testNumber: '143', testString: '0e 0s', testSeperator: ' '},
              {testNumber: '144', testString: '0.0e 0.0s', testSeperator: ' '},
              {testNumber: '145', testString: '0.00e 0.000s', testSeperator: ' '},
              {testNumber: '146', testString: '0.000e 0.0000s', testSeperator: ' '},
              {testNumber: '147', testString: 'e0 0s', testSeperator: ' '},
              {testNumber: '148', testString: 'e0.0 0.0s', testSeperator: ' '},
              {testNumber: '149', testString: 'e0.00 0.000s', testSeperator: ' '},
              {testNumber: '150', testString: 'e0.000 0.0000s', testSeperator: ' '},
              {testNumber: '151', testString: '0w 0s', testSeperator: ' '},
              {testNumber: '152', testString: '0.0w 0.0s', testSeperator: ' '},
              {testNumber: '153', testString: '0.00w 0.000s', testSeperator: ' '},
              {testNumber: '154', testString: '0.000w 0.0000', testSeperator: ' '},
              {testNumber: '155', testString: 'w0 s0', testSeperator: ' '},
              {testNumber: '156', testString: 'w0.0 s0.0', testSeperator: ' '},
              {testNumber: '157', testString: 'w0.00 s0.000', testSeperator: ' '},
              {testNumber: '158', testString: 'w0.000 s0.0000', testSeperator: ' '},
              //check degree symbols
              {testNumber: '159', testString: '000° 0°', testSeperator: ' '},
              {testNumber: '160', testString: '000.0° 0.0°', testSeperator: ' '},
              {testNumber: '161', testString: '000.000° 0.000°', testSeperator: ' '},
              {testNumber: '162', testString: '000.0000° 0.0000°', testSeperator: ' '},
              {testNumber: '163', testString: '000˚ 0˚', testSeperator: ' '},
              {testNumber: '164', testString: '000.0˚ 0.0˚', testSeperator: ' '},
              {testNumber: '165', testString: '000.000˚ 0.000˚', testSeperator: ' '},
              {testNumber: '166', testString: '000.0000˚ 0.0000˚', testSeperator: ' '},
              {testNumber: '167', testString: '000º 0º', testSeperator: ' '},
              {testNumber: '168', testString: '000.0º 0.0º', testSeperator: ' '},
              {testNumber: '169', testString: '000.000º 0.000º', testSeperator: ' '},
              {testNumber: '170', testString: '000.0000º 0.0000º', testSeperator: ' '},
              {testNumber: '171', testString: '000^ 0^', testSeperator: ' '},
              {testNumber: '172', testString: '000.0^ 0.0^', testSeperator: ' '},
              {testNumber: '173', testString: '000.000^ 0.000^', testSeperator: ' '},
              {testNumber: '174', testString: '000.0000^ 0.0000^', testSeperator: ' '},
              {testNumber: '175', testString: '000* 0*', testSeperator: ' '},
              {testNumber: '176', testString: '000.0* 0.0*', testSeperator: ' '},
              {testNumber: '177', testString: '000.000* 0.000*', testSeperator: ' '},
              {testNumber: '178', testString: '000.0000* 0.0000*', testSeperator: ' '},
              {testNumber: '179', testString: '000~ 0~', testSeperator: ' '},
              {testNumber: '180', testString: '000.0~ 0.0~', testSeperator: ' '},
              {testNumber: '181', testString: '000.000~ 0.000~', testSeperator: ' '},
              {testNumber: '182', testString: '000.0000~ 0.0000~', testSeperator: ' '},
              //check separator symbol
              {testNumber: '183', testString: '000,0', testSeperator: ','},
              {testNumber: '184', testString: '000.0,0.0', testSeperator: ','},
              {testNumber: '185', testString: '000.000,0.000', testSeperator: ','},
              {testNumber: '186', testString: '000.0000,0.0000', testSeperator: ','},
              {testNumber: '187', testString: '000:0', testSeperator: ':'},
              {testNumber: '188', testString: '000.0:0.0', testSeperator: ':'},
              {testNumber: '189', testString: '000.000:0.000', testSeperator: ':'},
              {testNumber: '190', testString: '000.0000:0.0000', testSeperator: ':'},
              {testNumber: '191', testString: '000;0', testSeperator: ';'},
              {testNumber: '192', testString: '000.0;0.0', testSeperator: ';'},
              {testNumber: '193', testString: '000.000;0.000', testSeperator: ';'},
              {testNumber: '194', testString: '000.0000;0.0000', testSeperator: ';'},
              {testNumber: '195', testString: '000|0', testSeperator: '|'},
              {testNumber: '196', testString: '000.0|0.0', testSeperator: '|'},
              {testNumber: '197', testString: '000.000|0.000', testSeperator: '|'},
              {testNumber: '198', testString: '000.0000|0.0000', testSeperator: '|'},
              {testNumber: '199', testString: '000/0', testSeperator: '/'},
              {testNumber: '200', testString: '000.0/0.0', testSeperator: '/'},
              {testNumber: '201', testString: '000.000/0.000', testSeperator: '/'},
              {testNumber: '202', testString: '000.0000/0.0000', testSeperator: '/'},
              {testNumber: '203', testString: '000\\0', testSeperator: '\\'},
              {testNumber: '204', testString: '000.0\\0.0', testSeperator: '\\'},
              {testNumber: '205', testString: '000.000\\0.000', testSeperator: '\\'},
              {testNumber: '206', testString: '000.0000\\0.0000', testSeperator: '\\'},
              //Check Valid Degrees Lat from 5 to 90 increments of 5
              {testNumber: '207', testString: '147 5', testSeperator: ' '},
              {testNumber: '208', testString: '147 10', testSeperator: ' '},
              {testNumber: '209', testString: '147 15', testSeperator: ' '},
              {testNumber: '210', testString: '147 20', testSeperator: ' '},
              {testNumber: '211', testString: '147 25', testSeperator: ' '},
              {testNumber: '212', testString: '147 30', testSeperator: ' '},
              {testNumber: '213', testString: '147 35', testSeperator: ' '},
              {testNumber: '214', testString: '147 40', testSeperator: ' '},
              {testNumber: '215', testString: '147 45', testSeperator: ' '},
              {testNumber: '216', testString: '147 50', testSeperator: ' '},
              {testNumber: '217', testString: '147 55', testSeperator: ' '},
              {testNumber: '218', testString: '147 60', testSeperator: ' '},
              {testNumber: '219', testString: '147 65', testSeperator: ' '},
              {testNumber: '220', testString: '147 70', testSeperator: ' '},
              {testNumber: '221', testString: '147 75', testSeperator: ' '},
              {testNumber: '222', testString: '147 80', testSeperator: ' '},
              {testNumber: '223', testString: '147 85', testSeperator: ' '},
              {testNumber: '224', testString: '147 90', testSeperator: ' '},
              //Check Valid Degrees Long from 5 to 180 increments of 5
              {testNumber: '225', testString: '005 45', testSeperator: ' '},
              {testNumber: '226', testString: '010 45', testSeperator: ' '},
              {testNumber: '227', testString: '015 45', testSeperator: ' '},
              {testNumber: '228', testString: '020 45', testSeperator: ' '},
              {testNumber: '229', testString: '025 45', testSeperator: ' '},
              {testNumber: '230', testString: '030 45', testSeperator: ' '},
              {testNumber: '231', testString: '035 45', testSeperator: ' '},
              {testNumber: '232', testString: '040 45', testSeperator: ' '},
              {testNumber: '233', testString: '045 45', testSeperator: ' '},
              {testNumber: '234', testString: '050 45', testSeperator: ' '},
              {testNumber: '235', testString: '055 45', testSeperator: ' '},
              {testNumber: '236', testString: '060 45', testSeperator: ' '},
              {testNumber: '237', testString: '065 45', testSeperator: ' '},
              {testNumber: '238', testString: '070 45', testSeperator: ' '},
              {testNumber: '239', testString: '075 45', testSeperator: ' '},
              {testNumber: '240', testString: '080 45', testSeperator: ' '},
              {testNumber: '241', testString: '085 45', testSeperator: ' '},
              {testNumber: '242', testString: '090 45', testSeperator: ' '},
              {testNumber: '243', testString: '095 45', testSeperator: ' '},
              {testNumber: '244', testString: '100 45', testSeperator: ' '},
              {testNumber: '245', testString: '105 45', testSeperator: ' '},
              {testNumber: '246', testString: '110 45', testSeperator: ' '},
              {testNumber: '247', testString: '115 45', testSeperator: ' '},
              {testNumber: '248', testString: '120 45', testSeperator: ' '},
              {testNumber: '249', testString: '125 45', testSeperator: ' '},
              {testNumber: '250', testString: '130 45', testSeperator: ' '},
              {testNumber: '251', testString: '135 45', testSeperator: ' '},
              {testNumber: '252', testString: '140 45', testSeperator: ' '},
              {testNumber: '253', testString: '145 45', testSeperator: ' '},
              {testNumber: '254', testString: '150 45', testSeperator: ' '},
              {testNumber: '255', testString: '155 45', testSeperator: ' '},
              {testNumber: '256', testString: '160 45', testSeperator: ' '},
              {testNumber: '257', testString: '165 45', testSeperator: ' '},
              {testNumber: '258', testString: '170 45', testSeperator: ' '},
              {testNumber: '259', testString: '175 45', testSeperator: ' '},
              {testNumber: '260', testString: '180 45', testSeperator: ' '},
              //check commas used instead of decimal points
              {testNumber: '261', testString: '000 0', testSeperator: ' '},
              {testNumber: '262', testString: '000,0 0,0', testSeperator: ' '},
              {testNumber: '263', testString: '000,00 0,000', testSeperator: ' '},
              {testNumber: '264', testString: '000,000 0,0000', testSeperator: ' '},
              {testNumber: '265', testString: '000,0000 0,00000', testSeperator: ' '},
              {testNumber: '266', testString: '000,00000 0,000000', testSeperator: ' '},
              {testNumber: '267', testString: '000 0', testSeperator: ' '},
              {testNumber: '268', testString: '000.0 0,0', testSeperator: ' '},
              {testNumber: '269', testString: '000.000 0,000', testSeperator: ' '},
              {testNumber: '270', testString: '000.0000 0,0000', testSeperator: ' '},
              {testNumber: '271', testString: '000.00000 0,00000', testSeperator: ' '},
              {testNumber: '272', testString: '000.000000 0,000000', testSeperator: ' '},
              {testNumber: '273', testString: '000 0', testSeperator: ' '},
              {testNumber: '274', testString: '000,0 0.0', testSeperator: ' '},
              {testNumber: '275', testString: '000,00 0.000', testSeperator: ' '},
              {testNumber: '276', testString: '000,000 0.0000', testSeperator: ' '},
              {testNumber: '277', testString: '000,0000 0.00000', testSeperator: ' '},
              {testNumber: '278', testString: '000,00000 0.000000', testSeperator: ' '}              
            ]
            var passed = false;
            var match = '';
            var latLongArray = []; 
            
            for (var i = 0; i < validEntries.length; i++) {
                ccUtil.getCoordinateType(validEntries[i].testString).then(function(itm){
                  /* as the getCoordinateType function returns a promise and resolving the promise indicates a passing test:
                  ** https://theintern.github.io/intern/#async-tests
                  ** we need check whats in the promise return and set the passed boolean to true or false accordinaly
                  ** we can the use the passed boolean to perform an assert.isTrue outside of the promise
                  */
                  if(itm.length == 1){
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
                assert.isTrue(passed, 'Test Number: ' + validEntries[i].testNumber + " String: " + validEntries[i].testString + ' did not validate as DD Lat/Long');
                
                //test to see if the regular expression has correctly identified the Lat / long values by comparing them against the original string
                assert.equal(latLongArray[0], match[1]);
                assert.equal(latLongArray[1], match[10]);
                
                //reset passed
                passed = false
            }
        }
    });
});