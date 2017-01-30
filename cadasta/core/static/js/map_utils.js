function geoLocate(map) {
  return function(event) {
    map.locate({ setView: true });
  }
}

function add_map_controls(map) {
  map.removeControl(map.zoomControl);
  map.addControl(L.control.zoom({
    zoomInTitle: gettext("Zoom in"),
    zoomOutTitle: gettext("Zoom out")
  }));

  var geocoder = L.control.geocoder('search-QctWfva', {
    markers: false
  }).addTo(map);
  geocoder.on('select', function (e) {
    map.setZoomAround(e.latlng, 9);
  });

  var Geolocate = L.Control.extend({
    options: {
      position: 'topleft'
    },

    onAdd: function(map) {
      var controlDiv = L.DomUtil.create(
        'div', 'leaflet-bar leaflet-control leaflet-control-geolocate'
      );
      controlDiv.title = gettext('Go to my location');
      L.DomEvent
       .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
       .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
       .addListener(controlDiv, 'click', geoLocate(map));

      L.DomUtil.create('span', 'glyphicon glyphicon-map-marker', controlDiv);

      return controlDiv;
    }
  });

  map.addControl(new Geolocate());

  return map
}

function renderFeatures(map, featuresUrl, options) {
  options = options || {};

  function locationToFront() {
    if (options.location) {
      options.location.bringToFront();
    }
  }

  // function loadFeatures(url) {
  //   prev_urls = []
  //   $('#messages #loading').removeClass('hidden');
  //   $.get(url, function(response) {
  //     if (url in prev_urls) {
  //       return;
  //     } else {
  //       prev_urls.push(url)
  //       // console.log(response)
  //       geoJson.addData(response);

  //       if (response.next) {
  //         loadFeatures(response.next, map, options.trans);
  //       } else {
  //         $('#messages #loading').addClass('hidden');
  //         if (options.fitBounds === 'locations') {
  //           var bounds = markers.getBounds();
  //           if (bounds.isValid()) {
  //             map.fitBounds(bounds);  
  //           }
  //         }
  //       }

  //       locationToFront();
  //     }
  //   });
  // }

  var projectBounds;

  if (options.projectExtent) {
    var boundary = L.geoJson(
      options.projectExtent, {
        style: {
          stroke: true,
          color: "#0e305e",
          weight: 2,
          dashArray: "5, 5",
          opacity: 1,
          fill: false,
          clickable: false,
        }
      }
    );
    boundary.addTo(map);
    projectBounds = boundary.getBounds();
    if (options.fitBounds === 'project') {map.fitBounds(projectBounds);}
  } else {
    map.fitBounds([[-45.0, -180.0], [45.0, 180.0]]);
  }
  
  // var geoJson = L.geoJson(null, {
  //   style: { weight: 2 },
  //   onEachFeature: function(feature, layer) {
  //     if (options.trans) {
  //       layer.bindPopup("<div class=\"text-wrap\">" +
  //                     "<h2><span>Location</span>" +
  //                     feature.properties.type + "</h2></div>" +
  //                     "<div class=\"btn-wrap\"><a href='" + feature.properties.url + "' class=\"btn btn-primary btn-sm btn-block\">" + options.trans['open'] + "</a>"  +
  //                     "</div>");  
  //     }
  //   }
  // });

  // var markers = L.Deflate({minSize: 20, layerGroup: geoJson});
  // markers.addTo(map);
  // map.eachLayer(function(layer){
  //   map.removeLayer(layer);
  // });
  // geoJson.addTo(map);

  if (options.location) {
    options.location.addTo(map);
    map.fitBounds(options.location.getBounds());
  } else if (projectBounds) {
    map.fitBounds(projectBounds);
  }
  // loadFeatures(featuresUrl);
  map.on('zoomend', locationToFront);
  map.on('dragend', locationToFront);
}

function temp_load_locations(map, url, trans, geo_json, current, prev_urls){
  $('#messages #loading').removeClass('hidden');
  $.get(url, function(response) {
    if (url in prev_urls) {
      return;
    } else {
      prev_urls.push(url);
      new_response = []
      for (i in response.features) {
        if (!current[response.features[i].id]) {
          current[response.features[i].id] = true;
          new_response.push(response.features[i])
        } 
      }
      if (new_response.length > 0){
        geo_json.addData(new_response);
      }

      if (response.next) {
        temp_load_locations(response.next, map, trans);
      } else {
        $('#messages #loading').addClass('hidden');
      }
    }
  });

  // map.eachLayer(function(layer){
  //   if (layer.options.geometry) {
  //     map.removeLayer(layer)
  //   }
  //   // console.log(layer)
  // })
  // geo_json.clearLayers()
  geo_json.addTo(map);
}

