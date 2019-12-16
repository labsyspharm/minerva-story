const flatten = function(items) {
  return items.reduce(function(flat, item) {
    return flat.concat(item);
  });
};

const arrange_images = function(viewer, tileSources, hashstate, init) {

  const cgs = hashstate.cgs;
  const masks = hashstate.masks;

  cgs.forEach(g => {
    g['Format'] = g['Format'] || 'jpg';
  });
  masks.forEach(m => {
    m['Format'] = m['Format'] || 'png';
  });
  const layers = cgs.concat(masks);

  const grid = hashstate.grid;

  const images = hashstate.images;

  if (images.length == 1) {
    const imageName = document.getElementById('imageName');
    imageName.innerText = images[0].Description;
  }

  const numRows = grid.length;
  const numColumns = grid[0].length;

  const nTotal = numRows * numColumns * layers.length;
  var nLoaded = 0;

  const spacingFraction = 0.05;
  const maxImageWidth = flatten(grid).reduce(function(max, img) {
    return Math.max(max, img.Width);
  }, 0);
  const maxImageHeight = flatten(grid).reduce(function(max, img) {
    return Math.max(max, img.Height);
  }, 0);

  const cellHeight = (1 + spacingFraction) / numRows - spacingFraction;
  const cellWidth = cellHeight * maxImageWidth / maxImageHeight;

  for (var yi = 0; yi < numRows; yi++) {
    const y = yi * (cellHeight + spacingFraction);

    for (var xi = 0; xi < numColumns; xi++) {
      const image = grid[yi][xi];
      const displayHeight = (1 - (numRows-1) * spacingFraction) / numRows * image.Height / maxImageHeight;
      const displayWidth = displayHeight * image.Width / image.Height;
      const x = xi * (cellWidth + spacingFraction) + (cellWidth - displayWidth) / 2;

      for (var j=0; j < layers.length; j++) {
        const layer = layers[j];
        const channelSettings = hashstate.channelSettings(layer.Channels);
        getAjaxHeaders(hashstate, image).then(function(ajaxHeaders){
          const useAjax = (image.Provider == 'minerva');
          viewer.addTiledImage({
            loadTilesWithAjax: useAjax,
            crossOriginPolicy: useAjax? 'Anonymous': undefined,
            ajaxHeaders: ajaxHeaders,
            tileSource: {
              height: image.Height,
              width:  image.Width,
              maxLevel: image.MaxLevel,
              tileWidth: image.TileSize.slice(0,1).pop(),
              tileHeight: image.TileSize.slice(0,2).pop(),
              getTileUrl: getGetTileUrl(image, layer, channelSettings)
            },
            x: x,
            y: y,
            opacity: 0,
            width: displayWidth,
            //preload: true,
            success: function(data) {
              const item = data.item;
              if (!tileSources.hasOwnProperty(layer.Path)) {
                tileSources[layer.Path] = [];
              }
              tileSources[layer.Path].push(item);

              if (hashstate.design.is3d) {
                const item_idx = viewer.world.getIndexOfItem(item);
                item.addHandler('fully-loaded-change', function(e){
                  const next_item = viewer.world.getItemAt(item_idx + 1);
                  const last_item = viewer.world.getItemAt(item_idx - 1);
                  if (next_item) {
                    next_item.setPreload(e.fullyLoaded);
                  }
                  if (last_item) {
                    last_item.setPreload(e.fullyLoaded);
                  }
                })
              }
              // Initialize hash state
              nLoaded += 1;
              if (nLoaded == nTotal) {
                init();
              }
            }
          });
        });
      }

      const titleElt = $('<p>');
      const title = image.Description;
      titleElt.addClass('overlay-title').text(title);
      viewer.addOverlay({
        element: titleElt[0],
        x: x + displayWidth / 2,
        y: y,
        placement: 'BOTTOM',
        checkResize: false
      });
      viewer.addOverlay({
        x: x,
        y: y,
        width: displayWidth,
        height: image.Height / image.Width * displayWidth,
        className: 'slide-border'
      });
    }
  }
};


const build_page = function(exhibit, options) {

  // Initialize openseadragon
  const viewer = OpenSeadragon({
    id: 'openseadragon1',
    prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/2.3.1/images/',
    navigatorPosition: 'BOTTOM_RIGHT',
    zoomOutButton: 'zoom-out',
    zoomInButton: 'zoom-in',
    immediateRender: true,
    maxZoomPixelRatio: 10,
    visibilityRatio: .9
  });
  viewer.world.addHandler('add-item', function(addItemEvent) {
      const tiledImage = addItemEvent.item;
      tiledImage.addHandler('fully-loaded-change', function(fullyLoadedChangeEvent) {
          const fullyLoaded = fullyLoadedChangeEvent.fullyLoaded;
          if (fullyLoaded) {
            tiledImage.immediateRender = false;
          }
      });
      tiledImage.addHandler('opacity-change', function(opacityChangeEvent) {
          const opacity = opacityChangeEvent.opacity;
          if (opacity == 0) {
            tiledImage.immediateRender = true;
          }
      });
  });
  viewer.scalebar({
    location: 3,
    minWidth: '100px',
    type: 'Microscopy',
    stayInsideImage: false,
    pixelsPerMeter: 1000000*exhibit.PixelsPerMicron || 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    fontColor: 'rgb(255, 255, 255)',
    color: 'rgb(255, 255, 255)'
  })

  const hashstate = new HashState(exhibit, options);
  const tileSources = {};
  const osd = new RenderOSD(hashstate, viewer, tileSources);
  const render = new Render(hashstate, osd);
  const init = render.init.bind(render);

  arrange_images(viewer, tileSources, hashstate, init);
}
