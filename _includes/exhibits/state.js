const CognitoUser = AmazonCognitoIdentity.CognitoUser;
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails;

/*
 * from /sorgerlab/minerva-client-js/master/index.js
 */

const authenticateUser = function(cognitoUser, authenticationDetails) {
  return new Promise(function(resolve, reject) {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => resolve(result),
      onFailure: err => reject(err),
      mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
      newPasswordRequired: (fields, required) => reject({fields, required})
    });
  });
};

const authenticate = function(username, pass) {

  return pass.then(function(password) {

    const minervaPoolId = 'us-east-1_d3Wusx6qp';
    const minervaClientId = 'cvuuuuogh6nmqm8491iiu1lh5';
    const minervaPool = new CognitoUserPool({
      UserPoolId : minervaPoolId,
      ClientId : minervaClientId
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: minervaPool
    });

    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password
    });

    return authenticateUser(cognitoUser, authenticationDetails)
      .then(response => response.getIdToken().getJwtToken());
  });
}

const omero_authenticate = function(username, pass) {

  return pass.then(function(password) {
    return fetch('https://omero.hms.harvard.edu/api/v0/token/',
            {mode: 'no-cors'}
          ).then(function(token){
        return fetch('https://omero.hms.harvard.edu/api/v0/login/', {
          method: 'POST',
          body: JSON.stringify({
            csrfmiddlewaretoken: token.data,
            username: username,
            password: password,
            server: 1
          })
        }).then(function(session){
          return 'csrftoken=' + token.data + ';sessionid=' + session.eventContext.sessionUuid + ';';
        })
    })
  });
}



const pos_modulo = function(i, n) {
  return ((i % n) + n) % n;
};

const dFromWaypoint = function(waypoint) {
  return encode(waypoint.Description);
};

const nFromWaypoint = function(waypoint) {
  return encode(waypoint.Name);
};

const mFromWaypoint = function(waypoint, masks) {
  const names = waypoint.ActiveMasks || [];
  const m = names.map(name => index_name(masks, name));
  if (m.length < 2) {
    return [-1].concat(m);
  }
  return m;
};

const aFromWaypoint = function(waypoint, masks) {
  const arrows = waypoint.Arrows || [{}]
  const arrow = arrows[0].Point;
  if (arrow) {
    return arrow
  }
  return [-100, -100];
};

const gFromWaypoint = function(waypoint, cgs) {
  const cg_name = waypoint.Group;
  return index_name(cgs, cg_name);
};

const vFromWaypoint = function(waypoint) {
  return [
    waypoint.Zoom,
    waypoint.Pan[0],
    waypoint.Pan[1],
  ];
};

const pFromWaypoint = function(waypoint) {
  const p = waypoint.Polygon;
  return p? p: toPolygonURL([]);
};

