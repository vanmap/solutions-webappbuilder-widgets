## Directions ##
### Overview ###
The Directions widget provides a quick and efficient method of calculating directions between two or more locations. The widget generates a route finding a least-cost path between two or more locations using a specified network service. The Directions widget is pre-configured to work with the ArcGIS Online Network Analysis Services. These services require an ArcGIS Online Organization subscription. If you choose to work with this default, specify a valid user name and password for ArcGIS Online. Each successful request to the service incurs service credits taken from your subscription.

### Attributes ###
* `routeTaskUrl`: String; default—http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World. The URL address of the network route service.

Example:
```
"routeTaskUrl":"http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
```

* `locatorUrl`:  String; default—http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer. The URL address of the geocoding service.

Example:
```
"locatorUrl":"http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
```

* `geocoderOptions`: Object; default: no default; 
    - `autoComplete`: boolean; default: true —The value indicating whether autocomplete is enabled.

Example:
```
"geocoderOptions": {
  "autoComplete":true
}
```
