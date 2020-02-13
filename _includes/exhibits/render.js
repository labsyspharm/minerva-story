const round1 = function(n) {
  return Math.round(n * 10) / 10;
};

const round4 = function(n) {
  const N = Math.pow(10, 4);
  return Math.round(n * N) / N;
};

const remove_undefined = function(o) {
  Object.keys(o).forEach(k => {
    o[k] == undefined && delete o[k]
  });
  return o;
};

const encode = function(txt) {
  return btoa(encodeURIComponent(txt));
};

const decode = function(txt) {
  try {
    return decodeURIComponent(atob(txt));
  }
  catch (e) {
    return '';
  }
};

const clearChildren = function(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

const parseForm = function(elem) {
  const formArray = $(elem).serializeArray();
  return formArray.reduce(function(d, i) {
    d[i.name] = i.value;
    return d;
  }, {});
};

const classOrNot = function(selector, condition, cls) {
  if (condition) {
    return $(selector).addClass(cls);
  }
  return $(selector).removeClass(cls);
};

const displayOrNot = function(selector, condition) {
  classOrNot(selector, !condition, 'd-none');
};

const activeOrNot = function(selector, condition) {
  classOrNot(selector, condition, 'active');
};

const greenOrWhite = function(selector, condition) {
  classOrNot(selector, condition, 'green');
  classOrNot(selector, !condition, 'white');
};

const toggleCursor = function(cursor, condition) {
  if (condition) {
    $('#openseadragon1 *').css('cursor', cursor);
  }
  else {
    $('#openseadragon1 *').css('cursor', 'default');
  }
};

var toPolygonURL = function(polygon){
    pointString='';
    polygon.forEach(function(d){
        pointString += d.x.toFixed(5) + "," + d.y.toFixed(5) + ",";
    })
    pointString = pointString.slice(0, -1); //removes "," at the end
    var result =  LZString.compressToEncodedURIComponent(pointString);
    return result;
}

var fromPolygonURL = function(polygonString){
    var decompressed = LZString.decompressFromEncodedURIComponent(polygonString);
    if (!decompressed){
      return [];
    }

    var xArray = [], yArray = [];

    //get all values out of the string
    decompressed.split(',').forEach(function(d,i){
        if (i % 2 == 0){ xArray.push(parseFloat(d)); }
        else{ yArray.push(parseFloat(d)); }
    });

    //recreate polygon data structure
    var newPolygon = [];
    if (xArray.length == yArray.length) {
      xArray.forEach(function(d, i){
          newPolygon.push({x: d, y: yArray[i]});
      });
    }
    return newPolygon;
}

const download = function(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const ctrlC = function(str) {
  Clipboard.copy(str);
};

const unpackGrid = function(layout, images, key) {
  const image_map = images.reduce(function(o, i) {

    i.TileSize = i.TileSize || [1024, 1024];
    i.maxLevel = i.maxLevel || 0;

    // Add to dictionary by Name
    o[i.Name] = i;

    return o;
  }, {});

  return layout[key].map(function(row) {
    return row.map(function(image_name) {
      return this.image_map[image_name];
    }, {image_map: image_map});
  }, {image_map: image_map});
};

const newCopyYamlButton = function(THIS) {
  const copy_pre = 'Copy to Clipboard';
  const copy_post = 'Copied';
  $(this).tooltip({
    title: copy_pre
  });

  $(this).on('relabel', function(event, message) {
    $(this).attr('data-original-title', message).tooltip('show');
  });

  $(this).click(function() {
    $(this).trigger('relabel', [copy_post]);
    ctrlC(THIS.hashstate.bufferYaml);
    setTimeout((function() {
      $(this).trigger('relabel', [copy_pre]);
    }).bind(this), 1000);
    return false;
  });
};

const newCopyButton = function() {
  const copy_pre = 'Copy to Clipboard';
  const copy_post = 'Copied';
  $(this).tooltip({
    title: copy_pre
  });

  $(this).on('relabel', function(event, message) {
    $(this).attr('data-original-title', message).tooltip('show');
  });

  $(this).on('click', function() {
    const form = $(this).closest('form');
    const formData = parseForm(form);
    $(this).trigger('relabel', [copy_post]);
    ctrlC(formData.copy_content);
    setTimeout(function() {
      $(this).trigger('relabel', [copy_pre]);
    }, 1000);
  return false;
  });
};

const Render = function(hashstate, osd) {

  this.trackers = hashstate.trackers;
  this.pollycache = hashstate.pollycache;
  this.showdown = new showdown.Converter();

  this.osd = osd;
  this.hashstate = hashstate;
};

Render.prototype = {

  init: function() {

    const HS = this.hashstate;

    // Read hash
    window.onpopstate = (function(e) {
      HS.popState(e);
      this.loadPolly(HS.waypoint.Description);
      this.newView(true);
    }).bind(this);

    window.onpopstate();
    if (this.edit) {
      HS.startEditing();
    }
    HS.pushState();
    window.onpopstate();

    // Edit name
    $('#exhibit-name').text(HS.exhibit.Name);

    $('.modal_copy_button').each(newCopyButton);

    $('#zoom-in').tooltip({
      title: 'Zoom in'
    });
    $('#zoom-out').tooltip({
      title: 'Zoom out'
    });
    $('#arrow-switch').tooltip({
      title: 'Share Arrow'
    });
    $('#lasso-switch').tooltip({
      title: 'Share Region'
    });
    $('#draw-switch').tooltip({
      title: 'Share Box'
    });
    $('#duplicate-view').tooltip({
      title: 'Clone linked view'
    });

    $('#copy_link_modal').on('hidden.bs.modal', HS.cancelDrawing.bind(HS));
    $('#edit_description_modal').on('hidden.bs.modal', HS.cancelDrawing.bind(HS));

    $('#toggle-sidebar').click(function(e) {
      e.preventDefault();
      $("#sidebar-menu").toggleClass("toggled");
    });

    $('#toggle-legend').click(function(e) {
      e.preventDefault();
      $("#legend").toggleClass("toggled");
    });

    $('#leftArrow').click(this, function(e) {
      const HS = e.data.hashstate;
      if (HS.w == 0) {
        HS.s = HS.s - 1;
        HS.w = HS.waypoints.length - 1;
      }
      else {
        HS.w = HS.w - 1;
      }
      HS.pushState();
      window.onpopstate();
    });

    $('#rightArrow').click(this, function(e) {
      const HS = e.data.hashstate;
      const last_w = HS.w == (HS.waypoints.length - 1);
      if (last_w) {
        HS.s = HS.s + 1;
        HS.w = 0;
      }
      else {
        HS.w = HS.w + 1;
      }
      HS.pushState();
      window.onpopstate();
    });

    $('#edit-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      if (!HS.edit) {
        HS.startEditing();
        HS.pushState();
        window.onpopstate();
      }
    });

    $('#view-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      if (HS.edit) {
        HS.finishEditing();
        HS.pushState();
        window.onpopstate();
      }
    });

    $('#toc-button').click(this, function(e) {
      const HS = e.data.hashstate;
      if (HS.waypoint.Mode != 'outline') {
        HS.s = 0; 
        HS.pushState();
        window.onpopstate();
      }
    });

    $('.clear-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      HS.bufferWaypoint = undefined;
      HS.startEditing();
      HS.pushState();
      window.onpopstate();
    });
    
    $('.arrow-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      const THIS = e.data;
      HS.drawType = "arrow";
      if (HS.drawing) {
        HS.cancelDrawing(HS);
      }
      else {
        HS.startDrawing(HS);
      }
      HS.pushState();
      THIS.newView(false);
    });

    $('.lasso-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      const THIS = e.data;
      HS.drawType = "lasso";
      if (HS.drawing) {
        HS.cancelDrawing(HS);
      }
      else {
        HS.startDrawing(HS);
      }
      HS.pushState();
      THIS.newView(false);
    });

    $('.draw-switch').click(this, function(e) {
      const HS = e.data.hashstate;
      const THIS = e.data;
      HS.drawType = "box";
      if (HS.drawing) {
        HS.cancelDrawing(HS);
      }
      else {
        HS.startDrawing(HS);
      }
      HS.pushState();
      THIS.newView(false);
    });

    z_legend = document.getElementById('depth-legend');
    z_slider = document.getElementById('z-slider');
    z_slider.max = HS.cgs.length - 1;
    z_slider.value = HS.g;
    z_slider.min = 0;

    if (HS.design.is3d && HS.design.z_scale) {
      z_legend.innerText = round1(HS.g / HS.design.z_scale) + ' μm';
    }

    const THIS = this;
    z_slider.addEventListener('input', function() {
      HS.g = z_slider.value;
      if (HS.design.z_scale) {
        z_legend.innerText = round1(HS.g / HS.design.z_scale) + ' μm';
      }
      THIS.newView(true)
    }, false);

    $('#edit_description_modal form').submit(this, function(e){
      const HS = e.data.hashstate;
      const formData = parseForm(e.target);
      $(this).closest('.modal').modal('hide');

      // Get description from form
      HS.d = encode(formData.d);
      $('#copy_link_modal').modal('show');

      const root = HS.location('host') + HS.location('pathname');
      const hash = HS.makeHash(['d', 'g', 'm', 'a', 'v', 'o', 'p']);
      const link = document.getElementById('copy_link');
      link.value = root + hash;

      return false;
    });
  },
  newView: function(redraw) {

    const HS = this.hashstate;
    this.osd.newView(redraw);
    // Redraw design
    if(redraw) {
      // Redraw HTML Menus
      this.addChannelLegends();

      if (HS.design.is3d) {
        $('#channel-label').hide()
      }
      else {
        this.addGroups();
      }
      this.addMasks();
      this.newStories();

      if (HS.edit) {
        this.fillWaypointEdit();
      }
      else {
        this.fillWaypointView();
      }
      // back and forward
      $('.step-back').click(this, function(e) {
        const HS = e.data.hashstate;
        HS.w -= 1;
        HS.pushState();
        window.onpopstate();
      });
      $('.step-next').click(this, function(e) {
        const HS = e.data.hashstate;
        HS.w += 1;
        HS.pushState();
        window.onpopstate();
      });

      // Waypoint-specific Copy Buttons
      const THIS = this;
      $('.edit_copy_button').each(function() {
        newCopyYamlButton.call(this, THIS);
      });
      $('#edit_toggle_arrow').click(this, function(e) {
        const HS = e.data.hashstate;
        const THIS = e.data;
        const arrow_0 = HS.waypoint.Arrows[0];
        const hide_arrow = arrow_0.HideArrow;
        arrow_0.HideArrow = hide_arrow ? false : true;
        THIS.newView(true);
      });
    }

    if (HS.edit) {
      const THIS = this;

      $("#mask-picker").off("changed.bs.select");
      $("#mask-picker").on("changed.bs.select", function(e, idx, isSelected, oldValues) {
        const newValue = $(this).find('option').eq(idx).text();
        HS.waypoint.Masks = HS.masks.map(mask => mask.Name).filter(function(name) {
          if (isSelected) {
            return oldValues.includes(name) || name == newValue;
          }
          return oldValues.includes(name) && name != newValue;
        });
        const active_names = HS.active_masks.map(mask => mask.Name).filter(function(name) {
          return HS.waypoint.Masks.includes(name)
        })
        HS.waypoint.ActiveMasks = active_names;
        HS.m = active_names.map(name => index_name(HS.masks, name));
        THIS.newView(true);
      });

      $("#group-picker").off("changed.bs.select");
      $("#group-picker").on("changed.bs.select", function(e, idx, isSelected, oldValues) {
        const newValue = $(this).find('option').eq(idx).text();
        HS.waypoint.Groups = HS.cgs.map(group => group.Name).filter(function(name) {
          if (isSelected) {
            return oldValues.includes(name) || name == newValue;
          }
          return oldValues.includes(name) && name != newValue;
        });
        const group_names = HS.waypoint.Groups;
        const current_name = HS.cgs[HS.g].Name;
        if (group_names.length > 0 && !group_names.includes(current_name)) {
          HS.g = index_name(HS.cgs, group_names[0]);
        }
        THIS.newView(true);
      });

    }

    // Based on control keys
    const edit = HS.edit;
    const drawing = HS.drawing;
    const drawType = HS.drawType;

    // Based on search keys
    activeOrNot('#view-switch', !edit);
    activeOrNot('#edit-switch', edit);

    displayOrNot('#home-button', !edit && HS.waypoint.Mode == 'outline');
    displayOrNot('#toc-button', !edit && HS.waypoint.Mode != 'outline');
    displayOrNot('#channel-groups-legend', !HS.design.is3d);
    displayOrNot('#z-slider-legend', HS.design.is3d);
    displayOrNot('#toggle-legend', !HS.design.is3d);
    displayOrNot('.only-3d', HS.design.is3d);
    displayOrNot('.editControls', edit);
    displayOrNot('#waypointControls', !edit);
    displayOrNot('#waypointName', !edit);

    toggleCursor('crosshair', drawing);

    greenOrWhite('.draw-switch *', drawing && (drawType == "box"));
    greenOrWhite('.lasso-switch *', drawing && (drawType == "lasso"));
    greenOrWhite('.arrow-switch *', drawing && (drawType == "arrow"));
  },

  loadPolly: function(txt) {
    const HS = this.hashstate;
    var polly_url = this.pollycache[HS.currentCount];
    if (polly_url) {
      document.getElementById('audioSource').src = polly_url;
      document.getElementById('audioPlayback').load();
    }
    else {
      speakText(txt).then(function(url) {
        HS.pollycache[HS.currentCount] = url;
        document.getElementById('audioSource').src = url;
        document.getElementById('audioPlayback').load();
      });
    }
  },

  /*
   * User intercation
   */
  drawLowerBounds: function(position) {
    const HS = this.hashstate;
    const wh = [0, 0];
    const new_xy = [
      position.x, position.y
    ];
    HS.o = new_xy.concat(wh);
    this.newView(false);
  },
  computeBounds: function(value, start, len) {
    const center = start + (len / 2);
    const end = start + len;
    // Below center
    if (value < center) {
      return {
        start: value,
        range: end - value,
      };
    }
    // Above center
    return {
      start: start,
      range: value - start,
    };
  },
  drawUpperBounds: function(position) {
    const HS = this.hashstate;
    const xy = HS.o.slice(0, 2);
    const wh = HS.o.slice(2);

    // Set actual bounds
    const x = this.computeBounds(position.x, xy[0], wh[0]);
    const y = this.computeBounds(position.y, xy[1], wh[1]);

    const o = [x.start, y.start, x.range, y.range];
    HS.o = o.map(round4);
    this.newView(false);
  },

  /*
   * Display manaagement
   */

  addMasks: function() {
    const HS = this.hashstate;
    $('#mask-layers').empty();
    if (HS.edit || HS.waypoint.Mode == 'explore') {
        $('#mask-layers').addClass('flex');
        $('#mask-layers').removeClass('flex-column');
    }
    else {
        $('#mask-layers').addClass('flex-column');
        $('#mask-layers').removeClass('flex');
    }
    const mask_names = HS.waypoint.Masks || [];
    const masks = HS.masks.filter(mask => {
      return mask_names.includes(mask.Name);
    });
    if (masks.length || HS.edit) {
      $('#mask-label').show()
    }
    else {
      $('#mask-label').hide()
    }

    masks.forEach(function(mask) {
      const m = index_name(HS.masks, mask.Name);
      this.addMask(mask, m);
    }, this);
  },

  addMask: function(mask, m) {
    const HS = this.hashstate;
    var aEl = document.createElement('a');
    aEl = Object.assign(aEl, {
      className: HS.m.includes(m) ? 'nav-link active' : 'nav-link',
      href: 'javascript:;',
      innerText: mask.Name,
      title: mask.Path,
      id: mask.Path,
    });
    var ariaSelected = HS.m.includes(m) ? true : false;
    aEl.setAttribute('aria-selected', ariaSelected);

    // Append everything
    document.getElementById('mask-layers').appendChild(aEl);
    
    // Update Mask Layer
    $(aEl).click(this, function(e) {
      const HS = e.data.hashstate;
      const group = HS.design.default_group;
      const g = index_name(HS.cgs, group);
      if ( g != -1 ) {
        HS.g = g;
      }
      if (HS.m.includes(m)){
        HS.m = HS.m.filter(i => i != m);
      }
      else {
        HS.m.push(m);
      }
      HS.pushState();
      window.onpopstate();
    });
  },

  addGroups: function() {
    const HS = this.hashstate;
    $('#channel-groups').empty();
    $('#channel-groups-legend').empty();
    const cgs_names = HS.waypoint.Groups || [];
    const cgs = HS.cgs.filter(group => {
      return cgs_names.includes(group.Name);
    });
    if (cgs.length || HS.edit) {
      $('#channel-label').show()
    }
    else {
      $('#channel-label').hide()
    }
    // Add some channel groups to waypoint
    cgs.forEach(function(group) {
      const g = index_name(HS.cgs, group.Name);
      this.addGroup(group, g, 'channel-groups', false);
    }, this);

    const cgs_multi = HS.cgs.filter(group => {
      return group.Channels.length > 1;
    });
    const cgs_single = HS.cgs.filter(group => {
      return group.Channels.length == 1;
    });
    const cg_legend = document.getElementById('channel-groups-legend');
    if (cgs_multi.length > 0) {
      h = document.createElement('h6');
      h.innerText = 'Channel Groups:'
      h.className = 'm-1'
      cg_legend.appendChild(h);
    }
    // Add all channel groups to legend
    cgs_multi.forEach(function(group) {
      const g = index_name(HS.cgs, group.Name);
      this.addGroup(group, g, 'channel-groups-legend', true);
    }, this);
    if (cgs_single.length > 0) {
      h = document.createElement('h6');
      h.innerText = 'Channels:'
      h.className = 'm-1'
      cg_legend.appendChild(h);
    }
    cgs_single.forEach(function(group) {
      const g = index_name(HS.cgs, group.Name);
      this.addGroup(group, g, 'channel-groups-legend', true);
    }, this);
  },
  addGroup: function(group, g, el_id, show_more) {
    const HS = this.hashstate;
    var aEl = document.createElement('a');
    var selected = HS.g === g ? true : false;
    aEl = Object.assign(aEl, {
      className: selected ? 'nav-link active' : 'nav-link',
      style: 'padding-right: 40px; position: relative;',
      href: 'javascript:;',
      innerText: group.Name,
      title: group.Path,
      id: group.Path + '_' + el_id,
    });
    aEl.setAttribute('data-toggle', 'pill');

    // Set story and waypoint for this marker
    var s_w = undefined;
    for (var s in HS.stories) {
      for (var w in HS.stories[s].Waypoints) {
        var waypoint = HS.stories[s].Waypoints[w];  
        if (waypoint.Group == group.Name) {
          // Select the first waypoint or the definitive
          if (s_w == undefined || waypoint.DefineGroup) {
            s_w = [s, w];
          }
        }
      }
    }
    
    var moreEl = document.createElement('a');
    if (selected && show_more && s_w) {
      const opacity = 'opacity: ' +  + ';';
      moreEl = Object.assign(moreEl, {
        className : 'text-white',
        style: 'position: absolute; right: 5px;',
        href: 'javascript:;',
        innerText: 'MORE',
      });
      aEl.appendChild(moreEl);

      // Update Waypoint
      $(moreEl).click(this, function(e) {
        HS.s = s_w[0];
        HS.w = s_w[1];
        HS.pushState();
        window.onpopstate();
      });
    }

    // Append everything
    document.getElementById(el_id).appendChild(aEl);
    
    // Update Channel Group
    $(aEl).click(this, function(e) {
      HS.g = g;
      HS.pushState();
      window.onpopstate();
    });

  },

  addChannelLegends: function() {
    const HS = this.hashstate;
    $('#channel-legend').empty();
    HS.channels.forEach(this.addChannelLegend, this);
  },

  // Add channel legend label
  addChannelLegend: function(channel, c) {
    const color = this.indexColor(c, '#FFF');

    var label = document.createElement('span');
    label.className = 'legend-label pl-3';
    label.innerText = channel;

    var badge = document.createElement('span');
    $(badge).css('background-color', color);
    badge.className = 'badge legend-color';
    badge.innerText = '\u00a0';

    // Append everything
    var ul = document.getElementById('channel-legend');
    var li = document.createElement('li');
    li.appendChild(badge);
    li.appendChild(label);
    ul.appendChild(li);
  },

  channelOrders: function(channels) {
    return channels.reduce(function(map, c, i){
      map[c] = i;
      return map;
    }, {});
  },

  indexColor: function(i, empty) {
    const HS = this.hashstate;
    const colors = HS.colors;
    if (i === undefined) {
      return empty;
    }
    return '#' + colors[i % colors.length];
  },

  newStories: function() {

    const HS = this.hashstate;
    const items = document.getElementById('story-container');
    // Remove existing stories
    clearChildren(items);

    if (HS.waypoint.Mode == 'outline') {
      var toc_label = document.createElement('p');
      toc_label.innerText = 'Table of Contents';
      items.appendChild(toc_label);
      // Add configured stories
      HS.stories.forEach(function(story, sid) {
        if (story.Mode == undefined) {
          this.addStory(story, sid, items);
        }
      }, this);
    }

    const footer = document.createElement('p')
    const md = HS.design.footer;
    footer.innerHTML = this.showdown.makeHtml(md);
    items.appendChild(footer);
  },

  addStory: function(story, sid, items) {

    var sid_item = document.createElement('div');
    var sid_list = document.createElement('ul');
    var sid_label = document.createElement('p');
    sid_label.innerText = story.Name;

    // Add configured waypoints
    story.Waypoints.forEach(function(waypoint, wid) {
      this.addWaypoint(waypoint, wid, sid, sid_list);
    }, this);

    sid_item.appendChild(sid_label);
    sid_item.appendChild(sid_list);
    items.appendChild(sid_item);
  },

  addWaypoint: function(waypoint, wid, sid, sid_list) {

    var wid_item = document.createElement('li');
    var wid_link = document.createElement('a');
    wid_link = Object.assign(wid_link, {
      className: '',
      href: 'javascript:;',
      innerText: waypoint.Name
    });

    // Update Waypoint
    $(wid_link).click(this, function(e) {
      const HS = e.data.hashstate;
      HS.s = sid;
      HS.w = wid;
      HS.pushState();
      window.onpopstate();
    });

    wid_item.appendChild(wid_link);
    sid_list.appendChild(wid_item);
  },

  fillWaypointView: function() {

    const HS = this.hashstate;
    const waypoint = HS.waypoint;
    const wid_waypoint = document.getElementById('viewer-waypoint');
    const waypointName = document.getElementById("waypointName");
    const waypointCount = document.getElementById("waypointCount");

    if (HS.currentCount != 1) {
      waypointCount.innerText = (HS.currentCount - 1) + '/' + (HS.totalCount - 1);
    }
    else {
      waypointCount.innerText = '';
    }

    waypointName.innerText = waypoint.Name;

    const scroll_dist = $('.waypoint-content').scrollTop();
    $(wid_waypoint).css('height', $(wid_waypoint).height());

    var md = waypoint.Description;

    cell_type_links_map.forEach(function(link, type){
      var re = RegExp(type+'s?', 'gi');
      md = md.replace(re, function(m) {
        return '['+m+']('+link+')';
      });
    });

    marker_links_map.forEach(function(link, marker){
      var re = RegExp('(^|[^0-9A-Za-z`])\('+marker+'\)([^0-9A-Za-z`]|$)', 'gi');
      md = md.replace(re, function(m, pre, m1, post) {
        return m.replace(m1, '`'+m1+'`', 'gi');
      });
    });

    marker_links_map.forEach(function(link, marker){
      var re = RegExp('`'+marker+'`', 'gi');
      md = md.replace(re, function(m) {
        return '['+m+']('+link+')';
      });
    });


    const allVis = ['VisMatrix', 'VisBarChart', 'VisScatterplot'];
    
    const waypointVis = new Set(allVis.filter(v => waypoint[v]));
    const renderedVis = new Set();

    const THIS = this;
    const finish_waypoint = function(visType) {
      renderedVis.add(visType);
      if ([...waypointVis].every(v => renderedVis.has(v))) {
        $('.waypoint-content').scrollTop(scroll_dist);
        $(wid_waypoint).css('height', '');
        THIS.colorMarkerText(wid_waypoint);
      }
    }

    const maskHandler = function(name) {
      const re = RegExp(name ,'gi');
      const m = index_regex(HS.masks, re);
      if (m >= 0) {
        HS.m = [m];
      }
      THIS.newView(true);
    }

    const chanAndMaskHandler = function(mask, chan) {
      const re_mask = RegExp(mask,'gi');
      const m = index_regex(HS.masks, re_mask);
      if (m >= 0) {
        HS.m = [m];
      }
      
      const c = index_name(HS.cgs, chan);
      if (c >= 0) {
        HS.g = c;
      }
      else {
        const re_chan = RegExp(chan,'gi');
        const r_c = index_regex(HS.cgs, re_chan);
        if (r_c >= 0) {
          HS.g = r_c;
        }
      }
      THIS.newView(true);
    }


    //VIS
    const renderVis = function(visType, el, id) {
      const renderer = {
        'VisMatrix': infovis.renderMatrix,
        'VisBarChart': infovis.renderBarChart,
        'VisScatterplot': infovis.renderScatterplot
      }[visType]
      const clickHandler = {
        'VisMatrix': chanAndMaskHandler,
        'VisBarChart': maskHandler,
        'VisScatterplot': undefined
      }[visType]
      const tmp = renderer(el, id, waypoint[visType], {
        'clickHandler': clickHandler
      });
      tmp.then(() => finish_waypoint(visType));
    }

    var cache = document.createElement('div');
    Array.from(waypointVis).forEach(function(visType) {
      var className = visType + '-' + HS.s + '-' + HS.w;
      var visElems = wid_waypoint.getElementsByClassName(className);
      if (visElems[0]) {
        cache.appendChild(visElems[0]);
      }
    })

    wid_waypoint.innerHTML = this.showdown.makeHtml(md);

    if (waypoint.Image) {
      var img = document.createElement("img");
      img.src = waypoint.Image;
      wid_waypoint.appendChild(img);
    }

    //some code to add text in between vis
    Array.from(waypointVis).forEach(function(visType) {
      const wid_code = Array.from(wid_waypoint.getElementsByTagName('code'));
      const el = wid_code.filter(code => code.innerText == visType)[0];
      const new_div = document.createElement('div');
      new_div.style.cssText = 'position:relative';
      new_div.className = visType + '-' + HS.s + '-' + HS.w;
      new_div.id = visType + '-' + HS.s + '-' + HS.w;

      const cache_divs = cache.getElementsByClassName(new_div.className);
      if (cache_divs[0] && el) {
        $(el).replaceWith(cache_divs[0]);
        finish_waypoint(visType)
      }
      else if (el) {
        $(el).replaceWith(new_div);
        renderVis(visType, wid_waypoint, new_div.id);
      }
      else {
        wid_waypoint.appendChild(new_div);
        renderVis(visType, wid_waypoint, new_div.id);
      }
    })

    finish_waypoint('');

  },
  colorMarkerText: function (wid_waypoint) {
    // Color code elements
    const HS = this.hashstate;
    const channelOrders = this.channelOrders(HS.channels);
    const wid_code = wid_waypoint.getElementsByTagName('code');
    for (var i = 0; i < wid_code.length; i ++) {
      var code = wid_code[i];
      var index = channelOrders[code.innerText];
      if (!index) {
        Object.keys(channelOrders).forEach(function (marker) {
          const c_text = code.innerText;
          const code_marker = marker_alias_map.get(c_text) || c_text;
          const key_marker = marker_alias_map.get(marker) || marker;
          const re = RegExp('^'+code_marker+'$','gi');
          if (key_marker != undefined && key_marker.match(re)) {
            index = channelOrders[marker];
          }
        });
      }
      var color = this.indexColor(index);
      var border = color? '2px solid ' + color: 'inherit';
      $(code).css('border-bottom', border);
    }
  },
  fillWaypointEdit: function() {
    const HS = this.hashstate;
    const wid_waypoint = document.getElementById('viewer-waypoint');
    $(wid_waypoint).empty();
    const form_proto = document.getElementsByClassName('save_edits_form')[0]
    const form = form_proto.cloneNode(true);
    wid_waypoint.appendChild(form);

    const arrow_0 = HS.waypoint.Arrows[0];
    if (arrow_0.HideArrow == true) {
       $('#edit_toggle_arrow').css('opacity', '0.5');
    }
    else {
       $('#edit_toggle_arrow').css('opacity', '1');
    }

    const wid_txt = $(wid_waypoint).find('.edit_text')[0];
    const wid_txt_name = $(wid_waypoint).find('.edit_name')[0];
    const wid_txt_arrow = $(wid_waypoint).find('.edit_arrow_text')[0];
    const wid_describe = decode(HS.d);
    const wid_name = decode(HS.n);

    $(wid_txt_arrow).on('input', this, function(e) {
      const HS = e.data.hashstate;
      const THIS = e.data;
      HS.waypoint.Arrows[0].Text = this.value;
      THIS.newView(false);
    });
    wid_txt_arrow.value = HS.waypoint.Arrows[0].Text || '';

    $(wid_txt_name).on('input', this, function(e) {
      const HS = e.data.hashstate;
      HS.n = encode(this.value);
      HS.waypoint.Name = this.value;
    });
    wid_txt_name.value = wid_name;

    $(wid_txt).on('input', this, function(e) {
      const HS = e.data.hashstate;
      HS.d = encode(this.value);
      HS.waypoint.Description = this.value;
    });
    wid_txt.value = wid_describe;
  }
};