const oFromWaypoint = function(waypoint) {
  return [
    waypoint.Overlays[0].x,
    waypoint.Overlays[0].y,
    waypoint.Overlays[0].width,
    waypoint.Overlays[0].height,
  ];
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

const serialize = function(keys, state, delimit) {
  return keys.reduce(function(h, k) {
    var value = state[k] || 0;
    // Array separated by underscore
    if (value.constructor === Array) {
      value = value.join('_');
    }
    return h + delimit + k + '=' + value;
  }, '').slice(1);

};

const deserialize = function(entries) {
  const query = entries.reduce(function(o, entry) {
    if (entry) {
      const kv = entry.split('=');
      const val = kv.slice(1).join('=') || '1';
      const vals = val.split('_');
      const key = kv[0];
      // Handle arrays or scalars
      o[key] = vals.length > 1? vals: val;
    }
    return o;
  }, {});

  return query;
};

const HashState = function(exhibit, options) {

  this.trackers = [];
  this.pollycache = {};
  this.embedded = options.embedded || false;
  this.exhibit = exhibit;

  this.state = {
    buffer: {
      waypoint: undefined
    },
    drawType: "lasso",
    changed: false,
    design: {},
    m: [-1],
    w: [0],
    g: 0,
    s: 0,
    a: [-100, -100],
    v: [0.5, 0.5, 0.5],
    o: [-100, -100, 1, 1],
    p: [],
    name: '',
    description: '',
    edit: false,
    drawing: 0
  };

  this.newExhibit();

};

HashState.prototype = {

  /*
   * Editor buffers
   */ 

  get bufferWaypoint() {
    if (this.state.buffer.waypoint === undefined) {
      const viewport = this.viewport;
      return remove_undefined({
        Zoom: viewport.scale,
        Pan: [
          viewport.pan.x,
          viewport.pan.y
        ],
        Arrows: [{
          Point: this.a,
          Text: '',
          HideArrow: false
        }],
        ActiveMasks: undefined,
        Masks: undefined,
        Polygon: this.p,
        Group: this.group.Name,
        Groups: undefined,
        Description: '',
        Name: 'Untitled',
        Overlays: [this.overlay]
      });
    }
    return this.state.buffer.waypoint;
  },

  set bufferWaypoint(bw) {
    this.state.buffer.waypoint = bw; 
  },

  /*
   * URL History
   */
  location: function(key) {
    return decodeURIComponent(location[key]);
  },

  get search() {
    const search = this.location('search').slice(1);
    const entries = search.split('&');
    return deserialize(entries);
  },

  get hash() {
    const hash = this.location('hash').slice(1);
    const entries = hash.split('#');
    return deserialize(entries);
  },

  get url() {
    const root = this.location('pathname');
    const search = this.location('search');
    const hash = this.location('hash');
    return root + search + hash;
  },

  get searchKeys() {
    const search_keys = Object.keys(this.search);
    return ['edit'].filter(x => search_keys.includes(x))
  },

  get hashKeys() {
    const oldTag = this.waypoint.Mode == 'tag';
    if (oldTag || this.isSharedLink) {
      return ['d', 's', 'w', 'g', 'm', 'a', 'v', 'o', 'p'];
    }
    else {
      return ['s', 'w', 'g', 'm', 'a', 'v', 'o', 'p'];
    }
  },

  /*
   * Search Keys
   */
  set edit(_edit) {
    this.state.edit = !!_edit;
  },

  get edit() {
    return !!this.state.edit;
  },

  /*
   * Control keys
   */
  get omero_cookie() {
    const username = 'jth30'
    const pass = new Promise(function(resolve, reject) {

      const selector = '#password_modal';
      $(selector).modal('show');
      $(selector).find('form').submit(function(e){
        $(selector).find('form').off();
        $(this).closest('.modal').modal('hide');
        const formData = parseForm(e.target);
       
        // Get password from form
        const p = formData.p;
        resolve(p);
        return false;
      });
    });
    return omero_authenticate(username, pass);
  },


  get token() {
    const username = 'john_hoffer@hms.harvard.edu'
    const pass = new Promise(function(resolve, reject) {

      resolve('MEETING@lsp2');
      /* 
      const selector = '#password_modal';
      $(selector).modal('show');
      $(selector).find('form').submit(function(e){
        $(selector).find('form').off();
        $(this).closest('.modal').modal('hide');
        const formData = parseForm(e.target);
       
        // Get password from form
        const p = formData.p;
        resolve(p);
        return false;
      });
      */
    });
    return authenticate(username, pass);
  },

  get drawType() {
    return this.state.drawType;
  },
  set drawType(_l) {
    this.state.drawType = _l;
  },

  get drawing() {
    return this.state.drawing;
  },
  set drawing(_d) {
    const d = parseInt(_d, 10);
    this.state.drawing = pos_modulo(d, 3);
  },

  /*
   * Hash Keys
   */

  get v() {
    return this.state.v;
  },
  set v(_v) {
    this.state.v = _v.map(parseFloat);
  },

  get a() {
    return this.state.a;
  },
  set a(_a) {
    this.state.a = _a.map(parseFloat);
  },

  get m() {
    const m = this.state.m;
    const count = this.masks.length;
    if (count == 0) {
      return [-1]
    }
    return m;
  },
  set m(_m) {
    if (Array.isArray(_m)) {
      this.state.m = _m.map(i => parseInt(i, 10));
    }
    else {
      this.state.m = [-1];
    }
  },

  get g() {
    const g = this.state.g;
    const count = this.cgs.length;
    return g < count ? g : 0;
  },
  set g(_g) {
    const g = parseInt(_g, 10);
    const count = this.cgs.length;
    this.state.g = pos_modulo(g, count);
  },

  /*
   * Exhibit Hash Keys
   */

  get w() {
    const w = this.state.w[this.s] || 0;
    const count = this.waypoints.length;
    return w < count ? w : 0;
  },

  set w(_w) {
    const w = parseInt(_w, 10);
    const count = this.waypoints.length;
    this.state.w[this.s] = pos_modulo(w, count);

    // Set group, viewport from waypoint
    const waypoint = this.waypoint;

    // this.slower();
    this.m = mFromWaypoint(waypoint, this.masks);
    this.g = gFromWaypoint(waypoint, this.cgs);
    this.v = vFromWaypoint(waypoint);
    if (this.waypoint.Mode == 'tag') {
      this.o = oFromWaypoint(waypoint);
      this.a = aFromWaypoint(waypoint);
    }
    else {
      this.o = [-100, -100, 1, 1];
      this.a = [-100, -100];
    }
    this.p = pFromWaypoint(waypoint);
    this.d = dFromWaypoint(waypoint);
    this.n = nFromWaypoint(waypoint);
  },

  get s() {
    const s = this.state.s;
    const count = this.stories.length;
    return s < count ? s : 0;
  },
  set s(_s) {
    const s = parseInt(_s, 10);
    const count = this.stories.length;
    this.state.s = pos_modulo(s, count);

    // Update waypoint
    this.w = this.w;
  },

  /*
   * Tag Hash Keys
   */

  get o() {
    return this.state.o;
  },
  set o(_o) {
    this.state.o = _o.map(parseFloat);
  },

  get p() {
    return toPolygonURL(this.state.p);
  },
  set p(_p) {
    this.state.p = fromPolygonURL(_p);
  },

  get d() {
    return this.state.description;
  },
  set d(_d) {
    this.state.description = '' + _d;
  },

  get n() {
    return this.state.name;
  },
  set n(_n) {
    this.state.name = '' + _n;
  },

  /*
   * Configuration State
   */
  get changed() {
    return this.state.changed;
  },
  set changed(_c) {
    this.state.changed = !!_c;
  },

  get design() {
    return this.state.design;
  },
  set design(design) {

    const stories = design.stories;

    // Store waypoint indices for each story
    if (this.stories.length != stories.length) {
      this.state.w = stories.map(function(story, s) {
        return this.state.w[s] || 0;
      }, this);
    }

    // Update the design
    this.state.design = design;
  },

  get masks() {
    return this.design.masks || [];
  },
  set masks(_masks) {
    var design = this.design;
    design.masks = _masks;
    this.design = design;
    this.changed = true;
  },

  get cgs() {
    return this.design.cgs || [];
  },
  set cgs(_cgs) {
    var design = this.design;
    design.cgs = _cgs;
    this.design = design;
    this.changed = true;
  },

  get chans() {
    return this.design.chans || [];
  },
  set chans(_chans) {
    var design = this.design;
    design.chans = _chans;
    this.design = design;
    this.changed = true;
  },

  get stories() {
    return this.design.stories || [];
  },
  set stories(_stories) {
    var design = this.design;
    design.stories = _stories;
    this.design = design;
    this.changed = true;
  },

  get layout() {
    return this.design.layout || {
      Grid: []
    };
  },
  set layout(_layout) {
    var design = this.design;
    design.layout = _layout;
    this.design = design;
    this.changed = true;
  },

  get images() {
    return this.design.images || [];
  },
  set images(_images) {
    var design = this.design;
    design.images = _images;
    this.design = design;
    this.changed = true;
  },

  get grid() {
    return unpackGrid(this.layout, this.images, 'Grid');
  },

  get target() {
    return unpackGrid(this.layout, this.images, 'Target');
  },

  get currentCount() {
    const s = this.s;
    const w = this.w;
    return this.stories.reduce(function(count, story, idx) {
      if (s == idx) {
        return count + w;
      }
      else if (s > idx) {
        return count + story.Waypoints.length;
      }
      else {
        return count;
      }
    }, 1);
  },

  get totalCount() {
    return this.stories.reduce(function(count, story) {
      return count + story.Waypoints.length;
    }, 0);
  },

  /*
   * Derived State
   */

  get isSharedLink() {
    const yes_d = this.hash.hasOwnProperty('d');
    const no_s = !this.hash.hasOwnProperty('s');
    const no_shared_link = this.stories.filter(story => {
      return story.Mode == 'tag';
    }).length == 0;
    return yes_d && (no_s || no_shared_link);
  },

  get isMissingHash() {
    const no_s = !this.hash.hasOwnProperty('s');
    return !this.isSharedLink && no_s;
  },

  get story() {
    return this.stories[this.s];
  },
  set story(story) {
    const stories = this.stories;
    stories[this.s] = story;
    this.stories = stories;
  },

  get active_masks() {
    const masks = this.masks;
    return this.m.map(function(m) {
      return masks[m];
    }).filter(mask => mask != undefined);
  },

  get group() {
    return this.cgs[this.g];
  },

  get colors() {
    const g_colors = this.group.Colors;
    return g_colors.concat(this.active_masks.reduce((c, m) => {
      return c.concat(m.Colors || []);
    }, []));
  },

  get channels() {
    const g_chans = this.group.Channels;
    return g_chans.concat(this.active_masks.reduce((c, m) => {
      return c.concat(m.Channels || []);
    }, []));
  },

  get waypoints() {
    return this.story.Waypoints;
  },
  set waypoints(waypoints) {
    const story = this.story;
    story.Waypoints = waypoints;
    this.story = story;
  },

  get waypoint() {
    if (this.edit) {
      return this.bufferWaypoint;
    }
    var waypoint = this.waypoints[this.w];
    if (!waypoint.Overlays) {
      waypoint.Overlays = [{
        x: -100,
        y: -100,
        width: 1,
        height: 1
      }];
    }
    return waypoint;
  },
  set waypoint(waypoint) {
    if (this.edit) {
      this.bufferWaypoint = waypoint;
    }
    else {
      const waypoints = this.waypoints;
      waypoints[this.w] = waypoint;
      this.waypoints = waypoints;
    }
  },

  get viewport() {
    const v = this.v;
    return {
      scale: v[0],
      pan: new OpenSeadragon.Point(v[1], v[2])
    };
  },

  get overlay() {
    const o = this.o;
    return {
      x: o[0],
      y: o[1],
      width: o[2],
      height: o[3]
    };
  },

  /*
   * State manaagement
   */

  newExhibit: function() {
    const exhibit = this.exhibit;
    const cgs = exhibit.Groups || [];
    const masks = exhibit.Masks || [];
    var stories = exhibit.Stories || [];
    stories = stories.map(story => {
      story.Waypoints = story.Waypoints.map(waypoint => {
        if (waypoint.Overlay != undefined) {
          waypoint.Overlays = [waypoint.Overlay];
        }
        return waypoint;
      })
      return story;
    }) 

    this.design = {
      chans: exhibit.Channels || [],
      layout: exhibit.Layout || {},
      images: exhibit.Images || [],
      header: exhibit.Header || '',
      footer: exhibit.Footer || '',
      is3d: exhibit['3D'] || false,
      z_scale: exhibit['ZPerMicron'] || 0,
      default_group: exhibit.DefaultGroup || '',
      stories: stories,
      masks: masks,
      cgs: cgs
    };

    const outline_story = this.newTempStory('outline');
    this.stories = [outline_story].concat(this.stories);
    const explore_story = this.newTempStory('explore');
    this.stories = this.stories.concat([explore_story]);
  },
  newTempStory: function(mode) {
    const exhibit = this.exhibit;
    const group = this.group;
    const a = this.a;
    const o = this.o;
    const p = this.p;
    const v = this.v;

    const header = this.design.header;
    const d = mode == 'outline' ? encode(header) : this.d;

    const name = {
      'explore': 'Free Explore',
      'tag': 'Shared Link',
      'outline': ' '
    }[mode];

    const groups = {
    }[mode];

    const masks = {
      'explore': this.masks.filter(mask => mask.Name).map(mask => mask.Name),
    }[mode];

    const active_masks = {
      'tag': this.active_masks.filter(mask => mask.Name).map(mask => mask.Name),
    }[mode];

    return {
      Mode: mode,
      Description: '',
      Name: name || 'Story',
      Waypoints: [remove_undefined({
        Mode: mode,
        Zoom: v[0],
        Arrows: [{
          Point: a
        }],
        Polygon: p,
        Pan: v.slice(1),
        ActiveMasks: active_masks,
        Group: group.Name,
        Masks: masks,
        Groups: groups,
        Description: decode(d),
        Name: name || 'Waypoint',
        Overlays: [{
          x: o[0],
          y: o[1],
          width: o[2],
          height: o[3],
        }],
      })]
    }
  },
  pushState: function() {

    const url = this.makeUrl(this.hashKeys, this.searchKeys);

    if (this.url == url && !this.changed) {
      return;
    }

    if (this.embedded) {
      history.replaceState(this.design, document.title, url);
    }
    else {
      history.pushState(this.design, document.title, url);
    }

    this.changed = false;
  },
  popState: function(e) {
    if (e && e.state) {
      this.changed = false;
      this.design = e.state;
    }
    const hash = this.hash;
    const search = this.search;
    const searchKeys = this.searchKeys;

    // Take search parameters
    this.searchKeys.forEach(function(key) {
      this[key] = search[key];
    }, this);

    // Accept valid hash
    this.hashKeys.forEach(function(key) {
      if (hash.hasOwnProperty(key)) {
        this[key] = hash[key];
      }
    }, this);

    if (this.isSharedLink) {
      this.d = hash.d;
      const tag_story = this.newTempStory('tag'); 
      this.stories = this.stories.concat([tag_story]);
      this.s = this.stories.length - 1;
      this.pushState();
      window.onpopstate();
    }
    else if (this.isMissingHash) {
      this.s = 0; 
      const welcome = $('#welcome_modal');
      const channel_count = welcome.find('.channel_count')[0];
      channel_count.innerText = this.channels.length;
      welcome.modal('show');

      this.pushState();
      window.onpopstate();
    }
  },

  makeUrl: function(hashKeys, searchKeys) {
    const root = this.location('pathname');
    const hash = this.makeHash(hashKeys);
    const search = this.makeSearch(searchKeys);
    return  root + search + hash;
  },

  makeHash: function(hashKeys) {
    const hash = serialize(hashKeys, this, '#');
    return hash? '#' + hash : '';
  },

  makeSearch: function(searchKeys) {
    const search = serialize(searchKeys, this, '&');
    return search? '?' + search : '';
  },

  startEditing: function(_waypoint) {
    const bw = _waypoint || this.bufferWaypoint;
    this.bufferWaypoint = bw;

    this.v = vFromWaypoint(bw);
    this.o = oFromWaypoint(bw);
    this.p = pFromWaypoint(bw);
    this.d = dFromWaypoint(bw);
    this.n = nFromWaypoint(bw);
    this.a = aFromWaypoint(bw);
    this.m = mFromWaypoint(bw, this.masks);
    this.g = gFromWaypoint(bw, this.cgs);
  },

  finishEditing: function() {
    const bw = this.bufferWaypoint;
    bw.Group = this.group.Name;
    bw.Name = decode(this.n);
    bw.Description = decode(this.d);
    bw.Zoom = this.viewport.scale;
    bw.Overlays = [this.overlay];
    bw.ActiveMasks = this.active_masks.map(mask => mask.Name)
    bw.Arrows[0].Point = this.a;
    bw.Polygon = this.p;
    bw.Pan = [
      this.viewport.pan.x,
      this.viewport.pan.y
    ];
    this.bufferWaypoint = bw;
    this.pushState();
    window.onpopstate();
  },

  startDrawing: function() {
    this.drawing = 1;

    const waypoint = this.waypoint;
 
    if (this.drawType == "lasso") {
      this.p = toPolygonURL([]);
    }
    else if (this.drawType == "arrow") {
      this.a = [-100, -100];
    }
    else {
      this.o = [-100, -100, 1, 1];
    }
  },
  cancelDrawing: function() {
    this.drawing = 0;
  },

  finishDrawing: function() {

    if (this.edit) {
      this.drawing = 0;
      this.finishEditing();
      this.startEditing();
      this.pushState();
    }
    else {
      $('#edit_description_modal').modal('show');
    }
  },

  get allArrows() {
    return this.stories.reduce((all, story, s) => {
      return all.concat(story.Waypoints.reduce((idx, _, w) => {
        const w_arrows = this.stories[s].Waypoints[w].Arrows || [];
        const w_idx = w_arrows.map((_, a) => { 
          return ['waypoint-arrow', s, w, a];
        }).concat([['user-arrow', s, w, 0]]);
        return idx.concat(w_idx);
      }, []));
    }, []);
  },

  get allOverlays() {
    return this.stories.reduce((all, story, s) => {
      return all.concat(story.Waypoints.reduce((idx, _, w) => {
        const w_overlays = this.stories[s].Waypoints[w].Overlays || [];
        const w_idx = w_overlays.map((_, o) => { 
          return ['waypoint-overlay', s, w, o];
        }).concat([['user-overlay', s, w, 0]]);
        return idx.concat(w_idx);
      }, []));
    }, []);
  },

  channelSettings: function(channels) {
    const chans = this.chans;
    if (channels == undefined) {
      return {}
    }
    return channels.reduce(function(map, c){
      const i = index_name(chans, c);
      if (i >= 0) {
        map[c] = chans[i];
      }
      return map;
    }, {});
  },

  get bufferYaml() {
    const viewport = this.viewport;
    const waypoint = this.waypoint;
    waypoint.Overlays = [this.overlay]; 
    waypoint.Name = decode(this.n);
    waypoint.Description = decode(this.d);

    const THIS = this;
    waypoint.ActiveMasks = this.m.filter(function(i){
      return i >= 0;
    }).map(function(i) {
      return THIS.masks[i].Name;
    })
    waypoint.Group = this.cgs[this.g].Name;
    waypoint.Pan = [viewport.pan.x, viewport.pan.y];
    waypoint.Zoom = viewport.scale;

    const wid_yaml = jsyaml.safeDump([[[waypoint]]], {
      lineWidth: 40,
      noCompatMode: true,
    });
    return wid_yaml.replace('- - - ', '    - ');
  }
};


const getAjaxHeaders = function(state, image){
  if (image.Provider == 'minerva') {
    return state.token.then(function(token){
      return {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Accept': 'image/png'
      };
    });  
  }
  if (image.Provider == 'omero') {
    /*return state.omero_cookie.then(function(cookie){
      //document.cookie = cookie;
      return {};
    })*/
  }
  return Promise.resolve({});
};


const getGetTileUrl = function(image, layer, channelSettings) {

  const colors = layer.Colors;
  const channels = layer.Channels;

  const getJpegTile = function(level, x, y) {
    const fileExt = '.' + layer.Format;
    return image.Path + '/' + layer.Path + '/' + (image.MaxLevel - level) + '_' + x + '_' + y + fileExt;
  };

  if (image.Provider == 'minerva') {
    const channelList = channels.reduce(function(list, c, i) {
      const settings = channelSettings[c];
      if (settings == undefined) {
        return list;
      }
      const allowed = settings.Images;
      if (allowed.indexOf(image.Name) >= 0) {
        const index = settings.Index;
        const color = colors[i];
        const min = settings.Range[0];
        const max = settings.Range[1];
        const specs = [index, color, min, max];
        list.push(specs.join(','));
      }
      return list;
    }, []);

    let channelPath = channelList.join('/');
    let api = image.Path + '/render-tile/';
    if (image.Path.includes('/prerendered-tile/')) {
      channelPath = layer.Path;
      api = image.Path;
    }

    const getMinervaTile = function(level, x, y) {
      const lod = (image.MaxLevel - level) + '/';
      const pos = x + '/' + y + '/0/0/';
      const url = api + pos + lod + channelPath;
      return url; 
    };

    return getMinervaTile;
  }
  else if (image.Provider == 'omero') {
    const channelList = channels.reduce(function(list, c, i) {
      const settings = channelSettings[c];
      if (settings == undefined) {
        return list;
      }
      const allowed = settings.Images;
      if (allowed.indexOf(image.Name) >= 0) {
        const index = settings.Index;
        const color = colors[i];
        const min = Math.round(settings.Range[0] * 65535);
        const max = Math.round(settings.Range[1] * 65535);
        list.push(index + '|' + min + ':' + max + '$' + color);
      }
      return list;
    }, []);
    const channelPath = channelList.join(',');

    const getOmeroTile = function(level, x, y) {
      const api = image.Path + '?c=' + channelPath;
      const lod = (image.MaxLevel - level);
      const pos = lod + ',' + x + ',' + y + ',';
      const trash = '&m=c&z=1&t=1&format=jpeg&tile=';
      const url = api + trash + pos + image.TileSize.join(','); 
      return url; 
    };

    return getOmeroTile; 
  }
  else {
    return getJpegTile; 
  }
};

const index_name = function(list, name) {
  if (!Array.isArray(list)) {
    return -1;
  }
  const item = list.filter(function(i) {
    return (i.Name == name);
  })[0];
  return list.indexOf(item);
};

const index_regex = function(list, re) {
  if (!Array.isArray(list)) {
    return -1;
  }
  const item = list.filter(function(i) {
    return !!i.Name.match(re);
  })[0];
  return list.indexOf(item);
};
