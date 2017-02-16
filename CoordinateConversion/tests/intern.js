define([], function() {
  this.dojoConfig = { async: 1 };

  return {
    proxyPort: 9000,
    proxyUrl: 'http://localhost:9000/',

    capabilities: {
      'selenium-version': '2.42.2'
    },

    environments: [{
      browserName: 'internet explorer',
      version: '10',
      platform: 'Windows 8'
    }, {
      browserName: 'internet explorer',
      version: '9',
      platform: 'Windows 7'
    }, {
      browserName: 'firefox',
      version: '23',
      platform: ['Linux', 'Windows 7']
    }, {
      browserName: 'firefox',
      version: '21',
      platform: 'Mac 10.6'
    }, {
      browserName: 'chrome',
      platform: ['Linux', 'Mac 10.8', 'Windows 7']
    }, {
      browserName: 'safari',
      version: '6',
      platform: 'Mac 10.8'
    }],

    tunnel: 'NullTunnel',

    useLoader: {
      'host-browser': 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/dojo/dojo.js'
    },

    loader: {
      packages: [
        {
          name: 'tests',
          location: './widgets/CoordinateConversion/tests'
        }, {
          name: 'CC',
          location: './widgets/CoordinateConversion'
        }, {
          name: 'esri',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/esri'
        }, {
          name: 'dgrid',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/dgrid'
        }, {
          name: 'put-selector',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/put-selector'
        }, {
          name: 'xstyle',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/xstyle'
        }, {
          name: 'dojo',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/dojo'
        }, {
          name: 'dojox',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/dojox'
        }, {
          name: 'dijit',
          location: 'https://hgis-ags10-4-1.gigzy.local/arcgis_js_api/library/3.19/3.19/dijit'
        }, {
          name: 'jimu',
          location: './jimu.js'
        }, {
          name: 'moment',
          location: './widgets/CoordinateConversion/tests'
        }
      ]
    },

    suites: ['tests/coordinate-conversion-unit-test'],

    excludeInstrumentation: /^(?:test|node_modules)/
  };
});