function switch_layer_controls(map, options, org_slug, project_slug, projectExtent, trans){
  // swap out default layer switcher
  var geoJson = L.geoJson(null, {
    style: { weight: 2 },
    onEachFeature: function(feature, layer) {
      if (trans) {
        layer.bindPopup("<div class=\"text-wrap\">" +
                      "<h2><span>Location</span>" +
                      feature.properties.type + "</h2></div>" +
                      "<div class=\"btn-wrap\"><a href='" + feature.properties.url + "' class=\"btn btn-primary btn-sm btn-block\">" + trans['open'] + "</a>"  +
                      "</div>");  
      }
    }
  });

  geoJson.addTo(map);
  var prev_urls = []
  var current_layers = {}
  var layers = options.djoptions.layers;
  var baseLayers = {};
  // var tiles = {
  //   'minx': null,
  //   'miny': null,
  //   'maxx': null,
  //   'maxy': null,
  //   'zoom': 0
  // };
  for (var l in layers){
    var layer = layers[l];
    var baseLayer = L.tileLayer(layer[1], layer[2]);
    baseLayer.on('tileload', function(e){
      url = '/async/organizations/'+ org_slug +'/projects/' + project_slug + '/spatial/tiled/' + e.coords['z'] + '/' + e.coords['x'] + '/' + e.coords['y'] + '/'
      // console.log(url)
      // renderFeatures(map, url, {projectExtent: projectExtent, trans: trans, fitBounds: null})
      temp_load_locations(map, url, trans, geoJson, current_layers, prev_urls)
      // if (e.coords['z'] !== tiles['zoom']) {
      //   tiles['zoom'] = e.coords['z']
      // };

      // if (!tiles['minx']) {
      //   tiles['minx'] = e.coords['x']
      //   tiles['maxx'] = e.coords['x']
      //   tiles['miny'] = e.coords['y']
      //   tiles['maxy'] = e.coords['y']
      // } else {
      //   if (e.coords['x'] > tiles['maxx']) {
      //     tiles['maxx'] = e.coords['x']
      //   } else if (e.coords['x'] < tiles['minx']) {
      //     tiles['minx'] = e.coords['x']
      //   } else if (e.coords['y'] > tiles['maxy']) {
      //     tiles['maxy'] = e.coords['y']
      //   } else if (e.coords['y'] < tiles['miny']) {
      //     tiles['miny'] = e.coords['y']
      //   };
      // }
      // console.log(e.coords)
      // console.log(tiles)
    });
    baseLayers[layer[0]] = baseLayer;
  }
  // select first layer by default
  for (var l in baseLayers){
    map.addLayer(baseLayers[l]);
    break;
  }
  var groupedOptions = {
    groupCheckboxes: false
  };
  // map.removeControl(map.layerscontrol);
  map.layerscontrol = L.control.groupedLayers(
    baseLayers, groupedOptions).addTo(map);
}

function add_spatial_resources(map, url){
  $.ajax(url).done(function(data){
    if (data.length == 0) return;
    var spatialResources = {};
    $.each(data, function(idx, resource){
      var name = resource.name;
      var layers = {};
      var group = new L.LayerGroup();
      $.each(resource.spatial_resources, function(i, spatial_resource){
        var layer = L.geoJson(spatial_resource.geom).addTo(group);
        layers['name'] = spatial_resource.name;
        layers['group'] = group;
      });
      spatialResources[name] = layers;
    });
    $.each(spatialResources, function(sr){
      var layer = spatialResources[sr];
      map.layerscontrol.addOverlay(layer['group'], layer['name'], sr);
    })
  });
}

function enableMapEditMode() {
  var editButton = $('.leaflet-draw-edit-edit')[0];
  if (!editButton) {
    setTimeout(enableMapEditMode, 500);
  } else {
    var clickEvent = new MouseEvent('click');
    editButton.dispatchEvent(clickEvent);
  }
}

function saveOnMapEditMode() {
  var saveButton = $('.leaflet-draw-actions-top li:first-child a')[0];
  if (saveButton) {
    var clickEvent = new MouseEvent('click');
    saveButton.dispatchEvent(clickEvent);
  }
}




