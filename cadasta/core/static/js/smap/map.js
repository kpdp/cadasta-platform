var SMap = (function() {
  var map = L.map('mapid');
  var layerscontrol = L.control.layers().addTo(map);
  var prev_urls = [];
  var loaded_features = {};
  var geoJson = L.geoJson(null, {
    style: { weight: 2 },
    onEachFeature: function(feature, layer) {
      if (options.trans) {
        layer.bindPopup("<div class=\"text-wrap\">" +
                      "<h2><span>Location</span>" +
                      feature.properties.type + "</h2></div>" +
                      "<div class=\"btn-wrap\"><a href='" + feature.properties.url + "' class=\"btn btn-primary btn-sm btn-block\">" + options.trans['open'] + "</a>"  +
                      "</div>");
      }
    }
  });

  geoJson.addTo(map);

  function add_tile_layers() {
    for (var i = 0, n = layers.length; i < n; i++) {
      var attrs = L.Util.extend(layers[i]['attrs']);
      var layer = {name: layers[i]['label'], url: layers[i]['url'], options: attrs};

      var l = L.tileLayer(layer.url, layer.options);
      l.on('tileload', function(e){
        url = '/async/organizations/'+ options.org_slug +'/projects/' + options.project_slug + '/spatial/tiled/' + e.coords['z'] + '/' + e.coords['x'] + '/' + e.coords['y'] + '/'

        load_features(url, reload=true)

      });
      layerscontrol.addBaseLayer(l, layer.name);

      if (i === 0) {
        l.addTo(map); 
      }
    }
  }

  add_tile_layers();

  function load_project_extent() {
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
    }
    if (options.fitBounds === 'project') {
      map.fitBounds(projectBounds);
    } else if (options.fitBounds !== 'locations') {
      map.fitBounds([[-45.0, -180.0], [45.0, 180.0]]);
    }
  }

  load_project_extent()

  // function render_features(){
    
  // }

  function load_features(request_url, reload=false) {
    $('#messages #loading').removeClass('hidden');
    if (url in prev_urls) {
      return;
    } else {
      prev_urls.push(url);
      new_features = []

      $.get(request_url, function(response) {
        for (i in response.features) {
          if (!loaded_features[response.features[i].id]) {
            loaded_features[response.features[i].id] = true;
            new_features.push(response.features[i])
          } 
        }
        if (new_features.length > 0){
          geoJson.addData(new_features);
        }

        if (response.next) {
          load_features(response.next);
        } else {
          $('#messages #loading').addClass('hidden');
          if (!reload) {
            if (options.fitBounds === 'locations') {
              var bounds = geoJson.getBounds();
              if (bounds.isValid()) {
                map.fitBounds(bounds);
              }
            }
          }
        }
      });
    }
  }

  load_features(url);
  // render_features()

  function render_spatial_resource(){
    $.ajax(fetch_spatial_resources).done(function(data){
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
        layerscontrol.addOverlay(layer['group'], layer['name'], sr);
      })
    });
  }

  render_spatial_resource();

  function geoLocate() {
    return function(event) {
      map.locate({ setView: true });
    }
  }

  $(window).on('hashchange', function() {
    if (window.location.hash === '#overview')
      $('.content-single').removeClass('detail-hidden')
    else {
        $('.content-single').addClass('detail-hidden')
    }

    window.setTimeout(function() {
      map.invalidateSize();
    }, 400);
  })
})();
