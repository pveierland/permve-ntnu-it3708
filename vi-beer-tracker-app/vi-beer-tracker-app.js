(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.beerTrackerApp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _viBeerTrackerWidget = require('../../vi-beer-tracker-widget/vi-beer-tracker-widget');

Object.keys(_viBeerTrackerWidget).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _viBeerTrackerWidget[key];
    }
  });
});

},{"../../vi-beer-tracker-widget/vi-beer-tracker-widget":3}],2:[function(require,module,exports){

/**
 * @license
 *
 * chroma.js - JavaScript library for color conversions
 * 
 * Copyright (c) 2011-2015, Gregor Aisch
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. The name Gregor Aisch may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

(function() {
  var Color, DEG2RAD, LAB_CONSTANTS, PI, PITHIRD, RAD2DEG, TWOPI, _guess_formats, _guess_formats_sorted, _input, _interpolators, abs, atan2, bezier, blend, blend_f, brewer, burn, chroma, clip_rgb, cmyk2rgb, colors, cos, css2rgb, darken, dodge, each, floor, hex2rgb, hsi2rgb, hsl2css, hsl2rgb, hsv2rgb, interpolate, interpolate_hsx, interpolate_lab, interpolate_num, interpolate_rgb, lab2lch, lab2rgb, lab_xyz, lch2lab, lch2rgb, lighten, limit, log, luminance_x, m, max, multiply, normal, num2rgb, overlay, pow, rgb2cmyk, rgb2css, rgb2hex, rgb2hsi, rgb2hsl, rgb2hsv, rgb2lab, rgb2lch, rgb2luminance, rgb2num, rgb2temperature, rgb2xyz, rgb_xyz, rnd, root, round, screen, sin, sqrt, temperature2rgb, type, unpack, w3cx11, xyz_lab, xyz_rgb,
    slice = [].slice;

  type = (function() {

    /*
    for browser-safe type checking+
    ported from jQuery's $.type
     */
    var classToType, len, name, o, ref;
    classToType = {};
    ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
    for (o = 0, len = ref.length; o < len; o++) {
      name = ref[o];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function(obj) {
      var strType;
      strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  })();

  limit = function(x, min, max) {
    if (min == null) {
      min = 0;
    }
    if (max == null) {
      max = 1;
    }
    if (x < min) {
      x = min;
    }
    if (x > max) {
      x = max;
    }
    return x;
  };

  unpack = function(args) {
    if (args.length >= 3) {
      return [].slice.call(args);
    } else {
      return args[0];
    }
  };

  clip_rgb = function(rgb) {
    var i;
    for (i in rgb) {
      if (i < 3) {
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 255) {
          rgb[i] = 255;
        }
      } else if (i === 3) {
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 1) {
          rgb[i] = 1;
        }
      }
    }
    return rgb;
  };

  PI = Math.PI, round = Math.round, cos = Math.cos, floor = Math.floor, pow = Math.pow, log = Math.log, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, max = Math.max, abs = Math.abs;

  TWOPI = PI * 2;

  PITHIRD = PI / 3;

  DEG2RAD = PI / 180;

  RAD2DEG = 180 / PI;

  chroma = function() {
    if (arguments[0] instanceof Color) {
      return arguments[0];
    }
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, arguments, function(){});
  };

  _interpolators = [];

  if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
    module.exports = chroma;
  }

  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return chroma;
    });
  } else {
    root = typeof exports !== "undefined" && exports !== null ? exports : this;
    root.chroma = chroma;
  }

  chroma.version = '1.1.1';


  /**
      chroma.js
  
      Copyright (c) 2011-2013, Gregor Aisch
      All rights reserved.
  
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
  
      * Redistributions of source code must retain the above copyright notice, this
        list of conditions and the following disclaimer.
  
      * Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation
        and/or other materials provided with the distribution.
  
      * The name Gregor Aisch may not be used to endorse or promote products
        derived from this software without specific prior written permission.
  
      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
      @source: https://github.com/gka/chroma.js
   */

  _input = {};

  _guess_formats = [];

  _guess_formats_sorted = false;

  Color = (function() {
    function Color() {
      var arg, args, chk, len, len1, me, mode, o, w;
      me = this;
      args = [];
      for (o = 0, len = arguments.length; o < len; o++) {
        arg = arguments[o];
        if (arg != null) {
          args.push(arg);
        }
      }
      mode = args[args.length - 1];
      if (_input[mode] != null) {
        me._rgb = clip_rgb(_input[mode](unpack(args.slice(0, -1))));
      } else {
        if (!_guess_formats_sorted) {
          _guess_formats = _guess_formats.sort(function(a, b) {
            return b.p - a.p;
          });
          _guess_formats_sorted = true;
        }
        for (w = 0, len1 = _guess_formats.length; w < len1; w++) {
          chk = _guess_formats[w];
          mode = chk.test.apply(chk, args);
          if (mode) {
            break;
          }
        }
        if (mode) {
          me._rgb = clip_rgb(_input[mode].apply(_input, args));
        }
      }
      if (me._rgb == null) {
        console.warn('unknown format: ' + args);
      }
      if (me._rgb == null) {
        me._rgb = [0, 0, 0];
      }
      if (me._rgb.length === 3) {
        me._rgb.push(1);
      }
    }

    Color.prototype.alpha = function(alpha) {
      if (arguments.length) {
        this._rgb[3] = alpha;
        return this;
      }
      return this._rgb[3];
    };

    Color.prototype.toString = function() {
      return this.name();
    };

    return Color;

  })();

  chroma._input = _input;


  /**
  	ColorBrewer colors for chroma.js
  
  	Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The 
  	Pennsylvania State University.
  
  	Licensed under the Apache License, Version 2.0 (the "License"); 
  	you may not use this file except in compliance with the License.
  	You may obtain a copy of the License at	
  	http://www.apache.org/licenses/LICENSE-2.0
  
  	Unless required by applicable law or agreed to in writing, software distributed
  	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
  	CONDITIONS OF ANY KIND, either express or implied. See the License for the
  	specific language governing permissions and limitations under the License.
  
      @preserve
   */

  chroma.brewer = brewer = {
    OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
    BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
    Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
    YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
    YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
    Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
    Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
    Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
    YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
    PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
    Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
    Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
    RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
    RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
    RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
    PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
    Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
    Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
    Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
    Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
    Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
    Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
    Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
  };


  /**
  	X11 color names
  
  	http://www.w3.org/TR/css3-color/#svg-color
   */

  w3cx11 = {
    indigo: "#4b0082",
    gold: "#ffd700",
    hotpink: "#ff69b4",
    firebrick: "#b22222",
    indianred: "#cd5c5c",
    yellow: "#ffff00",
    mistyrose: "#ffe4e1",
    darkolivegreen: "#556b2f",
    olive: "#808000",
    darkseagreen: "#8fbc8f",
    pink: "#ffc0cb",
    tomato: "#ff6347",
    lightcoral: "#f08080",
    orangered: "#ff4500",
    navajowhite: "#ffdead",
    lime: "#00ff00",
    palegreen: "#98fb98",
    darkslategrey: "#2f4f4f",
    greenyellow: "#adff2f",
    burlywood: "#deb887",
    seashell: "#fff5ee",
    mediumspringgreen: "#00fa9a",
    fuchsia: "#ff00ff",
    papayawhip: "#ffefd5",
    blanchedalmond: "#ffebcd",
    chartreuse: "#7fff00",
    dimgray: "#696969",
    black: "#000000",
    peachpuff: "#ffdab9",
    springgreen: "#00ff7f",
    aquamarine: "#7fffd4",
    white: "#ffffff",
    orange: "#ffa500",
    lightsalmon: "#ffa07a",
    darkslategray: "#2f4f4f",
    brown: "#a52a2a",
    ivory: "#fffff0",
    dodgerblue: "#1e90ff",
    peru: "#cd853f",
    lawngreen: "#7cfc00",
    chocolate: "#d2691e",
    crimson: "#dc143c",
    forestgreen: "#228b22",
    darkgrey: "#a9a9a9",
    lightseagreen: "#20b2aa",
    cyan: "#00ffff",
    mintcream: "#f5fffa",
    silver: "#c0c0c0",
    antiquewhite: "#faebd7",
    mediumorchid: "#ba55d3",
    skyblue: "#87ceeb",
    gray: "#808080",
    darkturquoise: "#00ced1",
    goldenrod: "#daa520",
    darkgreen: "#006400",
    floralwhite: "#fffaf0",
    darkviolet: "#9400d3",
    darkgray: "#a9a9a9",
    moccasin: "#ffe4b5",
    saddlebrown: "#8b4513",
    grey: "#808080",
    darkslateblue: "#483d8b",
    lightskyblue: "#87cefa",
    lightpink: "#ffb6c1",
    mediumvioletred: "#c71585",
    slategrey: "#708090",
    red: "#ff0000",
    deeppink: "#ff1493",
    limegreen: "#32cd32",
    darkmagenta: "#8b008b",
    palegoldenrod: "#eee8aa",
    plum: "#dda0dd",
    turquoise: "#40e0d0",
    lightgrey: "#d3d3d3",
    lightgoldenrodyellow: "#fafad2",
    darkgoldenrod: "#b8860b",
    lavender: "#e6e6fa",
    maroon: "#800000",
    yellowgreen: "#9acd32",
    sandybrown: "#f4a460",
    thistle: "#d8bfd8",
    violet: "#ee82ee",
    navy: "#000080",
    magenta: "#ff00ff",
    dimgrey: "#696969",
    tan: "#d2b48c",
    rosybrown: "#bc8f8f",
    olivedrab: "#6b8e23",
    blue: "#0000ff",
    lightblue: "#add8e6",
    ghostwhite: "#f8f8ff",
    honeydew: "#f0fff0",
    cornflowerblue: "#6495ed",
    slateblue: "#6a5acd",
    linen: "#faf0e6",
    darkblue: "#00008b",
    powderblue: "#b0e0e6",
    seagreen: "#2e8b57",
    darkkhaki: "#bdb76b",
    snow: "#fffafa",
    sienna: "#a0522d",
    mediumblue: "#0000cd",
    royalblue: "#4169e1",
    lightcyan: "#e0ffff",
    green: "#008000",
    mediumpurple: "#9370db",
    midnightblue: "#191970",
    cornsilk: "#fff8dc",
    paleturquoise: "#afeeee",
    bisque: "#ffe4c4",
    slategray: "#708090",
    darkcyan: "#008b8b",
    khaki: "#f0e68c",
    wheat: "#f5deb3",
    teal: "#008080",
    darkorchid: "#9932cc",
    deepskyblue: "#00bfff",
    salmon: "#fa8072",
    darkred: "#8b0000",
    steelblue: "#4682b4",
    palevioletred: "#db7093",
    lightslategray: "#778899",
    aliceblue: "#f0f8ff",
    lightslategrey: "#778899",
    lightgreen: "#90ee90",
    orchid: "#da70d6",
    gainsboro: "#dcdcdc",
    mediumseagreen: "#3cb371",
    lightgray: "#d3d3d3",
    mediumturquoise: "#48d1cc",
    lemonchiffon: "#fffacd",
    cadetblue: "#5f9ea0",
    lightyellow: "#ffffe0",
    lavenderblush: "#fff0f5",
    coral: "#ff7f50",
    purple: "#800080",
    aqua: "#00ffff",
    whitesmoke: "#f5f5f5",
    mediumslateblue: "#7b68ee",
    darkorange: "#ff8c00",
    mediumaquamarine: "#66cdaa",
    darksalmon: "#e9967a",
    beige: "#f5f5dc",
    blueviolet: "#8a2be2",
    azure: "#f0ffff",
    lightsteelblue: "#b0c4de",
    oldlace: "#fdf5e6",
    rebeccapurple: "#663399"
  };

  chroma.colors = colors = w3cx11;

  lab2rgb = function() {
    var a, args, b, g, l, r, x, y, z;
    args = unpack(arguments);
    l = args[0], a = args[1], b = args[2];
    y = (l + 16) / 116;
    x = isNaN(a) ? y : y + a / 500;
    z = isNaN(b) ? y : y - b / 200;
    y = LAB_CONSTANTS.Yn * lab_xyz(y);
    x = LAB_CONSTANTS.Xn * lab_xyz(x);
    z = LAB_CONSTANTS.Zn * lab_xyz(z);
    r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
    g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
    b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
    r = limit(r, 0, 255);
    g = limit(g, 0, 255);
    b = limit(b, 0, 255);
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  xyz_rgb = function(r) {
    return round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow(r, 1 / 2.4) - 0.055));
  };

  lab_xyz = function(t) {
    if (t > LAB_CONSTANTS.t1) {
      return t * t * t;
    } else {
      return LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
    }
  };

  LAB_CONSTANTS = {
    Kn: 18,
    Xn: 0.950470,
    Yn: 1,
    Zn: 1.088830,
    t0: 0.137931034,
    t1: 0.206896552,
    t2: 0.12841855,
    t3: 0.008856452
  };

  rgb2lab = function() {
    var b, g, r, ref, ref1, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2xyz(r, g, b), x = ref1[0], y = ref1[1], z = ref1[2];
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };

  rgb_xyz = function(r) {
    if ((r /= 255) <= 0.04045) {
      return r / 12.92;
    } else {
      return pow((r + 0.055) / 1.055, 2.4);
    }
  };

  xyz_lab = function(t) {
    if (t > LAB_CONSTANTS.t3) {
      return pow(t, 1 / 3);
    } else {
      return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
    }
  };

  rgb2xyz = function() {
    var b, g, r, ref, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = rgb_xyz(r);
    g = rgb_xyz(g);
    b = rgb_xyz(b);
    x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn);
    y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / LAB_CONSTANTS.Yn);
    z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn);
    return [x, y, z];
  };

  chroma.lab = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['lab']), function(){});
  };

  _input.lab = lab2rgb;

  Color.prototype.lab = function() {
    return rgb2lab(this._rgb);
  };

  bezier = function(colors) {
    var I, I0, I1, c, lab0, lab1, lab2, lab3, ref, ref1, ref2;
    colors = (function() {
      var len, o, results;
      results = [];
      for (o = 0, len = colors.length; o < len; o++) {
        c = colors[o];
        results.push(chroma(c));
      }
      return results;
    })();
    if (colors.length === 2) {
      ref = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref[0], lab1 = ref[1];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push(lab0[i] + t * (lab1[i] - lab0[i]));
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 3) {
      ref1 = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref1[0], lab1 = ref1[1], lab2 = ref1[2];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]);
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 4) {
      ref2 = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref2[0], lab1 = ref2[1], lab2 = ref2[2], lab3 = ref2[3];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * (1 - t) * lab0[i] + 3 * (1 - t) * (1 - t) * t * lab1[i] + 3 * (1 - t) * t * t * lab2[i] + t * t * t * lab3[i]);
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 5) {
      I0 = bezier(colors.slice(0, 3));
      I1 = bezier(colors.slice(2, 5));
      I = function(t) {
        if (t < 0.5) {
          return I0(t * 2);
        } else {
          return I1((t - 0.5) * 2);
        }
      };
    }
    return I;
  };

  chroma.bezier = function(colors) {
    var f;
    f = bezier(colors);
    f.scale = function() {
      return chroma.scale(f);
    };
    return f;
  };


  /*
      chroma.js
  
      Copyright (c) 2011-2013, Gregor Aisch
      All rights reserved.
  
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
  
      * Redistributions of source code must retain the above copyright notice, this
        list of conditions and the following disclaimer.
  
      * Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation
        and/or other materials provided with the distribution.
  
      * The name Gregor Aisch may not be used to endorse or promote products
        derived from this software without specific prior written permission.
  
      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
      @source: https://github.com/gka/chroma.js
   */

  chroma.cubehelix = function(start, rotations, hue, gamma, lightness) {
    var dh, dl, f;
    if (start == null) {
      start = 300;
    }
    if (rotations == null) {
      rotations = -1.5;
    }
    if (hue == null) {
      hue = 1;
    }
    if (gamma == null) {
      gamma = 1;
    }
    if (lightness == null) {
      lightness = [0, 1];
    }
    dl = lightness[1] - lightness[0];
    dh = 0;
    f = function(fract) {
      var a, amp, b, cos_a, g, h, l, r, sin_a;
      a = TWOPI * ((start + 120) / 360 + rotations * fract);
      l = pow(lightness[0] + dl * fract, gamma);
      h = dh !== 0 ? hue[0] + fract * dh : hue;
      amp = h * l * (1 - l) / 2;
      cos_a = cos(a);
      sin_a = sin(a);
      r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
      g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
      b = l + amp * (+1.97294 * cos_a);
      return chroma(clip_rgb([r * 255, g * 255, b * 255]));
    };
    f.start = function(s) {
      if (s == null) {
        return start;
      }
      start = s;
      return f;
    };
    f.rotations = function(r) {
      if (r == null) {
        return rotations;
      }
      rotations = r;
      return f;
    };
    f.gamma = function(g) {
      if (g == null) {
        return gamma;
      }
      gamma = g;
      return f;
    };
    f.hue = function(h) {
      if (h == null) {
        return hue;
      }
      hue = h;
      if (type(hue) === 'array') {
        dh = hue[1] - hue[0];
        if (dh === 0) {
          hue = hue[1];
        }
      } else {
        dh = 0;
      }
      return f;
    };
    f.lightness = function(h) {
      if (h == null) {
        return lightness;
      }
      lightness = h;
      if (type(lightness) === 'array') {
        dl = lightness[1] - lightness[0];
        if (dl === 0) {
          lightness = lightness[1];
        }
      } else {
        dl = 0;
      }
      return f;
    };
    f.scale = function() {
      return chroma.scale(f);
    };
    f.hue(hue);
    return f;
  };

  chroma.random = function() {
    var code, digits, i, o;
    digits = '0123456789abcdef';
    code = '#';
    for (i = o = 0; o < 6; i = ++o) {
      code += digits.charAt(floor(Math.random() * 16));
    }
    return new Color(code);
  };

  _input.rgb = function() {
    var k, ref, results, v;
    ref = unpack(arguments);
    results = [];
    for (k in ref) {
      v = ref[k];
      results.push(v);
    }
    return results;
  };

  chroma.rgb = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['rgb']), function(){});
  };

  Color.prototype.rgb = function() {
    return this._rgb.slice(0, 3);
  };

  Color.prototype.rgba = function() {
    return this._rgb;
  };

  _guess_formats.push({
    p: 15,
    test: function(n) {
      var a;
      a = unpack(arguments);
      if (type(a) === 'array' && a.length === 3) {
        return 'rgb';
      }
      if (a.length === 4 && type(a[3]) === "number" && a[3] >= 0 && a[3] <= 1) {
        return 'rgb';
      }
    }
  });

  hex2rgb = function(hex) {
    var a, b, g, r, rgb, u;
    if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      if (hex.length === 4 || hex.length === 7) {
        hex = hex.substr(1);
      }
      if (hex.length === 3) {
        hex = hex.split("");
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      u = parseInt(hex, 16);
      r = u >> 16;
      g = u >> 8 & 0xFF;
      b = u & 0xFF;
      return [r, g, b, 1];
    }
    if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
      if (hex.length === 9) {
        hex = hex.substr(1);
      }
      u = parseInt(hex, 16);
      r = u >> 24 & 0xFF;
      g = u >> 16 & 0xFF;
      b = u >> 8 & 0xFF;
      a = round((u & 0xFF) / 0xFF * 100) / 100;
      return [r, g, b, a];
    }
    if ((_input.css != null) && (rgb = _input.css(hex))) {
      return rgb;
    }
    throw "unknown color: " + hex;
  };

  rgb2hex = function(channels, mode) {
    var a, b, g, hxa, r, str, u;
    if (mode == null) {
      mode = 'rgb';
    }
    r = channels[0], g = channels[1], b = channels[2], a = channels[3];
    u = r << 16 | g << 8 | b;
    str = "000000" + u.toString(16);
    str = str.substr(str.length - 6);
    hxa = '0' + round(a * 255).toString(16);
    hxa = hxa.substr(hxa.length - 2);
    return "#" + (function() {
      switch (mode.toLowerCase()) {
        case 'rgba':
          return str + hxa;
        case 'argb':
          return hxa + str;
        default:
          return str;
      }
    })();
  };

  _input.hex = function(h) {
    return hex2rgb(h);
  };

  chroma.hex = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hex']), function(){});
  };

  Color.prototype.hex = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2hex(this._rgb, mode);
  };

  _guess_formats.push({
    p: 10,
    test: function(n) {
      if (arguments.length === 1 && type(n) === "string") {
        return 'hex';
      }
    }
  });

  hsl2rgb = function() {
    var args, b, c, g, h, i, l, o, r, ref, s, t1, t2, t3;
    args = unpack(arguments);
    h = args[0], s = args[1], l = args[2];
    if (s === 0) {
      r = g = b = l * 255;
    } else {
      t3 = [0, 0, 0];
      c = [0, 0, 0];
      t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      t1 = 2 * l - t2;
      h /= 360;
      t3[0] = h + 1 / 3;
      t3[1] = h;
      t3[2] = h - 1 / 3;
      for (i = o = 0; o <= 2; i = ++o) {
        if (t3[i] < 0) {
          t3[i] += 1;
        }
        if (t3[i] > 1) {
          t3[i] -= 1;
        }
        if (6 * t3[i] < 1) {
          c[i] = t1 + (t2 - t1) * 6 * t3[i];
        } else if (2 * t3[i] < 1) {
          c[i] = t2;
        } else if (3 * t3[i] < 2) {
          c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6;
        } else {
          c[i] = t1;
        }
      }
      ref = [round(c[0] * 255), round(c[1] * 255), round(c[2] * 255)], r = ref[0], g = ref[1], b = ref[2];
    }
    if (args.length > 3) {
      return [r, g, b, args[3]];
    } else {
      return [r, g, b];
    }
  };

  rgb2hsl = function(r, g, b) {
    var h, l, min, ref, s;
    if (r !== void 0 && r.length >= 3) {
      ref = r, r = ref[0], g = ref[1], b = ref[2];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    l = (max + min) / 2;
    if (max === min) {
      s = 0;
      h = Number.NaN;
    } else {
      s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
    }
    if (r === max) {
      h = (g - b) / (max - min);
    } else if (g === max) {
      h = 2 + (b - r) / (max - min);
    } else if (b === max) {
      h = 4 + (r - g) / (max - min);
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
    return [h, s, l];
  };

  chroma.hsl = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsl']), function(){});
  };

  _input.hsl = hsl2rgb;

  Color.prototype.hsl = function() {
    return rgb2hsl(this._rgb);
  };

  hsv2rgb = function() {
    var args, b, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, s, t, v;
    args = unpack(arguments);
    h = args[0], s = args[1], v = args[2];
    v *= 255;
    if (s === 0) {
      r = g = b = v;
    } else {
      if (h === 360) {
        h = 0;
      }
      if (h > 360) {
        h -= 360;
      }
      if (h < 0) {
        h += 360;
      }
      h /= 60;
      i = floor(h);
      f = h - i;
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
      switch (i) {
        case 0:
          ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
          break;
        case 1:
          ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
          break;
        case 2:
          ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
          break;
        case 3:
          ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
          break;
        case 4:
          ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
          break;
        case 5:
          ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
      }
    }
    r = round(r);
    g = round(g);
    b = round(b);
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  rgb2hsv = function() {
    var b, delta, g, h, min, r, ref, s, v;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    delta = max - min;
    v = max / 255.0;
    if (max === 0) {
      h = Number.NaN;
      s = 0;
    } else {
      s = delta / max;
      if (r === max) {
        h = (g - b) / delta;
      }
      if (g === max) {
        h = 2 + (b - r) / delta;
      }
      if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
    }
    return [h, s, v];
  };

  chroma.hsv = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsv']), function(){});
  };

  _input.hsv = hsv2rgb;

  Color.prototype.hsv = function() {
    return rgb2hsv(this._rgb);
  };

  num2rgb = function(num) {
    var b, g, r;
    if (type(num) === "number" && num >= 0 && num <= 0xFFFFFF) {
      r = num >> 16;
      g = (num >> 8) & 0xFF;
      b = num & 0xFF;
      return [r, g, b, 1];
    }
    console.warn("unknown num color: " + num);
    return [0, 0, 0, 1];
  };

  rgb2num = function() {
    var b, g, r, ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    return (r << 16) + (g << 8) + b;
  };

  chroma.num = function(num) {
    return new Color(num, 'num');
  };

  Color.prototype.num = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2num(this._rgb, mode);
  };

  _input.num = num2rgb;

  _guess_formats.push({
    p: 10,
    test: function(n) {
      if (arguments.length === 1 && type(n) === "number" && n >= 0 && n <= 0xFFFFFF) {
        return 'num';
      }
    }
  });

  css2rgb = function(css) {
    var aa, ab, hsl, i, m, o, rgb, w;
    css = css.toLowerCase();
    if ((chroma.colors != null) && chroma.colors[css]) {
      return hex2rgb(chroma.colors[css]);
    }
    if (m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = o = 0; o <= 2; i = ++o) {
        rgb[i] = +rgb[i];
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = w = 0; w <= 3; i = ++w) {
        rgb[i] = +rgb[i];
      }
    } else if (m = css.match(/rgb\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = aa = 0; aa <= 2; i = ++aa) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = ab = 0; ab <= 2; i = ++ab) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = +rgb[3];
    } else if (m = css.match(/hsl\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = 1;
    } else if (m = css.match(/hsla\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = +m[4];
    }
    return rgb;
  };

  rgb2css = function(rgba) {
    var mode;
    mode = rgba[3] < 1 ? 'rgba' : 'rgb';
    if (mode === 'rgb') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ')';
    } else if (mode === 'rgba') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ',' + rgba[3] + ')';
    } else {

    }
  };

  rnd = function(a) {
    return round(a * 100) / 100;
  };

  hsl2css = function(hsl, alpha) {
    var mode;
    mode = alpha < 1 ? 'hsla' : 'hsl';
    hsl[0] = rnd(hsl[0] || 0);
    hsl[1] = rnd(hsl[1] * 100) + '%';
    hsl[2] = rnd(hsl[2] * 100) + '%';
    if (mode === 'hsla') {
      hsl[3] = alpha;
    }
    return mode + '(' + hsl.join(',') + ')';
  };

  _input.css = function(h) {
    return css2rgb(h);
  };

  chroma.css = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['css']), function(){});
  };

  Color.prototype.css = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    if (mode.slice(0, 3) === 'rgb') {
      return rgb2css(this._rgb);
    } else if (mode.slice(0, 3) === 'hsl') {
      return hsl2css(this.hsl(), this.alpha());
    }
  };

  _input.named = function(name) {
    return hex2rgb(w3cx11[name]);
  };

  _guess_formats.push({
    p: 20,
    test: function(n) {
      if (arguments.length === 1 && (w3cx11[n] != null)) {
        return 'named';
      }
    }
  });

  Color.prototype.name = function(n) {
    var h, k;
    if (arguments.length) {
      if (w3cx11[n]) {
        this._rgb = hex2rgb(w3cx11[n]);
      }
      this._rgb[3] = 1;
      this;
    }
    h = this.hex();
    for (k in w3cx11) {
      if (h === w3cx11[k]) {
        return k;
      }
    }
    return h;
  };

  lch2lab = function() {

    /*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.
    
    A saturation multiplier was added by Gregor Aisch
     */
    var c, h, l, ref;
    ref = unpack(arguments), l = ref[0], c = ref[1], h = ref[2];
    h = h * DEG2RAD;
    return [l, cos(h) * c, sin(h) * c];
  };

  lch2rgb = function() {
    var L, a, args, b, c, g, h, l, r, ref, ref1;
    args = unpack(arguments);
    l = args[0], c = args[1], h = args[2];
    ref = lch2lab(l, c, h), L = ref[0], a = ref[1], b = ref[2];
    ref1 = lab2rgb(L, a, b), r = ref1[0], g = ref1[1], b = ref1[2];
    return [limit(r, 0, 255), limit(g, 0, 255), limit(b, 0, 255), args.length > 3 ? args[3] : 1];
  };

  lab2lch = function() {
    var a, b, c, h, l, ref;
    ref = unpack(arguments), l = ref[0], a = ref[1], b = ref[2];
    c = sqrt(a * a + b * b);
    h = (atan2(b, a) * RAD2DEG + 360) % 360;
    if (round(c * 10000) === 0) {
      h = Number.NaN;
    }
    return [l, c, h];
  };

  rgb2lch = function() {
    var a, b, g, l, r, ref, ref1;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2lab(r, g, b), l = ref1[0], a = ref1[1], b = ref1[2];
    return lab2lch(l, a, b);
  };

  chroma.lch = function() {
    var args;
    args = unpack(arguments);
    return new Color(args, 'lch');
  };

  chroma.hcl = function() {
    var args;
    args = unpack(arguments);
    return new Color(args, 'hcl');
  };

  _input.lch = lch2rgb;

  _input.hcl = function() {
    var c, h, l, ref;
    ref = unpack(arguments), h = ref[0], c = ref[1], l = ref[2];
    return lch2rgb([l, c, h]);
  };

  Color.prototype.lch = function() {
    return rgb2lch(this._rgb);
  };

  Color.prototype.hcl = function() {
    return rgb2lch(this._rgb).reverse();
  };

  rgb2cmyk = function(mode) {
    var b, c, f, g, k, m, r, ref, y;
    if (mode == null) {
      mode = 'rgb';
    }
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = r / 255;
    g = g / 255;
    b = b / 255;
    k = 1 - Math.max(r, Math.max(g, b));
    f = k < 1 ? 1 / (1 - k) : 0;
    c = (1 - r - k) * f;
    m = (1 - g - k) * f;
    y = (1 - b - k) * f;
    return [c, m, y, k];
  };

  cmyk2rgb = function() {
    var alpha, args, b, c, g, k, m, r, y;
    args = unpack(arguments);
    c = args[0], m = args[1], y = args[2], k = args[3];
    alpha = args.length > 4 ? args[4] : 1;
    if (k === 1) {
      return [0, 0, 0, alpha];
    }
    r = c >= 1 ? 0 : round(255 * (1 - c) * (1 - k));
    g = m >= 1 ? 0 : round(255 * (1 - m) * (1 - k));
    b = y >= 1 ? 0 : round(255 * (1 - y) * (1 - k));
    return [r, g, b, alpha];
  };

  _input.cmyk = function() {
    return cmyk2rgb(unpack(arguments));
  };

  chroma.cmyk = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['cmyk']), function(){});
  };

  Color.prototype.cmyk = function() {
    return rgb2cmyk(this._rgb);
  };

  _input.gl = function() {
    var i, k, o, rgb, v;
    rgb = (function() {
      var ref, results;
      ref = unpack(arguments);
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(v);
      }
      return results;
    }).apply(this, arguments);
    for (i = o = 0; o <= 2; i = ++o) {
      rgb[i] *= 255;
    }
    return rgb;
  };

  chroma.gl = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['gl']), function(){});
  };

  Color.prototype.gl = function() {
    var rgb;
    rgb = this._rgb;
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]];
  };

  rgb2luminance = function(r, g, b) {
    var ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = luminance_x(r);
    g = luminance_x(g);
    b = luminance_x(b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  luminance_x = function(x) {
    x /= 255;
    if (x <= 0.03928) {
      return x / 12.92;
    } else {
      return pow((x + 0.055) / 1.055, 2.4);
    }
  };

  _interpolators = [];

  interpolate = function(col1, col2, f, m) {
    var interpol, len, o, res;
    if (f == null) {
      f = 0.5;
    }
    if (m == null) {
      m = 'rgb';
    }

    /*
    interpolates between colors
    f = 0 --> me
    f = 1 --> col
     */
    if (type(col1) !== 'object') {
      col1 = chroma(col1);
    }
    if (type(col2) !== 'object') {
      col2 = chroma(col2);
    }
    for (o = 0, len = _interpolators.length; o < len; o++) {
      interpol = _interpolators[o];
      if (m === interpol[0]) {
        res = interpol[1](col1, col2, f, m);
        break;
      }
    }
    if (res == null) {
      throw "color mode " + m + " is not supported";
    }
    res.alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
    return res;
  };

  chroma.interpolate = interpolate;

  Color.prototype.interpolate = function(col2, f, m) {
    return interpolate(this, col2, f, m);
  };

  chroma.mix = interpolate;

  Color.prototype.mix = Color.prototype.interpolate;

  interpolate_rgb = function(col1, col2, f, m) {
    var xyz0, xyz1;
    xyz0 = col1._rgb;
    xyz1 = col2._rgb;
    return new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['rgb', interpolate_rgb]);

  Color.prototype.luminance = function(lum, mode) {
    var cur_lum, eps, max_iter, test;
    if (mode == null) {
      mode = 'rgb';
    }
    if (!arguments.length) {
      return rgb2luminance(this._rgb);
    }
    if (lum === 0) {
      this._rgb = [0, 0, 0, this._rgb[3]];
    } else if (lum === 1) {
      this._rgb = [255, 255, 255, this._rgb[3]];
    } else {
      eps = 1e-7;
      max_iter = 20;
      test = function(l, h) {
        var lm, m;
        m = l.interpolate(h, 0.5, mode);
        lm = m.luminance();
        if (Math.abs(lum - lm) < eps || !max_iter--) {
          return m;
        }
        if (lm > lum) {
          return test(l, m);
        }
        return test(m, h);
      };
      cur_lum = rgb2luminance(this._rgb);
      this._rgb = (cur_lum > lum ? test(chroma('black'), this) : test(this, chroma('white'))).rgba();
    }
    return this;
  };

  temperature2rgb = function(kelvin) {
    var b, g, r, temp;
    temp = kelvin / 100;
    if (temp < 66) {
      r = 255;
      g = -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log(g);
      b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log(b);
    } else {
      r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log(r);
      g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log(g);
      b = 255;
    }
    return clip_rgb([r, g, b]);
  };

  rgb2temperature = function() {
    var b, eps, g, maxTemp, minTemp, r, ref, rgb, temp;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    minTemp = 1000;
    maxTemp = 40000;
    eps = 0.4;
    while (maxTemp - minTemp > eps) {
      temp = (maxTemp + minTemp) * 0.5;
      rgb = temperature2rgb(temp);
      if ((rgb[2] / rgb[0]) >= (b / r)) {
        maxTemp = temp;
      } else {
        minTemp = temp;
      }
    }
    return round(temp);
  };

  chroma.temperature = chroma.kelvin = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['temperature']), function(){});
  };

  _input.temperature = _input.kelvin = _input.K = temperature2rgb;

  Color.prototype.temperature = function() {
    return rgb2temperature(this._rgb);
  };

  Color.prototype.kelvin = Color.prototype.temperature;

  chroma.contrast = function(a, b) {
    var l1, l2, ref, ref1;
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    l1 = a.luminance();
    l2 = b.luminance();
    if (l1 > l2) {
      return (l1 + 0.05) / (l2 + 0.05);
    } else {
      return (l2 + 0.05) / (l1 + 0.05);
    }
  };

  Color.prototype.get = function(modechan) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    src = me[mode]();
    if (channel) {
      i = mode.indexOf(channel);
      if (i > -1) {
        return src[i];
      } else {
        return console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      return src;
    }
  };

  Color.prototype.set = function(modechan, value) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    if (channel) {
      src = me[mode]();
      i = mode.indexOf(channel);
      if (i > -1) {
        if (type(value) === 'string') {
          switch (value.charAt(0)) {
            case '+':
              src[i] += +value;
              break;
            case '-':
              src[i] += +value;
              break;
            case '*':
              src[i] *= +(value.substr(1));
              break;
            case '/':
              src[i] /= +(value.substr(1));
              break;
            default:
              src[i] = +value;
          }
        } else {
          src[i] = value;
        }
      } else {
        console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      src = value;
    }
    me._rgb = chroma(src, mode).alpha(me.alpha())._rgb;
    return me;
  };

  Color.prototype.darken = function(amount) {
    var lab, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lab = me.lab();
    lab[0] -= LAB_CONSTANTS.Kn * amount;
    return chroma.lab(lab).alpha(me.alpha());
  };

  Color.prototype.brighten = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.darken(-amount);
  };

  Color.prototype.darker = Color.prototype.darken;

  Color.prototype.brighter = Color.prototype.brighten;

  Color.prototype.saturate = function(amount) {
    var lch, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lch = me.lch();
    lch[1] += amount * LAB_CONSTANTS.Kn;
    if (lch[1] < 0) {
      lch[1] = 0;
    }
    return chroma.lch(lch).alpha(me.alpha());
  };

  Color.prototype.desaturate = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.saturate(-amount);
  };

  Color.prototype.premultiply = function() {
    var a, rgb;
    rgb = this.rgb();
    a = this.alpha();
    return chroma(rgb[0] * a, rgb[1] * a, rgb[2] * a, a);
  };

  blend = function(bottom, top, mode) {
    if (!blend[mode]) {
      throw 'unknown blend mode ' + mode;
    }
    return blend[mode](bottom, top);
  };

  blend_f = function(f) {
    return function(bottom, top) {
      var c0, c1;
      c0 = chroma(top).rgb();
      c1 = chroma(bottom).rgb();
      return chroma(f(c0, c1), 'rgb');
    };
  };

  each = function(f) {
    return function(c0, c1) {
      var i, o, out;
      out = [];
      for (i = o = 0; o <= 3; i = ++o) {
        out[i] = f(c0[i], c1[i]);
      }
      return out;
    };
  };

  normal = function(a, b) {
    return a;
  };

  multiply = function(a, b) {
    return a * b / 255;
  };

  darken = function(a, b) {
    if (a > b) {
      return b;
    } else {
      return a;
    }
  };

  lighten = function(a, b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  };

  screen = function(a, b) {
    return 255 * (1 - (1 - a / 255) * (1 - b / 255));
  };

  overlay = function(a, b) {
    if (b < 128) {
      return 2 * a * b / 255;
    } else {
      return 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255));
    }
  };

  burn = function(a, b) {
    return 255 * (1 - (1 - b / 255) / (a / 255));
  };

  dodge = function(a, b) {
    if (a === 255) {
      return 255;
    }
    a = 255 * (b / 255) / (1 - a / 255);
    if (a > 255) {
      return 255;
    } else {
      return a;
    }
  };

  blend.normal = blend_f(each(normal));

  blend.multiply = blend_f(each(multiply));

  blend.screen = blend_f(each(screen));

  blend.overlay = blend_f(each(overlay));

  blend.darken = blend_f(each(darken));

  blend.lighten = blend_f(each(lighten));

  blend.dodge = blend_f(each(dodge));

  blend.burn = blend_f(each(burn));

  chroma.blend = blend;

  chroma.analyze = function(data) {
    var len, o, r, val;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    for (o = 0, len = data.length; o < len; o++) {
      val = data[o];
      if ((val != null) && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function(mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.scale = function(colors, positions) {
    var _classes, _colorCache, _colors, _correctLightness, _domain, _fixed, _max, _min, _mode, _nacol, _out, _padding, _pos, _spread, classifyValue, f, getClass, getColor, resetCache, setColors, tmap;
    _mode = 'rgb';
    _nacol = chroma('#ccc');
    _spread = 0;
    _fixed = false;
    _domain = [0, 1];
    _pos = [];
    _padding = [0, 0];
    _classes = false;
    _colors = [];
    _out = false;
    _min = 0;
    _max = 1;
    _correctLightness = false;
    _colorCache = {};
    setColors = function(colors) {
      var c, col, o, ref, ref1, ref2, w;
      if (colors == null) {
        colors = ['#fff', '#000'];
      }
      if ((colors != null) && type(colors) === 'string' && (((ref = chroma.brewer) != null ? ref[colors] : void 0) != null)) {
        colors = chroma.brewer[colors];
      }
      if (type(colors) === 'array') {
        colors = colors.slice(0);
        for (c = o = 0, ref1 = colors.length - 1; 0 <= ref1 ? o <= ref1 : o >= ref1; c = 0 <= ref1 ? ++o : --o) {
          col = colors[c];
          if (type(col) === "string") {
            colors[c] = chroma(col);
          }
        }
        _pos.length = 0;
        for (c = w = 0, ref2 = colors.length - 1; 0 <= ref2 ? w <= ref2 : w >= ref2; c = 0 <= ref2 ? ++w : --w) {
          _pos.push(c / (colors.length - 1));
        }
      }
      resetCache();
      return _colors = colors;
    };
    getClass = function(value) {
      var i, n;
      if (_classes != null) {
        n = _classes.length - 1;
        i = 0;
        while (i < n && value >= _classes[i]) {
          i++;
        }
        return i - 1;
      }
      return 0;
    };
    tmap = function(t) {
      return t;
    };
    classifyValue = function(value) {
      var i, maxc, minc, n, val;
      val = value;
      if (_classes.length > 2) {
        n = _classes.length - 1;
        i = getClass(value);
        minc = _classes[0] + (_classes[1] - _classes[0]) * (0 + _spread * 0.5);
        maxc = _classes[n - 1] + (_classes[n] - _classes[n - 1]) * (1 - _spread * 0.5);
        val = _min + ((_classes[i] + (_classes[i + 1] - _classes[i]) * 0.5 - minc) / (maxc - minc)) * (_max - _min);
      }
      return val;
    };
    getColor = function(val, bypassMap) {
      var c, col, i, k, o, p, ref, t;
      if (bypassMap == null) {
        bypassMap = false;
      }
      if (isNaN(val)) {
        return _nacol;
      }
      if (!bypassMap) {
        if (_classes && _classes.length > 2) {
          c = getClass(val);
          t = c / (_classes.length - 2);
          t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));
        } else if (_max !== _min) {
          t = (val - _min) / (_max - _min);
          t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));
          t = Math.min(1, Math.max(0, t));
        } else {
          t = 1;
        }
      } else {
        t = val;
      }
      if (!bypassMap) {
        t = tmap(t);
      }
      k = Math.floor(t * 10000);
      if (_colorCache[k]) {
        col = _colorCache[k];
      } else {
        if (type(_colors) === 'array') {
          for (i = o = 0, ref = _pos.length - 1; 0 <= ref ? o <= ref : o >= ref; i = 0 <= ref ? ++o : --o) {
            p = _pos[i];
            if (t <= p) {
              col = _colors[i];
              break;
            }
            if (t >= p && i === _pos.length - 1) {
              col = _colors[i];
              break;
            }
            if (t > p && t < _pos[i + 1]) {
              t = (t - p) / (_pos[i + 1] - p);
              col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode);
              break;
            }
          }
        } else if (type(_colors) === 'function') {
          col = _colors(t);
        }
        _colorCache[k] = col;
      }
      return col;
    };
    resetCache = function() {
      return _colorCache = {};
    };
    setColors(colors);
    f = function(v) {
      var c;
      c = chroma(getColor(v));
      if (_out && c[_out]) {
        return c[_out]();
      } else {
        return c;
      }
    };
    f.classes = function(classes) {
      var d;
      if (classes != null) {
        if (type(classes) === 'array') {
          _classes = classes;
          _domain = [classes[0], classes[classes.length - 1]];
        } else {
          d = chroma.analyze(_domain);
          if (classes === 0) {
            _classes = [d.min, d.max];
          } else {
            _classes = chroma.limits(d, 'e', classes);
          }
        }
        return f;
      }
      return _classes;
    };
    f.domain = function(domain) {
      var c, d, k, len, o, ref, w;
      if (!arguments.length) {
        return _domain;
      }
      _min = domain[0];
      _max = domain[domain.length - 1];
      _pos = [];
      k = _colors.length;
      if (domain.length === k && _min !== _max) {
        for (o = 0, len = domain.length; o < len; o++) {
          d = domain[o];
          _pos.push((d - _min) / (_max - _min));
        }
      } else {
        for (c = w = 0, ref = k - 1; 0 <= ref ? w <= ref : w >= ref; c = 0 <= ref ? ++w : --w) {
          _pos.push(c / (k - 1));
        }
      }
      _domain = [_min, _max];
      return f;
    };
    f.mode = function(_m) {
      if (!arguments.length) {
        return _mode;
      }
      _mode = _m;
      resetCache();
      return f;
    };
    f.range = function(colors, _pos) {
      setColors(colors, _pos);
      return f;
    };
    f.out = function(_o) {
      _out = _o;
      return f;
    };
    f.spread = function(val) {
      if (!arguments.length) {
        return _spread;
      }
      _spread = val;
      return f;
    };
    f.correctLightness = function(v) {
      if (v == null) {
        v = true;
      }
      _correctLightness = v;
      resetCache();
      if (_correctLightness) {
        tmap = function(t) {
          var L0, L1, L_actual, L_diff, L_ideal, max_iter, pol, t0, t1;
          L0 = getColor(0, true).lab()[0];
          L1 = getColor(1, true).lab()[0];
          pol = L0 > L1;
          L_actual = getColor(t, true).lab()[0];
          L_ideal = L0 + (L1 - L0) * t;
          L_diff = L_actual - L_ideal;
          t0 = 0;
          t1 = 1;
          max_iter = 20;
          while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
            (function() {
              if (pol) {
                L_diff *= -1;
              }
              if (L_diff < 0) {
                t0 = t;
                t += (t1 - t) * 0.5;
              } else {
                t1 = t;
                t += (t0 - t) * 0.5;
              }
              L_actual = getColor(t, true).lab()[0];
              return L_diff = L_actual - L_ideal;
            })();
          }
          return t;
        };
      } else {
        tmap = function(t) {
          return t;
        };
      }
      return f;
    };
    f.padding = function(p) {
      if (p != null) {
        if (type(p) === 'number') {
          p = [p, p];
        }
        _padding = p;
        return f;
      } else {
        return _padding;
      }
    };
    f.colors = function() {
      var dd, dm, i, numColors, o, out, ref, results, samples, w;
      numColors = 0;
      out = 'hex';
      if (arguments.length === 1) {
        if (type(arguments[0]) === 'string') {
          out = arguments[0];
        } else {
          numColors = arguments[0];
        }
      }
      if (arguments.length === 2) {
        numColors = arguments[0], out = arguments[1];
      }
      if (numColors) {
        dm = _domain[0];
        dd = _domain[1] - dm;
        return (function() {
          results = [];
          for (var o = 0; 0 <= numColors ? o < numColors : o > numColors; 0 <= numColors ? o++ : o--){ results.push(o); }
          return results;
        }).apply(this).map(function(i) {
          return f(dm + i / (numColors - 1) * dd)[out]();
        });
      }
      colors = [];
      samples = [];
      if (_classes && _classes.length > 2) {
        for (i = w = 1, ref = _classes.length; 1 <= ref ? w < ref : w > ref; i = 1 <= ref ? ++w : --w) {
          samples.push((_classes[i - 1] + _classes[i]) * 0.5);
        }
      } else {
        samples = _domain;
      }
      return samples.map(function(v) {
        return f(v)[out]();
      });
    };
    return f;
  };

  if (chroma.scales == null) {
    chroma.scales = {};
  }

  chroma.scales.cool = function() {
    return chroma.scale([chroma.hsl(180, 1, .9), chroma.hsl(250, .7, .4)]);
  };

  chroma.scales.hot = function() {
    return chroma.scale(['#000', '#f00', '#ff0', '#fff'], [0, .25, .75, 1]).mode('rgb');
  };

  chroma.analyze = function(data, key, filter) {
    var add, k, len, o, r, val, visit;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    if (filter == null) {
      filter = function() {
        return true;
      };
    }
    add = function(val) {
      if ((val != null) && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    };
    visit = function(val, k) {
      if (filter(val, k)) {
        if ((key != null) && type(key) === 'function') {
          return add(key(val));
        } else if ((key != null) && type(key) === 'string' || type(key) === 'number') {
          return add(val[key]);
        } else {
          return add(val);
        }
      }
    };
    if (type(data) === 'array') {
      for (o = 0, len = data.length; o < len; o++) {
        val = data[o];
        visit(val);
      }
    } else {
      for (k in data) {
        val = data[k];
        visit(val, k);
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function(mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.limits = function(data, mode, num) {
    var aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max_log, min, min_log, mindist, n, nb_iters, newCentroids, o, p, pb, pr, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repeat, sum, tmpKMeansBreaks, value, values, w;
    if (mode == null) {
      mode = 'equal';
    }
    if (num == null) {
      num = 7;
    }
    if (type(data) === 'array') {
      data = chroma.analyze(data);
    }
    min = data.min;
    max = data.max;
    sum = data.sum;
    values = data.values.sort(function(a, b) {
      return a - b;
    });
    limits = [];
    if (mode.substr(0, 1) === 'c') {
      limits.push(min);
      limits.push(max);
    }
    if (mode.substr(0, 1) === 'e') {
      limits.push(min);
      for (i = o = 1, ref = num - 1; 1 <= ref ? o <= ref : o >= ref; i = 1 <= ref ? ++o : --o) {
        limits.push(min + (i / num) * (max - min));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'l') {
      if (min <= 0) {
        throw 'Logarithmic scales are only possible for values > 0';
      }
      min_log = Math.LOG10E * log(min);
      max_log = Math.LOG10E * log(max);
      limits.push(min);
      for (i = w = 1, ref1 = num - 1; 1 <= ref1 ? w <= ref1 : w >= ref1; i = 1 <= ref1 ? ++w : --w) {
        limits.push(pow(10, min_log + (i / num) * (max_log - min_log)));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'q') {
      limits.push(min);
      for (i = aa = 1, ref2 = num - 1; 1 <= ref2 ? aa <= ref2 : aa >= ref2; i = 1 <= ref2 ? ++aa : --aa) {
        p = values.length * i / num;
        pb = floor(p);
        if (pb === p) {
          limits.push(values[pb]);
        } else {
          pr = p - pb;
          limits.push(values[pb] * pr + values[pb + 1] * (1 - pr));
        }
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'k') {

      /*
      implementation based on
      http://code.google.com/p/figue/source/browse/trunk/figue.js#336
      simplified for 1-d input values
       */
      n = values.length;
      assignments = new Array(n);
      clusterSizes = new Array(num);
      repeat = true;
      nb_iters = 0;
      centroids = null;
      centroids = [];
      centroids.push(min);
      for (i = ab = 1, ref3 = num - 1; 1 <= ref3 ? ab <= ref3 : ab >= ref3; i = 1 <= ref3 ? ++ab : --ab) {
        centroids.push(min + (i / num) * (max - min));
      }
      centroids.push(max);
      while (repeat) {
        for (j = ac = 0, ref4 = num - 1; 0 <= ref4 ? ac <= ref4 : ac >= ref4; j = 0 <= ref4 ? ++ac : --ac) {
          clusterSizes[j] = 0;
        }
        for (i = ad = 0, ref5 = n - 1; 0 <= ref5 ? ad <= ref5 : ad >= ref5; i = 0 <= ref5 ? ++ad : --ad) {
          value = values[i];
          mindist = Number.MAX_VALUE;
          for (j = ae = 0, ref6 = num - 1; 0 <= ref6 ? ae <= ref6 : ae >= ref6; j = 0 <= ref6 ? ++ae : --ae) {
            dist = abs(centroids[j] - value);
            if (dist < mindist) {
              mindist = dist;
              best = j;
            }
          }
          clusterSizes[best]++;
          assignments[i] = best;
        }
        newCentroids = new Array(num);
        for (j = af = 0, ref7 = num - 1; 0 <= ref7 ? af <= ref7 : af >= ref7; j = 0 <= ref7 ? ++af : --af) {
          newCentroids[j] = null;
        }
        for (i = ag = 0, ref8 = n - 1; 0 <= ref8 ? ag <= ref8 : ag >= ref8; i = 0 <= ref8 ? ++ag : --ag) {
          cluster = assignments[i];
          if (newCentroids[cluster] === null) {
            newCentroids[cluster] = values[i];
          } else {
            newCentroids[cluster] += values[i];
          }
        }
        for (j = ah = 0, ref9 = num - 1; 0 <= ref9 ? ah <= ref9 : ah >= ref9; j = 0 <= ref9 ? ++ah : --ah) {
          newCentroids[j] *= 1 / clusterSizes[j];
        }
        repeat = false;
        for (j = ai = 0, ref10 = num - 1; 0 <= ref10 ? ai <= ref10 : ai >= ref10; j = 0 <= ref10 ? ++ai : --ai) {
          if (newCentroids[j] !== centroids[i]) {
            repeat = true;
            break;
          }
        }
        centroids = newCentroids;
        nb_iters++;
        if (nb_iters > 200) {
          repeat = false;
        }
      }
      kClusters = {};
      for (j = aj = 0, ref11 = num - 1; 0 <= ref11 ? aj <= ref11 : aj >= ref11; j = 0 <= ref11 ? ++aj : --aj) {
        kClusters[j] = [];
      }
      for (i = ak = 0, ref12 = n - 1; 0 <= ref12 ? ak <= ref12 : ak >= ref12; i = 0 <= ref12 ? ++ak : --ak) {
        cluster = assignments[i];
        kClusters[cluster].push(values[i]);
      }
      tmpKMeansBreaks = [];
      for (j = al = 0, ref13 = num - 1; 0 <= ref13 ? al <= ref13 : al >= ref13; j = 0 <= ref13 ? ++al : --al) {
        tmpKMeansBreaks.push(kClusters[j][0]);
        tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
      }
      tmpKMeansBreaks = tmpKMeansBreaks.sort(function(a, b) {
        return a - b;
      });
      limits.push(tmpKMeansBreaks[0]);
      for (i = am = 1, ref14 = tmpKMeansBreaks.length - 1; am <= ref14; i = am += 2) {
        if (!isNaN(tmpKMeansBreaks[i])) {
          limits.push(tmpKMeansBreaks[i]);
        }
      }
    }
    return limits;
  };

  hsi2rgb = function(h, s, i) {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
     */
    var args, b, g, r;
    args = unpack(arguments);
    h = args[0], s = args[1], i = args[2];
    h /= 360;
    if (h < 1 / 3) {
      b = (1 - s) / 3;
      r = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      g = 1 - (b + r);
    } else if (h < 2 / 3) {
      h -= 1 / 3;
      r = (1 - s) / 3;
      g = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      b = 1 - (r + g);
    } else {
      h -= 2 / 3;
      g = (1 - s) / 3;
      b = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      r = 1 - (g + b);
    }
    r = limit(i * r * 3);
    g = limit(i * g * 3);
    b = limit(i * b * 3);
    return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1];
  };

  rgb2hsi = function() {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
     */
    var b, g, h, i, min, r, ref, s;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    TWOPI = Math.PI * 2;
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    i = (r + g + b) / 3;
    s = 1 - min / i;
    if (s === 0) {
      h = 0;
    } else {
      h = ((r - g) + (r - b)) / 2;
      h /= Math.sqrt((r - g) * (r - g) + (r - b) * (g - b));
      h = Math.acos(h);
      if (b > g) {
        h = TWOPI - h;
      }
      h /= TWOPI;
    }
    return [h * 360, s, i];
  };

  chroma.hsi = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsi']), function(){});
  };

  _input.hsi = hsi2rgb;

  Color.prototype.hsi = function() {
    return rgb2hsi(this._rgb);
  };

  interpolate_hsx = function(col1, col2, f, m) {
    var dh, hue, hue0, hue1, lbv, lbv0, lbv1, res, sat, sat0, sat1, xyz0, xyz1;
    if (m === 'hsl') {
      xyz0 = col1.hsl();
      xyz1 = col2.hsl();
    } else if (m === 'hsv') {
      xyz0 = col1.hsv();
      xyz1 = col2.hsv();
    } else if (m === 'hsi') {
      xyz0 = col1.hsi();
      xyz1 = col2.hsi();
    } else if (m === 'lch' || m === 'hcl') {
      m = 'hcl';
      xyz0 = col1.hcl();
      xyz1 = col2.hcl();
    }
    if (m.substr(0, 1) === 'h') {
      hue0 = xyz0[0], sat0 = xyz0[1], lbv0 = xyz0[2];
      hue1 = xyz1[0], sat1 = xyz1[1], lbv1 = xyz1[2];
    }
    if (!isNaN(hue0) && !isNaN(hue1)) {
      if (hue1 > hue0 && hue1 - hue0 > 180) {
        dh = hue1 - (hue0 + 360);
      } else if (hue1 < hue0 && hue0 - hue1 > 180) {
        dh = hue1 + 360 - hue0;
      } else {
        dh = hue1 - hue0;
      }
      hue = hue0 + f * dh;
    } else if (!isNaN(hue0)) {
      hue = hue0;
      if ((lbv1 === 1 || lbv1 === 0) && m !== 'hsv') {
        sat = sat0;
      }
    } else if (!isNaN(hue1)) {
      hue = hue1;
      if ((lbv0 === 1 || lbv0 === 0) && m !== 'hsv') {
        sat = sat1;
      }
    } else {
      hue = Number.NaN;
    }
    if (sat == null) {
      sat = sat0 + f * (sat1 - sat0);
    }
    lbv = lbv0 + f * (lbv1 - lbv0);
    return res = chroma[m](hue, sat, lbv);
  };

  _interpolators = _interpolators.concat((function() {
    var len, o, ref, results;
    ref = ['hsv', 'hsl', 'hsi', 'hcl', 'lch'];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      m = ref[o];
      results.push([m, interpolate_hsx]);
    }
    return results;
  })());

  interpolate_num = function(col1, col2, f, m) {
    var n1, n2;
    n1 = col1.num();
    n2 = col2.num();
    return chroma.num(n1 + (n2 - n1) * f, 'num');
  };

  _interpolators.push(['num', interpolate_num]);

  interpolate_lab = function(col1, col2, f, m) {
    var res, xyz0, xyz1;
    xyz0 = col1.lab();
    xyz1 = col2.lab();
    return res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['lab', interpolate_lab]);

}).call(this);

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Widget = exports.constants = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chromaJs = require('chroma-js');

var chroma = _interopRequireWildcard(_chromaJs);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var constants = exports.constants = Object.freeze(function () {
    var constants = {};
    constants.gameLoopDelayMs = 1000 / 60; //60;
    return constants;
}());

var Widget = exports.Widget = function () {
    function Widget(options) {
        _classCallCheck(this, Widget);

        this.events = options.events || [];
        this.grid = options.grid;
        this.kinds = options.kinds || {};
        this.objects = options.objects || [];
        this.tracker = options.tracker;

        this.canvas = options.canvas;
        this.context = options.canvas.getContext('2d');

        this.context.scale(this.canvas.width / this.grid.width, this.canvas.height / this.grid.height);
        this.context.lineWidth = 0.05;

        this.events = [];
        this.movementIndex = 0;

        window.requestAnimationFrame(this.update.bind(this));
    }

    _createClass(Widget, [{
        key: 'perform',
        value: function perform(events) {
            this.events.push.apply(this.events, events);
        }
    }, {
        key: 'roundRect',
        value: function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
            if (typeof stroke == 'undefined') {
                stroke = true;
            }
            if (typeof radius === 'undefined') {
                radius = 5;
            }
            if (typeof radius === 'number') {
                radius = { tl: radius, tr: radius, br: radius, bl: radius };
            } else {
                var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
                for (var side in defaultRadius) {
                    radius[side] = radius[side] || defaultRadius[side];
                }
            }

            ctx.beginPath();
            ctx.moveTo(x + radius.tl, y);
            ctx.lineTo(x + width - radius.tr, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
            ctx.lineTo(x + width, y + height - radius.br);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            ctx.lineTo(x + radius.bl, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
            ctx.lineTo(x, y + radius.tl);
            ctx.quadraticCurveTo(x, y, x + radius.tl, y);
            ctx.closePath();

            if (fill) {
                ctx.fill();
            }

            if (stroke) {
                ctx.stroke();
            }
        }
    }, {
        key: 'render',
        value: function render() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var boxSize = 0.8;
            var spacing = (1 - boxSize) / 2;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.objects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var object = _step.value;

                    var cloneX = object.x - this.grid.width;
                    var y = object.y + this.movementIndex / 5;
                    var kind = this.kinds[object.kind];

                    this.context.strokeStyle = kind.color;
                    this.context.fillStyle = kind.color;

                    this.roundRect(this.context, object.x + spacing, y + spacing, kind.size - 2 * spacing, boxSize, 0.1, true, false);

                    this.roundRect(this.context, cloneX + spacing, y + spacing, kind.size - 2 * spacing, boxSize, 0.1, true, false);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            if (this.tracker.captured) {
                this.context.strokeStyle = this.tracker.colors[4];
                this.context.fillStyle = this.tracker.colors[4];
            } else if (this.tracker.capture) {
                this.context.strokeStyle = this.tracker.colors[this.movementIndex];
                this.context.fillStyle = this.tracker.colors[this.movementIndex];
            } else if (this.tracker.fading) {
                this.context.strokeStyle = this.tracker.colors[5 - this.movementIndex];
                this.context.fillStyle = this.tracker.colors[5 - this.movementIndex];
            } else {
                this.context.strokeStyle = this.tracker.color;
                this.context.fillStyle = this.tracker.color;
            }

            var currentEvent = this.currentEvent;

            var trackerPosition = this.tracker.position;

            if (currentEvent && currentEvent.move) {
                trackerPosition += this.currentEvent.move * this.movementIndex / 5;
            }

            var trackerClonePosition = trackerPosition < 0 ? trackerPosition + this.grid.width : trackerPosition - this.grid.width;

            this.roundRect(this.context, trackerPosition + spacing, this.grid.height - 1 + spacing, this.tracker.size - 2 * spacing, boxSize, 0.1, true, false);

            this.roundRect(this.context, trackerClonePosition + spacing, this.grid.height - 1 + spacing, this.tracker.size - 2 * spacing, boxSize, 0.1, true, false);
        }
    }, {
        key: 'calculateUpdatedPosition',
        value: function calculateUpdatedPosition(position, move) {
            var updatedPosition = position + (move || 0);

            if (updatedPosition < 0) {
                return updatedPosition + this.grid.width;
            } else if (updatedPosition >= this.grid.width) {
                return updatedPosition - this.grid.width;
            } else {
                return updatedPosition;
            }

            return updatedPosition;
        }
    }, {
        key: 'update',
        value: function update(currentTime) {
            var _this = this;

            var ticks = currentTime && this.lastUpdateTime ? (currentTime - this.lastUpdateTime) / constants.gameLoopDelayMs : 0;

            this.lastUpdateTime = currentTime;

            var currentEvent = this.currentEvent;
            var nextEvent = this.nextEvent;

            for (; ticks > 0; ticks -= 1) {
                if (!currentEvent) {
                    currentEvent = this.currentEvent = this.events.shift();
                    nextEvent = this.nextEvent = this.events.length > 0 ? this.events[0] : null;

                    //this.tracker.capture   = false;
                    //this.tracker.collision = false;

                    if (currentEvent) {
                        this.tracker.nextPosition = this.calculateUpdatedPosition(this.tracker.position, currentEvent.move);

                        if (this.tracker.fading) {
                            this.tracker.fading = false;
                        }

                        if (this.tracker.captured) {
                            this.tracker.captured = false;
                            this.tracker.fading = true;
                        }

                        if (this.tracker.capture) {
                            this.tracker.capture = false;
                            this.tracker.captured = true;
                        }

                        if (currentEvent.spawn) {
                            var object = currentEvent.spawn;
                            object.y = -1;
                            this.objects.push(object);
                        }

                        if (nextEvent) {
                            var endPosition = this.calculateUpdatedPosition(this.tracker.nextPosition, nextEvent.move);

                            if (this.objects.length > 0) {
                                var _object = this.objects[0];
                                if (_object.y === this.grid.height - 3) {
                                    var kind = this.kinds[_object.kind];
                                    var ox = (_object.x + (this.grid.width - this.tracker.nextPosition)) % this.grid.width;

                                    var capture = ox + kind.size <= this.tracker.size;

                                    if (capture) {
                                        this.tracker.capture = capture;
                                        this.tracker.colors = chroma.scale([this.tracker.color, kind.color]).mode('lch').colors(5, 'css');
                                    }
                                }
                            }
                        }
                    }
                }

                if (currentEvent) {
                    var movementIndex = ++this.movementIndex;

                    if (movementIndex === 5) {
                        this.tracker.position = this.tracker.nextPosition;

                        if (this.tracker.captured) {
                            this.objects.shift();
                        }

                        this.objects = this.objects.filter(function (object) {
                            object.y += 1;
                            return object.y < _this.grid.height;
                        });

                        this.currentEvent = null;
                        this.movementIndex = 0;
                    }
                }
            }

            this.render();

            window.requestAnimationFrame(this.update.bind(this));
        }
    }]);

    return Widget;
}();

},{"chroma-js":2}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdmktYmVlci10cmFja2VyLWFwcC5qcyIsIi4uL3ZpLWJlZXItdHJhY2tlci13aWRnZXQvbm9kZV9tb2R1bGVzL2Nocm9tYS1qcy9jaHJvbWEuanMiLCIuLi92aS1iZWVyLXRyYWNrZXItd2lkZ2V0L3ZpLWJlZXItdHJhY2tlci13aWRnZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QTdCLEVBbkdKOzs7O1dBN0pTIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImV4cG9ydCAqIGZyb20gJy4uLy4uL3ZpLWJlZXItdHJhY2tlci13aWRnZXQvdmktYmVlci10cmFja2VyLXdpZGdldCc7XG4iLCJcbi8qKlxuICogQGxpY2Vuc2VcbiAqXG4gKiBjaHJvbWEuanMgLSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGNvbG9yIGNvbnZlcnNpb25zXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDE1LCBHcmVnb3IgQWlzY2hcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICogbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiBcbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiBcbiAqIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb25cbiAqICAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogXG4gKiAzLiBUaGUgbmFtZSBHcmVnb3IgQWlzY2ggbWF5IG5vdCBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0c1xuICogICAgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKiBcbiAqIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gKiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gKiBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAqIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEdSRUdPUiBBSVNDSCBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsXG4gKiBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuICogREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWVxuICogT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkdcbiAqIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSxcbiAqIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgdmFyIENvbG9yLCBERUcyUkFELCBMQUJfQ09OU1RBTlRTLCBQSSwgUElUSElSRCwgUkFEMkRFRywgVFdPUEksIF9ndWVzc19mb3JtYXRzLCBfZ3Vlc3NfZm9ybWF0c19zb3J0ZWQsIF9pbnB1dCwgX2ludGVycG9sYXRvcnMsIGFicywgYXRhbjIsIGJlemllciwgYmxlbmQsIGJsZW5kX2YsIGJyZXdlciwgYnVybiwgY2hyb21hLCBjbGlwX3JnYiwgY215azJyZ2IsIGNvbG9ycywgY29zLCBjc3MycmdiLCBkYXJrZW4sIGRvZGdlLCBlYWNoLCBmbG9vciwgaGV4MnJnYiwgaHNpMnJnYiwgaHNsMmNzcywgaHNsMnJnYiwgaHN2MnJnYiwgaW50ZXJwb2xhdGUsIGludGVycG9sYXRlX2hzeCwgaW50ZXJwb2xhdGVfbGFiLCBpbnRlcnBvbGF0ZV9udW0sIGludGVycG9sYXRlX3JnYiwgbGFiMmxjaCwgbGFiMnJnYiwgbGFiX3h5eiwgbGNoMmxhYiwgbGNoMnJnYiwgbGlnaHRlbiwgbGltaXQsIGxvZywgbHVtaW5hbmNlX3gsIG0sIG1heCwgbXVsdGlwbHksIG5vcm1hbCwgbnVtMnJnYiwgb3ZlcmxheSwgcG93LCByZ2IyY215aywgcmdiMmNzcywgcmdiMmhleCwgcmdiMmhzaSwgcmdiMmhzbCwgcmdiMmhzdiwgcmdiMmxhYiwgcmdiMmxjaCwgcmdiMmx1bWluYW5jZSwgcmdiMm51bSwgcmdiMnRlbXBlcmF0dXJlLCByZ2IyeHl6LCByZ2JfeHl6LCBybmQsIHJvb3QsIHJvdW5kLCBzY3JlZW4sIHNpbiwgc3FydCwgdGVtcGVyYXR1cmUycmdiLCB0eXBlLCB1bnBhY2ssIHczY3gxMSwgeHl6X2xhYiwgeHl6X3JnYixcbiAgICBzbGljZSA9IFtdLnNsaWNlO1xuXG4gIHR5cGUgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvKlxuICAgIGZvciBicm93c2VyLXNhZmUgdHlwZSBjaGVja2luZytcbiAgICBwb3J0ZWQgZnJvbSBqUXVlcnkncyAkLnR5cGVcbiAgICAgKi9cbiAgICB2YXIgY2xhc3NUb1R5cGUsIGxlbiwgbmFtZSwgbywgcmVmO1xuICAgIGNsYXNzVG9UeXBlID0ge307XG4gICAgcmVmID0gXCJCb29sZWFuIE51bWJlciBTdHJpbmcgRnVuY3Rpb24gQXJyYXkgRGF0ZSBSZWdFeHAgVW5kZWZpbmVkIE51bGxcIi5zcGxpdChcIiBcIik7XG4gICAgZm9yIChvID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICBuYW1lID0gcmVmW29dO1xuICAgICAgY2xhc3NUb1R5cGVbXCJbb2JqZWN0IFwiICsgbmFtZSArIFwiXVwiXSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIHN0clR5cGU7XG4gICAgICBzdHJUeXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG4gICAgICByZXR1cm4gY2xhc3NUb1R5cGVbc3RyVHlwZV0gfHwgXCJvYmplY3RcIjtcbiAgICB9O1xuICB9KSgpO1xuXG4gIGxpbWl0ID0gZnVuY3Rpb24oeCwgbWluLCBtYXgpIHtcbiAgICBpZiAobWluID09IG51bGwpIHtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gMTtcbiAgICB9XG4gICAgaWYgKHggPCBtaW4pIHtcbiAgICAgIHggPSBtaW47XG4gICAgfVxuICAgIGlmICh4ID4gbWF4KSB7XG4gICAgICB4ID0gbWF4O1xuICAgIH1cbiAgICByZXR1cm4geDtcbiAgfTtcblxuICB1bnBhY2sgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID49IDMpIHtcbiAgICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9XG4gIH07XG5cbiAgY2xpcF9yZ2IgPSBmdW5jdGlvbihyZ2IpIHtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgaW4gcmdiKSB7XG4gICAgICBpZiAoaSA8IDMpIHtcbiAgICAgICAgaWYgKHJnYltpXSA8IDApIHtcbiAgICAgICAgICByZ2JbaV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZ2JbaV0gPiAyNTUpIHtcbiAgICAgICAgICByZ2JbaV0gPSAyNTU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMykge1xuICAgICAgICBpZiAocmdiW2ldIDwgMCkge1xuICAgICAgICAgIHJnYltpXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJnYltpXSA+IDEpIHtcbiAgICAgICAgICByZ2JbaV0gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZ2I7XG4gIH07XG5cbiAgUEkgPSBNYXRoLlBJLCByb3VuZCA9IE1hdGgucm91bmQsIGNvcyA9IE1hdGguY29zLCBmbG9vciA9IE1hdGguZmxvb3IsIHBvdyA9IE1hdGgucG93LCBsb2cgPSBNYXRoLmxvZywgc2luID0gTWF0aC5zaW4sIHNxcnQgPSBNYXRoLnNxcnQsIGF0YW4yID0gTWF0aC5hdGFuMiwgbWF4ID0gTWF0aC5tYXgsIGFicyA9IE1hdGguYWJzO1xuXG4gIFRXT1BJID0gUEkgKiAyO1xuXG4gIFBJVEhJUkQgPSBQSSAvIDM7XG5cbiAgREVHMlJBRCA9IFBJIC8gMTgwO1xuXG4gIFJBRDJERUcgPSAxODAgLyBQSTtcblxuICBjaHJvbWEgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgQ29sb3IpIHtcbiAgICAgIHJldHVybiBhcmd1bWVudHNbMF07XG4gICAgfVxuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoQ29sb3IsIGFyZ3VtZW50cywgZnVuY3Rpb24oKXt9KTtcbiAgfTtcblxuICBfaW50ZXJwb2xhdG9ycyA9IFtdO1xuXG4gIGlmICgodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwpICYmIChtb2R1bGUuZXhwb3J0cyAhPSBudWxsKSkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gY2hyb21hO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2hyb21hO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJvb3QgPSB0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBleHBvcnRzICE9PSBudWxsID8gZXhwb3J0cyA6IHRoaXM7XG4gICAgcm9vdC5jaHJvbWEgPSBjaHJvbWE7XG4gIH1cblxuICBjaHJvbWEudmVyc2lvbiA9ICcxLjEuMSc7XG5cblxuICAvKipcbiAgICAgIGNocm9tYS5qc1xuICBcbiAgICAgIENvcHlyaWdodCAoYykgMjAxMS0yMDEzLCBHcmVnb3IgQWlzY2hcbiAgICAgIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gIFxuICAgICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gICAgICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAgXG4gICAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICAgICAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgXG4gICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAgICAgICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICAgICAgICBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAgXG4gICAgICAqIFRoZSBuYW1lIEdyZWdvciBBaXNjaCBtYXkgbm90IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzXG4gICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICBcbiAgICAgIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gICAgICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gICAgICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAgICAgIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEdSRUdPUiBBSVNDSCBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICAgICAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsXG4gICAgICBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuICAgICAgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWVxuICAgICAgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkdcbiAgICAgIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSxcbiAgICAgIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gIFxuICAgICAgQHNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL2drYS9jaHJvbWEuanNcbiAgICovXG5cbiAgX2lucHV0ID0ge307XG5cbiAgX2d1ZXNzX2Zvcm1hdHMgPSBbXTtcblxuICBfZ3Vlc3NfZm9ybWF0c19zb3J0ZWQgPSBmYWxzZTtcblxuICBDb2xvciA9IChmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBDb2xvcigpIHtcbiAgICAgIHZhciBhcmcsIGFyZ3MsIGNoaywgbGVuLCBsZW4xLCBtZSwgbW9kZSwgbywgdztcbiAgICAgIG1lID0gdGhpcztcbiAgICAgIGFyZ3MgPSBbXTtcbiAgICAgIGZvciAobyA9IDAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IG8gPCBsZW47IG8rKykge1xuICAgICAgICBhcmcgPSBhcmd1bWVudHNbb107XG4gICAgICAgIGlmIChhcmcgIT0gbnVsbCkge1xuICAgICAgICAgIGFyZ3MucHVzaChhcmcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBtb2RlID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdO1xuICAgICAgaWYgKF9pbnB1dFttb2RlXSAhPSBudWxsKSB7XG4gICAgICAgIG1lLl9yZ2IgPSBjbGlwX3JnYihfaW5wdXRbbW9kZV0odW5wYWNrKGFyZ3Muc2xpY2UoMCwgLTEpKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFfZ3Vlc3NfZm9ybWF0c19zb3J0ZWQpIHtcbiAgICAgICAgICBfZ3Vlc3NfZm9ybWF0cyA9IF9ndWVzc19mb3JtYXRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGIucCAtIGEucDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBfZ3Vlc3NfZm9ybWF0c19zb3J0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodyA9IDAsIGxlbjEgPSBfZ3Vlc3NfZm9ybWF0cy5sZW5ndGg7IHcgPCBsZW4xOyB3KyspIHtcbiAgICAgICAgICBjaGsgPSBfZ3Vlc3NfZm9ybWF0c1t3XTtcbiAgICAgICAgICBtb2RlID0gY2hrLnRlc3QuYXBwbHkoY2hrLCBhcmdzKTtcbiAgICAgICAgICBpZiAobW9kZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtb2RlKSB7XG4gICAgICAgICAgbWUuX3JnYiA9IGNsaXBfcmdiKF9pbnB1dFttb2RlXS5hcHBseShfaW5wdXQsIGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG1lLl9yZ2IgPT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ3Vua25vd24gZm9ybWF0OiAnICsgYXJncyk7XG4gICAgICB9XG4gICAgICBpZiAobWUuX3JnYiA9PSBudWxsKSB7XG4gICAgICAgIG1lLl9yZ2IgPSBbMCwgMCwgMF07XG4gICAgICB9XG4gICAgICBpZiAobWUuX3JnYi5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgbWUuX3JnYi5wdXNoKDEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIENvbG9yLnByb3RvdHlwZS5hbHBoYSA9IGZ1bmN0aW9uKGFscGhhKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLl9yZ2JbM10gPSBhbHBoYTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fcmdiWzNdO1xuICAgIH07XG5cbiAgICBDb2xvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm5hbWUoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIENvbG9yO1xuXG4gIH0pKCk7XG5cbiAgY2hyb21hLl9pbnB1dCA9IF9pbnB1dDtcblxuXG4gIC8qKlxuICBcdENvbG9yQnJld2VyIGNvbG9ycyBmb3IgY2hyb21hLmpzXG4gIFxuICBcdENvcHlyaWdodCAoYykgMjAwMiBDeW50aGlhIEJyZXdlciwgTWFyayBIYXJyb3dlciwgYW5kIFRoZSBcbiAgXHRQZW5uc3lsdmFuaWEgU3RhdGUgVW5pdmVyc2l0eS5cbiAgXG4gIFx0TGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgXG4gIFx0eW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBcdFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFx0XG4gIFx0aHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBcdFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmUgZGlzdHJpYnV0ZWRcbiAgXHR1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVQgV0FSUkFOVElFUyBPUlxuICBcdENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlXG4gIFx0c3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAgXG4gICAgICBAcHJlc2VydmVcbiAgICovXG5cbiAgY2hyb21hLmJyZXdlciA9IGJyZXdlciA9IHtcbiAgICBPclJkOiBbJyNmZmY3ZWMnLCAnI2ZlZThjOCcsICcjZmRkNDllJywgJyNmZGJiODQnLCAnI2ZjOGQ1OScsICcjZWY2NTQ4JywgJyNkNzMwMWYnLCAnI2IzMDAwMCcsICcjN2YwMDAwJ10sXG4gICAgUHVCdTogWycjZmZmN2ZiJywgJyNlY2U3ZjInLCAnI2QwZDFlNicsICcjYTZiZGRiJywgJyM3NGE5Y2YnLCAnIzM2OTBjMCcsICcjMDU3MGIwJywgJyMwNDVhOGQnLCAnIzAyMzg1OCddLFxuICAgIEJ1UHU6IFsnI2Y3ZmNmZCcsICcjZTBlY2Y0JywgJyNiZmQzZTYnLCAnIzllYmNkYScsICcjOGM5NmM2JywgJyM4YzZiYjEnLCAnIzg4NDE5ZCcsICcjODEwZjdjJywgJyM0ZDAwNGInXSxcbiAgICBPcmFuZ2VzOiBbJyNmZmY1ZWInLCAnI2ZlZTZjZScsICcjZmRkMGEyJywgJyNmZGFlNmInLCAnI2ZkOGQzYycsICcjZjE2OTEzJywgJyNkOTQ4MDEnLCAnI2E2MzYwMycsICcjN2YyNzA0J10sXG4gICAgQnVHbjogWycjZjdmY2ZkJywgJyNlNWY1ZjknLCAnI2NjZWNlNicsICcjOTlkOGM5JywgJyM2NmMyYTQnLCAnIzQxYWU3NicsICcjMjM4YjQ1JywgJyMwMDZkMmMnLCAnIzAwNDQxYiddLFxuICAgIFlsT3JCcjogWycjZmZmZmU1JywgJyNmZmY3YmMnLCAnI2ZlZTM5MScsICcjZmVjNDRmJywgJyNmZTk5MjknLCAnI2VjNzAxNCcsICcjY2M0YzAyJywgJyM5OTM0MDQnLCAnIzY2MjUwNiddLFxuICAgIFlsR246IFsnI2ZmZmZlNScsICcjZjdmY2I5JywgJyNkOWYwYTMnLCAnI2FkZGQ4ZScsICcjNzhjNjc5JywgJyM0MWFiNWQnLCAnIzIzODQ0MycsICcjMDA2ODM3JywgJyMwMDQ1MjknXSxcbiAgICBSZWRzOiBbJyNmZmY1ZjAnLCAnI2ZlZTBkMicsICcjZmNiYmExJywgJyNmYzkyNzInLCAnI2ZiNmE0YScsICcjZWYzYjJjJywgJyNjYjE4MWQnLCAnI2E1MGYxNScsICcjNjcwMDBkJ10sXG4gICAgUmRQdTogWycjZmZmN2YzJywgJyNmZGUwZGQnLCAnI2ZjYzVjMCcsICcjZmE5ZmI1JywgJyNmNzY4YTEnLCAnI2RkMzQ5NycsICcjYWUwMTdlJywgJyM3YTAxNzcnLCAnIzQ5MDA2YSddLFxuICAgIEdyZWVuczogWycjZjdmY2Y1JywgJyNlNWY1ZTAnLCAnI2M3ZTljMCcsICcjYTFkOTliJywgJyM3NGM0NzYnLCAnIzQxYWI1ZCcsICcjMjM4YjQ1JywgJyMwMDZkMmMnLCAnIzAwNDQxYiddLFxuICAgIFlsR25CdTogWycjZmZmZmQ5JywgJyNlZGY4YjEnLCAnI2M3ZTliNCcsICcjN2ZjZGJiJywgJyM0MWI2YzQnLCAnIzFkOTFjMCcsICcjMjI1ZWE4JywgJyMyNTM0OTQnLCAnIzA4MWQ1OCddLFxuICAgIFB1cnBsZXM6IFsnI2ZjZmJmZCcsICcjZWZlZGY1JywgJyNkYWRhZWInLCAnI2JjYmRkYycsICcjOWU5YWM4JywgJyM4MDdkYmEnLCAnIzZhNTFhMycsICcjNTQyNzhmJywgJyMzZjAwN2QnXSxcbiAgICBHbkJ1OiBbJyNmN2ZjZjAnLCAnI2UwZjNkYicsICcjY2NlYmM1JywgJyNhOGRkYjUnLCAnIzdiY2NjNCcsICcjNGViM2QzJywgJyMyYjhjYmUnLCAnIzA4NjhhYycsICcjMDg0MDgxJ10sXG4gICAgR3JleXM6IFsnI2ZmZmZmZicsICcjZjBmMGYwJywgJyNkOWQ5ZDknLCAnI2JkYmRiZCcsICcjOTY5Njk2JywgJyM3MzczNzMnLCAnIzUyNTI1MicsICcjMjUyNTI1JywgJyMwMDAwMDAnXSxcbiAgICBZbE9yUmQ6IFsnI2ZmZmZjYycsICcjZmZlZGEwJywgJyNmZWQ5NzYnLCAnI2ZlYjI0YycsICcjZmQ4ZDNjJywgJyNmYzRlMmEnLCAnI2UzMWExYycsICcjYmQwMDI2JywgJyM4MDAwMjYnXSxcbiAgICBQdVJkOiBbJyNmN2Y0ZjknLCAnI2U3ZTFlZicsICcjZDRiOWRhJywgJyNjOTk0YzcnLCAnI2RmNjViMCcsICcjZTcyOThhJywgJyNjZTEyNTYnLCAnIzk4MDA0MycsICcjNjcwMDFmJ10sXG4gICAgQmx1ZXM6IFsnI2Y3ZmJmZicsICcjZGVlYmY3JywgJyNjNmRiZWYnLCAnIzllY2FlMScsICcjNmJhZWQ2JywgJyM0MjkyYzYnLCAnIzIxNzFiNScsICcjMDg1MTljJywgJyMwODMwNmInXSxcbiAgICBQdUJ1R246IFsnI2ZmZjdmYicsICcjZWNlMmYwJywgJyNkMGQxZTYnLCAnI2E2YmRkYicsICcjNjdhOWNmJywgJyMzNjkwYzAnLCAnIzAyODE4YScsICcjMDE2YzU5JywgJyMwMTQ2MzYnXSxcbiAgICBTcGVjdHJhbDogWycjOWUwMTQyJywgJyNkNTNlNGYnLCAnI2Y0NmQ0MycsICcjZmRhZTYxJywgJyNmZWUwOGInLCAnI2ZmZmZiZicsICcjZTZmNTk4JywgJyNhYmRkYTQnLCAnIzY2YzJhNScsICcjMzI4OGJkJywgJyM1ZTRmYTInXSxcbiAgICBSZFlsR246IFsnI2E1MDAyNicsICcjZDczMDI3JywgJyNmNDZkNDMnLCAnI2ZkYWU2MScsICcjZmVlMDhiJywgJyNmZmZmYmYnLCAnI2Q5ZWY4YicsICcjYTZkOTZhJywgJyM2NmJkNjMnLCAnIzFhOTg1MCcsICcjMDA2ODM3J10sXG4gICAgUmRCdTogWycjNjcwMDFmJywgJyNiMjE4MmInLCAnI2Q2NjA0ZCcsICcjZjRhNTgyJywgJyNmZGRiYzcnLCAnI2Y3ZjdmNycsICcjZDFlNWYwJywgJyM5MmM1ZGUnLCAnIzQzOTNjMycsICcjMjE2NmFjJywgJyMwNTMwNjEnXSxcbiAgICBQaVlHOiBbJyM4ZTAxNTInLCAnI2M1MWI3ZCcsICcjZGU3N2FlJywgJyNmMWI2ZGEnLCAnI2ZkZTBlZicsICcjZjdmN2Y3JywgJyNlNmY1ZDAnLCAnI2I4ZTE4NicsICcjN2ZiYzQxJywgJyM0ZDkyMjEnLCAnIzI3NjQxOSddLFxuICAgIFBSR246IFsnIzQwMDA0YicsICcjNzYyYTgzJywgJyM5OTcwYWInLCAnI2MyYTVjZicsICcjZTdkNGU4JywgJyNmN2Y3ZjcnLCAnI2Q5ZjBkMycsICcjYTZkYmEwJywgJyM1YWFlNjEnLCAnIzFiNzgzNycsICcjMDA0NDFiJ10sXG4gICAgUmRZbEJ1OiBbJyNhNTAwMjYnLCAnI2Q3MzAyNycsICcjZjQ2ZDQzJywgJyNmZGFlNjEnLCAnI2ZlZTA5MCcsICcjZmZmZmJmJywgJyNlMGYzZjgnLCAnI2FiZDllOScsICcjNzRhZGQxJywgJyM0NTc1YjQnLCAnIzMxMzY5NSddLFxuICAgIEJyQkc6IFsnIzU0MzAwNScsICcjOGM1MTBhJywgJyNiZjgxMmQnLCAnI2RmYzI3ZCcsICcjZjZlOGMzJywgJyNmNWY1ZjUnLCAnI2M3ZWFlNScsICcjODBjZGMxJywgJyMzNTk3OGYnLCAnIzAxNjY1ZScsICcjMDAzYzMwJ10sXG4gICAgUmRHeTogWycjNjcwMDFmJywgJyNiMjE4MmInLCAnI2Q2NjA0ZCcsICcjZjRhNTgyJywgJyNmZGRiYzcnLCAnI2ZmZmZmZicsICcjZTBlMGUwJywgJyNiYWJhYmEnLCAnIzg3ODc4NycsICcjNGQ0ZDRkJywgJyMxYTFhMWEnXSxcbiAgICBQdU9yOiBbJyM3ZjNiMDgnLCAnI2IzNTgwNicsICcjZTA4MjE0JywgJyNmZGI4NjMnLCAnI2ZlZTBiNicsICcjZjdmN2Y3JywgJyNkOGRhZWInLCAnI2IyYWJkMicsICcjODA3M2FjJywgJyM1NDI3ODgnLCAnIzJkMDA0YiddLFxuICAgIFNldDI6IFsnIzY2YzJhNScsICcjZmM4ZDYyJywgJyM4ZGEwY2InLCAnI2U3OGFjMycsICcjYTZkODU0JywgJyNmZmQ5MmYnLCAnI2U1YzQ5NCcsICcjYjNiM2IzJ10sXG4gICAgQWNjZW50OiBbJyM3ZmM5N2YnLCAnI2JlYWVkNCcsICcjZmRjMDg2JywgJyNmZmZmOTknLCAnIzM4NmNiMCcsICcjZjAwMjdmJywgJyNiZjViMTcnLCAnIzY2NjY2NiddLFxuICAgIFNldDE6IFsnI2U0MWExYycsICcjMzc3ZWI4JywgJyM0ZGFmNGEnLCAnIzk4NGVhMycsICcjZmY3ZjAwJywgJyNmZmZmMzMnLCAnI2E2NTYyOCcsICcjZjc4MWJmJywgJyM5OTk5OTknXSxcbiAgICBTZXQzOiBbJyM4ZGQzYzcnLCAnI2ZmZmZiMycsICcjYmViYWRhJywgJyNmYjgwNzInLCAnIzgwYjFkMycsICcjZmRiNDYyJywgJyNiM2RlNjknLCAnI2ZjY2RlNScsICcjZDlkOWQ5JywgJyNiYzgwYmQnLCAnI2NjZWJjNScsICcjZmZlZDZmJ10sXG4gICAgRGFyazI6IFsnIzFiOWU3NycsICcjZDk1ZjAyJywgJyM3NTcwYjMnLCAnI2U3Mjk4YScsICcjNjZhNjFlJywgJyNlNmFiMDInLCAnI2E2NzYxZCcsICcjNjY2NjY2J10sXG4gICAgUGFpcmVkOiBbJyNhNmNlZTMnLCAnIzFmNzhiNCcsICcjYjJkZjhhJywgJyMzM2EwMmMnLCAnI2ZiOWE5OScsICcjZTMxYTFjJywgJyNmZGJmNmYnLCAnI2ZmN2YwMCcsICcjY2FiMmQ2JywgJyM2YTNkOWEnLCAnI2ZmZmY5OScsICcjYjE1OTI4J10sXG4gICAgUGFzdGVsMjogWycjYjNlMmNkJywgJyNmZGNkYWMnLCAnI2NiZDVlOCcsICcjZjRjYWU0JywgJyNlNmY1YzknLCAnI2ZmZjJhZScsICcjZjFlMmNjJywgJyNjY2NjY2MnXSxcbiAgICBQYXN0ZWwxOiBbJyNmYmI0YWUnLCAnI2IzY2RlMycsICcjY2NlYmM1JywgJyNkZWNiZTQnLCAnI2ZlZDlhNicsICcjZmZmZmNjJywgJyNlNWQ4YmQnLCAnI2ZkZGFlYycsICcjZjJmMmYyJ11cbiAgfTtcblxuXG4gIC8qKlxuICBcdFgxMSBjb2xvciBuYW1lc1xuICBcbiAgXHRodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLWNvbG9yLyNzdmctY29sb3JcbiAgICovXG5cbiAgdzNjeDExID0ge1xuICAgIGluZGlnbzogXCIjNGIwMDgyXCIsXG4gICAgZ29sZDogXCIjZmZkNzAwXCIsXG4gICAgaG90cGluazogXCIjZmY2OWI0XCIsXG4gICAgZmlyZWJyaWNrOiBcIiNiMjIyMjJcIixcbiAgICBpbmRpYW5yZWQ6IFwiI2NkNWM1Y1wiLFxuICAgIHllbGxvdzogXCIjZmZmZjAwXCIsXG4gICAgbWlzdHlyb3NlOiBcIiNmZmU0ZTFcIixcbiAgICBkYXJrb2xpdmVncmVlbjogXCIjNTU2YjJmXCIsXG4gICAgb2xpdmU6IFwiIzgwODAwMFwiLFxuICAgIGRhcmtzZWFncmVlbjogXCIjOGZiYzhmXCIsXG4gICAgcGluazogXCIjZmZjMGNiXCIsXG4gICAgdG9tYXRvOiBcIiNmZjYzNDdcIixcbiAgICBsaWdodGNvcmFsOiBcIiNmMDgwODBcIixcbiAgICBvcmFuZ2VyZWQ6IFwiI2ZmNDUwMFwiLFxuICAgIG5hdmFqb3doaXRlOiBcIiNmZmRlYWRcIixcbiAgICBsaW1lOiBcIiMwMGZmMDBcIixcbiAgICBwYWxlZ3JlZW46IFwiIzk4ZmI5OFwiLFxuICAgIGRhcmtzbGF0ZWdyZXk6IFwiIzJmNGY0ZlwiLFxuICAgIGdyZWVueWVsbG93OiBcIiNhZGZmMmZcIixcbiAgICBidXJseXdvb2Q6IFwiI2RlYjg4N1wiLFxuICAgIHNlYXNoZWxsOiBcIiNmZmY1ZWVcIixcbiAgICBtZWRpdW1zcHJpbmdncmVlbjogXCIjMDBmYTlhXCIsXG4gICAgZnVjaHNpYTogXCIjZmYwMGZmXCIsXG4gICAgcGFwYXlhd2hpcDogXCIjZmZlZmQ1XCIsXG4gICAgYmxhbmNoZWRhbG1vbmQ6IFwiI2ZmZWJjZFwiLFxuICAgIGNoYXJ0cmV1c2U6IFwiIzdmZmYwMFwiLFxuICAgIGRpbWdyYXk6IFwiIzY5Njk2OVwiLFxuICAgIGJsYWNrOiBcIiMwMDAwMDBcIixcbiAgICBwZWFjaHB1ZmY6IFwiI2ZmZGFiOVwiLFxuICAgIHNwcmluZ2dyZWVuOiBcIiMwMGZmN2ZcIixcbiAgICBhcXVhbWFyaW5lOiBcIiM3ZmZmZDRcIixcbiAgICB3aGl0ZTogXCIjZmZmZmZmXCIsXG4gICAgb3JhbmdlOiBcIiNmZmE1MDBcIixcbiAgICBsaWdodHNhbG1vbjogXCIjZmZhMDdhXCIsXG4gICAgZGFya3NsYXRlZ3JheTogXCIjMmY0ZjRmXCIsXG4gICAgYnJvd246IFwiI2E1MmEyYVwiLFxuICAgIGl2b3J5OiBcIiNmZmZmZjBcIixcbiAgICBkb2RnZXJibHVlOiBcIiMxZTkwZmZcIixcbiAgICBwZXJ1OiBcIiNjZDg1M2ZcIixcbiAgICBsYXduZ3JlZW46IFwiIzdjZmMwMFwiLFxuICAgIGNob2NvbGF0ZTogXCIjZDI2OTFlXCIsXG4gICAgY3JpbXNvbjogXCIjZGMxNDNjXCIsXG4gICAgZm9yZXN0Z3JlZW46IFwiIzIyOGIyMlwiLFxuICAgIGRhcmtncmV5OiBcIiNhOWE5YTlcIixcbiAgICBsaWdodHNlYWdyZWVuOiBcIiMyMGIyYWFcIixcbiAgICBjeWFuOiBcIiMwMGZmZmZcIixcbiAgICBtaW50Y3JlYW06IFwiI2Y1ZmZmYVwiLFxuICAgIHNpbHZlcjogXCIjYzBjMGMwXCIsXG4gICAgYW50aXF1ZXdoaXRlOiBcIiNmYWViZDdcIixcbiAgICBtZWRpdW1vcmNoaWQ6IFwiI2JhNTVkM1wiLFxuICAgIHNreWJsdWU6IFwiIzg3Y2VlYlwiLFxuICAgIGdyYXk6IFwiIzgwODA4MFwiLFxuICAgIGRhcmt0dXJxdW9pc2U6IFwiIzAwY2VkMVwiLFxuICAgIGdvbGRlbnJvZDogXCIjZGFhNTIwXCIsXG4gICAgZGFya2dyZWVuOiBcIiMwMDY0MDBcIixcbiAgICBmbG9yYWx3aGl0ZTogXCIjZmZmYWYwXCIsXG4gICAgZGFya3Zpb2xldDogXCIjOTQwMGQzXCIsXG4gICAgZGFya2dyYXk6IFwiI2E5YTlhOVwiLFxuICAgIG1vY2Nhc2luOiBcIiNmZmU0YjVcIixcbiAgICBzYWRkbGVicm93bjogXCIjOGI0NTEzXCIsXG4gICAgZ3JleTogXCIjODA4MDgwXCIsXG4gICAgZGFya3NsYXRlYmx1ZTogXCIjNDgzZDhiXCIsXG4gICAgbGlnaHRza3libHVlOiBcIiM4N2NlZmFcIixcbiAgICBsaWdodHBpbms6IFwiI2ZmYjZjMVwiLFxuICAgIG1lZGl1bXZpb2xldHJlZDogXCIjYzcxNTg1XCIsXG4gICAgc2xhdGVncmV5OiBcIiM3MDgwOTBcIixcbiAgICByZWQ6IFwiI2ZmMDAwMFwiLFxuICAgIGRlZXBwaW5rOiBcIiNmZjE0OTNcIixcbiAgICBsaW1lZ3JlZW46IFwiIzMyY2QzMlwiLFxuICAgIGRhcmttYWdlbnRhOiBcIiM4YjAwOGJcIixcbiAgICBwYWxlZ29sZGVucm9kOiBcIiNlZWU4YWFcIixcbiAgICBwbHVtOiBcIiNkZGEwZGRcIixcbiAgICB0dXJxdW9pc2U6IFwiIzQwZTBkMFwiLFxuICAgIGxpZ2h0Z3JleTogXCIjZDNkM2QzXCIsXG4gICAgbGlnaHRnb2xkZW5yb2R5ZWxsb3c6IFwiI2ZhZmFkMlwiLFxuICAgIGRhcmtnb2xkZW5yb2Q6IFwiI2I4ODYwYlwiLFxuICAgIGxhdmVuZGVyOiBcIiNlNmU2ZmFcIixcbiAgICBtYXJvb246IFwiIzgwMDAwMFwiLFxuICAgIHllbGxvd2dyZWVuOiBcIiM5YWNkMzJcIixcbiAgICBzYW5keWJyb3duOiBcIiNmNGE0NjBcIixcbiAgICB0aGlzdGxlOiBcIiNkOGJmZDhcIixcbiAgICB2aW9sZXQ6IFwiI2VlODJlZVwiLFxuICAgIG5hdnk6IFwiIzAwMDA4MFwiLFxuICAgIG1hZ2VudGE6IFwiI2ZmMDBmZlwiLFxuICAgIGRpbWdyZXk6IFwiIzY5Njk2OVwiLFxuICAgIHRhbjogXCIjZDJiNDhjXCIsXG4gICAgcm9zeWJyb3duOiBcIiNiYzhmOGZcIixcbiAgICBvbGl2ZWRyYWI6IFwiIzZiOGUyM1wiLFxuICAgIGJsdWU6IFwiIzAwMDBmZlwiLFxuICAgIGxpZ2h0Ymx1ZTogXCIjYWRkOGU2XCIsXG4gICAgZ2hvc3R3aGl0ZTogXCIjZjhmOGZmXCIsXG4gICAgaG9uZXlkZXc6IFwiI2YwZmZmMFwiLFxuICAgIGNvcm5mbG93ZXJibHVlOiBcIiM2NDk1ZWRcIixcbiAgICBzbGF0ZWJsdWU6IFwiIzZhNWFjZFwiLFxuICAgIGxpbmVuOiBcIiNmYWYwZTZcIixcbiAgICBkYXJrYmx1ZTogXCIjMDAwMDhiXCIsXG4gICAgcG93ZGVyYmx1ZTogXCIjYjBlMGU2XCIsXG4gICAgc2VhZ3JlZW46IFwiIzJlOGI1N1wiLFxuICAgIGRhcmtraGFraTogXCIjYmRiNzZiXCIsXG4gICAgc25vdzogXCIjZmZmYWZhXCIsXG4gICAgc2llbm5hOiBcIiNhMDUyMmRcIixcbiAgICBtZWRpdW1ibHVlOiBcIiMwMDAwY2RcIixcbiAgICByb3lhbGJsdWU6IFwiIzQxNjllMVwiLFxuICAgIGxpZ2h0Y3lhbjogXCIjZTBmZmZmXCIsXG4gICAgZ3JlZW46IFwiIzAwODAwMFwiLFxuICAgIG1lZGl1bXB1cnBsZTogXCIjOTM3MGRiXCIsXG4gICAgbWlkbmlnaHRibHVlOiBcIiMxOTE5NzBcIixcbiAgICBjb3Juc2lsazogXCIjZmZmOGRjXCIsXG4gICAgcGFsZXR1cnF1b2lzZTogXCIjYWZlZWVlXCIsXG4gICAgYmlzcXVlOiBcIiNmZmU0YzRcIixcbiAgICBzbGF0ZWdyYXk6IFwiIzcwODA5MFwiLFxuICAgIGRhcmtjeWFuOiBcIiMwMDhiOGJcIixcbiAgICBraGFraTogXCIjZjBlNjhjXCIsXG4gICAgd2hlYXQ6IFwiI2Y1ZGViM1wiLFxuICAgIHRlYWw6IFwiIzAwODA4MFwiLFxuICAgIGRhcmtvcmNoaWQ6IFwiIzk5MzJjY1wiLFxuICAgIGRlZXBza3libHVlOiBcIiMwMGJmZmZcIixcbiAgICBzYWxtb246IFwiI2ZhODA3MlwiLFxuICAgIGRhcmtyZWQ6IFwiIzhiMDAwMFwiLFxuICAgIHN0ZWVsYmx1ZTogXCIjNDY4MmI0XCIsXG4gICAgcGFsZXZpb2xldHJlZDogXCIjZGI3MDkzXCIsXG4gICAgbGlnaHRzbGF0ZWdyYXk6IFwiIzc3ODg5OVwiLFxuICAgIGFsaWNlYmx1ZTogXCIjZjBmOGZmXCIsXG4gICAgbGlnaHRzbGF0ZWdyZXk6IFwiIzc3ODg5OVwiLFxuICAgIGxpZ2h0Z3JlZW46IFwiIzkwZWU5MFwiLFxuICAgIG9yY2hpZDogXCIjZGE3MGQ2XCIsXG4gICAgZ2FpbnNib3JvOiBcIiNkY2RjZGNcIixcbiAgICBtZWRpdW1zZWFncmVlbjogXCIjM2NiMzcxXCIsXG4gICAgbGlnaHRncmF5OiBcIiNkM2QzZDNcIixcbiAgICBtZWRpdW10dXJxdW9pc2U6IFwiIzQ4ZDFjY1wiLFxuICAgIGxlbW9uY2hpZmZvbjogXCIjZmZmYWNkXCIsXG4gICAgY2FkZXRibHVlOiBcIiM1ZjllYTBcIixcbiAgICBsaWdodHllbGxvdzogXCIjZmZmZmUwXCIsXG4gICAgbGF2ZW5kZXJibHVzaDogXCIjZmZmMGY1XCIsXG4gICAgY29yYWw6IFwiI2ZmN2Y1MFwiLFxuICAgIHB1cnBsZTogXCIjODAwMDgwXCIsXG4gICAgYXF1YTogXCIjMDBmZmZmXCIsXG4gICAgd2hpdGVzbW9rZTogXCIjZjVmNWY1XCIsXG4gICAgbWVkaXVtc2xhdGVibHVlOiBcIiM3YjY4ZWVcIixcbiAgICBkYXJrb3JhbmdlOiBcIiNmZjhjMDBcIixcbiAgICBtZWRpdW1hcXVhbWFyaW5lOiBcIiM2NmNkYWFcIixcbiAgICBkYXJrc2FsbW9uOiBcIiNlOTk2N2FcIixcbiAgICBiZWlnZTogXCIjZjVmNWRjXCIsXG4gICAgYmx1ZXZpb2xldDogXCIjOGEyYmUyXCIsXG4gICAgYXp1cmU6IFwiI2YwZmZmZlwiLFxuICAgIGxpZ2h0c3RlZWxibHVlOiBcIiNiMGM0ZGVcIixcbiAgICBvbGRsYWNlOiBcIiNmZGY1ZTZcIixcbiAgICByZWJlY2NhcHVycGxlOiBcIiM2NjMzOTlcIlxuICB9O1xuXG4gIGNocm9tYS5jb2xvcnMgPSBjb2xvcnMgPSB3M2N4MTE7XG5cbiAgbGFiMnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhLCBhcmdzLCBiLCBnLCBsLCByLCB4LCB5LCB6O1xuICAgIGFyZ3MgPSB1bnBhY2soYXJndW1lbnRzKTtcbiAgICBsID0gYXJnc1swXSwgYSA9IGFyZ3NbMV0sIGIgPSBhcmdzWzJdO1xuICAgIHkgPSAobCArIDE2KSAvIDExNjtcbiAgICB4ID0gaXNOYU4oYSkgPyB5IDogeSArIGEgLyA1MDA7XG4gICAgeiA9IGlzTmFOKGIpID8geSA6IHkgLSBiIC8gMjAwO1xuICAgIHkgPSBMQUJfQ09OU1RBTlRTLlluICogbGFiX3h5eih5KTtcbiAgICB4ID0gTEFCX0NPTlNUQU5UUy5YbiAqIGxhYl94eXooeCk7XG4gICAgeiA9IExBQl9DT05TVEFOVFMuWm4gKiBsYWJfeHl6KHopO1xuICAgIHIgPSB4eXpfcmdiKDMuMjQwNDU0MiAqIHggLSAxLjUzNzEzODUgKiB5IC0gMC40OTg1MzE0ICogeik7XG4gICAgZyA9IHh5el9yZ2IoLTAuOTY5MjY2MCAqIHggKyAxLjg3NjAxMDggKiB5ICsgMC4wNDE1NTYwICogeik7XG4gICAgYiA9IHh5el9yZ2IoMC4wNTU2NDM0ICogeCAtIDAuMjA0MDI1OSAqIHkgKyAxLjA1NzIyNTIgKiB6KTtcbiAgICByID0gbGltaXQociwgMCwgMjU1KTtcbiAgICBnID0gbGltaXQoZywgMCwgMjU1KTtcbiAgICBiID0gbGltaXQoYiwgMCwgMjU1KTtcbiAgICByZXR1cm4gW3IsIGcsIGIsIGFyZ3MubGVuZ3RoID4gMyA/IGFyZ3NbM10gOiAxXTtcbiAgfTtcblxuICB4eXpfcmdiID0gZnVuY3Rpb24ocikge1xuICAgIHJldHVybiByb3VuZCgyNTUgKiAociA8PSAwLjAwMzA0ID8gMTIuOTIgKiByIDogMS4wNTUgKiBwb3cociwgMSAvIDIuNCkgLSAwLjA1NSkpO1xuICB9O1xuXG4gIGxhYl94eXogPSBmdW5jdGlvbih0KSB7XG4gICAgaWYgKHQgPiBMQUJfQ09OU1RBTlRTLnQxKSB7XG4gICAgICByZXR1cm4gdCAqIHQgKiB0O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTEFCX0NPTlNUQU5UUy50MiAqICh0IC0gTEFCX0NPTlNUQU5UUy50MCk7XG4gICAgfVxuICB9O1xuXG4gIExBQl9DT05TVEFOVFMgPSB7XG4gICAgS246IDE4LFxuICAgIFhuOiAwLjk1MDQ3MCxcbiAgICBZbjogMSxcbiAgICBabjogMS4wODg4MzAsXG4gICAgdDA6IDAuMTM3OTMxMDM0LFxuICAgIHQxOiAwLjIwNjg5NjU1MixcbiAgICB0MjogMC4xMjg0MTg1NSxcbiAgICB0MzogMC4wMDg4NTY0NTJcbiAgfTtcblxuICByZ2IybGFiID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGIsIGcsIHIsIHJlZiwgcmVmMSwgeCwgeSwgejtcbiAgICByZWYgPSB1bnBhY2soYXJndW1lbnRzKSwgciA9IHJlZlswXSwgZyA9IHJlZlsxXSwgYiA9IHJlZlsyXTtcbiAgICByZWYxID0gcmdiMnh5eihyLCBnLCBiKSwgeCA9IHJlZjFbMF0sIHkgPSByZWYxWzFdLCB6ID0gcmVmMVsyXTtcbiAgICByZXR1cm4gWzExNiAqIHkgLSAxNiwgNTAwICogKHggLSB5KSwgMjAwICogKHkgLSB6KV07XG4gIH07XG5cbiAgcmdiX3h5eiA9IGZ1bmN0aW9uKHIpIHtcbiAgICBpZiAoKHIgLz0gMjU1KSA8PSAwLjA0MDQ1KSB7XG4gICAgICByZXR1cm4gciAvIDEyLjkyO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcG93KChyICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgfVxuICB9O1xuXG4gIHh5el9sYWIgPSBmdW5jdGlvbih0KSB7XG4gICAgaWYgKHQgPiBMQUJfQ09OU1RBTlRTLnQzKSB7XG4gICAgICByZXR1cm4gcG93KHQsIDEgLyAzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHQgLyBMQUJfQ09OU1RBTlRTLnQyICsgTEFCX0NPTlNUQU5UUy50MDtcbiAgICB9XG4gIH07XG5cbiAgcmdiMnh5eiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiLCBnLCByLCByZWYsIHgsIHksIHo7XG4gICAgcmVmID0gdW5wYWNrKGFyZ3VtZW50cyksIHIgPSByZWZbMF0sIGcgPSByZWZbMV0sIGIgPSByZWZbMl07XG4gICAgciA9IHJnYl94eXoocik7XG4gICAgZyA9IHJnYl94eXooZyk7XG4gICAgYiA9IHJnYl94eXooYik7XG4gICAgeCA9IHh5el9sYWIoKDAuNDEyNDU2NCAqIHIgKyAwLjM1NzU3NjEgKiBnICsgMC4xODA0Mzc1ICogYikgLyBMQUJfQ09OU1RBTlRTLlhuKTtcbiAgICB5ID0geHl6X2xhYigoMC4yMTI2NzI5ICogciArIDAuNzE1MTUyMiAqIGcgKyAwLjA3MjE3NTAgKiBiKSAvIExBQl9DT05TVEFOVFMuWW4pO1xuICAgIHogPSB4eXpfbGFiKCgwLjAxOTMzMzkgKiByICsgMC4xMTkxOTIwICogZyArIDAuOTUwMzA0MSAqIGIpIC8gTEFCX0NPTlNUQU5UUy5abik7XG4gICAgcmV0dXJuIFt4LCB5LCB6XTtcbiAgfTtcblxuICBjaHJvbWEubGFiID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcbiAgICB9KShDb2xvciwgc2xpY2UuY2FsbChhcmd1bWVudHMpLmNvbmNhdChbJ2xhYiddKSwgZnVuY3Rpb24oKXt9KTtcbiAgfTtcblxuICBfaW5wdXQubGFiID0gbGFiMnJnYjtcblxuICBDb2xvci5wcm90b3R5cGUubGFiID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHJnYjJsYWIodGhpcy5fcmdiKTtcbiAgfTtcblxuICBiZXppZXIgPSBmdW5jdGlvbihjb2xvcnMpIHtcbiAgICB2YXIgSSwgSTAsIEkxLCBjLCBsYWIwLCBsYWIxLCBsYWIyLCBsYWIzLCByZWYsIHJlZjEsIHJlZjI7XG4gICAgY29sb3JzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxlbiwgbywgcmVzdWx0cztcbiAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAobyA9IDAsIGxlbiA9IGNvbG9ycy5sZW5ndGg7IG8gPCBsZW47IG8rKykge1xuICAgICAgICBjID0gY29sb3JzW29dO1xuICAgICAgICByZXN1bHRzLnB1c2goY2hyb21hKGMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH0pKCk7XG4gICAgaWYgKGNvbG9ycy5sZW5ndGggPT09IDIpIHtcbiAgICAgIHJlZiA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxlbiwgbywgcmVzdWx0cztcbiAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKG8gPSAwLCBsZW4gPSBjb2xvcnMubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcbiAgICAgICAgICBjID0gY29sb3JzW29dO1xuICAgICAgICAgIHJlc3VsdHMucHVzaChjLmxhYigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0pKCksIGxhYjAgPSByZWZbMF0sIGxhYjEgPSByZWZbMV07XG4gICAgICBJID0gZnVuY3Rpb24odCkge1xuICAgICAgICB2YXIgaSwgbGFiO1xuICAgICAgICBsYWIgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIG8sIHJlc3VsdHM7XG4gICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IG8gPSAwOyBvIDw9IDI7IGkgPSArK28pIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChsYWIwW2ldICsgdCAqIChsYWIxW2ldIC0gbGFiMFtpXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfSkoKTtcbiAgICAgICAgcmV0dXJuIGNocm9tYS5sYWIuYXBwbHkoY2hyb21hLCBsYWIpO1xuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGNvbG9ycy5sZW5ndGggPT09IDMpIHtcbiAgICAgIHJlZjEgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsZW4sIG8sIHJlc3VsdHM7XG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChvID0gMCwgbGVuID0gY29sb3JzLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICAgICAgYyA9IGNvbG9yc1tvXTtcbiAgICAgICAgICByZXN1bHRzLnB1c2goYy5sYWIoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICB9KSgpLCBsYWIwID0gcmVmMVswXSwgbGFiMSA9IHJlZjFbMV0sIGxhYjIgPSByZWYxWzJdO1xuICAgICAgSSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdmFyIGksIGxhYjtcbiAgICAgICAgbGFiID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBvLCByZXN1bHRzO1xuICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKGkgPSBvID0gMDsgbyA8PSAyOyBpID0gKytvKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goKDEgLSB0KSAqICgxIC0gdCkgKiBsYWIwW2ldICsgMiAqICgxIC0gdCkgKiB0ICogbGFiMVtpXSArIHQgKiB0ICogbGFiMltpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICB9KSgpO1xuICAgICAgICByZXR1cm4gY2hyb21hLmxhYi5hcHBseShjaHJvbWEsIGxhYik7XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAoY29sb3JzLmxlbmd0aCA9PT0gNCkge1xuICAgICAgcmVmMiA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxlbiwgbywgcmVzdWx0cztcbiAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKG8gPSAwLCBsZW4gPSBjb2xvcnMubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcbiAgICAgICAgICBjID0gY29sb3JzW29dO1xuICAgICAgICAgIHJlc3VsdHMucHVzaChjLmxhYigpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgIH0pKCksIGxhYjAgPSByZWYyWzBdLCBsYWIxID0gcmVmMlsxXSwgbGFiMiA9IHJlZjJbMl0sIGxhYjMgPSByZWYyWzNdO1xuICAgICAgSSA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgdmFyIGksIGxhYjtcbiAgICAgICAgbGFiID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBvLCByZXN1bHRzO1xuICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKGkgPSBvID0gMDsgbyA8PSAyOyBpID0gKytvKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goKDEgLSB0KSAqICgxIC0gdCkgKiAoMSAtIHQpICogbGFiMFtpXSArIDMgKiAoMSAtIHQpICogKDEgLSB0KSAqIHQgKiBsYWIxW2ldICsgMyAqICgxIC0gdCkgKiB0ICogdCAqIGxhYjJbaV0gKyB0ICogdCAqIHQgKiBsYWIzW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIHJldHVybiBjaHJvbWEubGFiLmFwcGx5KGNocm9tYSwgbGFiKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChjb2xvcnMubGVuZ3RoID09PSA1KSB7XG4gICAgICBJMCA9IGJlemllcihjb2xvcnMuc2xpY2UoMCwgMykpO1xuICAgICAgSTEgPSBiZXppZXIoY29sb3JzLnNsaWNlKDIsIDUpKTtcbiAgICAgIEkgPSBmdW5jdGlvbih0KSB7XG4gICAgICAgIGlmICh0IDwgMC41KSB7XG4gICAgICAgICAgcmV0dXJuIEkwKHQgKiAyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gSTEoKHQgLSAwLjUpICogMik7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBJO1xuICB9O1xuXG4gIGNocm9tYS5iZXppZXIgPSBmdW5jdGlvbihjb2xvcnMpIHtcbiAgICB2YXIgZjtcbiAgICBmID0gYmV6aWVyKGNvbG9ycyk7XG4gICAgZi5zY2FsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNocm9tYS5zY2FsZShmKTtcbiAgICB9O1xuICAgIHJldHVybiBmO1xuICB9O1xuXG5cbiAgLypcbiAgICAgIGNocm9tYS5qc1xuICBcbiAgICAgIENvcHlyaWdodCAoYykgMjAxMS0yMDEzLCBHcmVnb3IgQWlzY2hcbiAgICAgIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gIFxuICAgICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gICAgICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAgXG4gICAgICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICAgICAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgXG4gICAgICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAgICAgICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICAgICAgICBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAgXG4gICAgICAqIFRoZSBuYW1lIEdyZWdvciBBaXNjaCBtYXkgbm90IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzXG4gICAgICAgIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICBcbiAgICAgIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gICAgICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gICAgICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAgICAgIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIEdSRUdPUiBBSVNDSCBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICAgICAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsXG4gICAgICBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuICAgICAgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWVxuICAgICAgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkdcbiAgICAgIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSxcbiAgICAgIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gIFxuICAgICAgQHNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL2drYS9jaHJvbWEuanNcbiAgICovXG5cbiAgY2hyb21hLmN1YmVoZWxpeCA9IGZ1bmN0aW9uKHN0YXJ0LCByb3RhdGlvbnMsIGh1ZSwgZ2FtbWEsIGxpZ2h0bmVzcykge1xuICAgIHZhciBkaCwgZGwsIGY7XG4gICAgaWYgKHN0YXJ0ID09IG51bGwpIHtcbiAgICAgIHN0YXJ0ID0gMzAwO1xuICAgIH1cbiAgICBpZiAocm90YXRpb25zID09IG51bGwpIHtcbiAgICAgIHJvdGF0aW9ucyA9IC0xLjU7XG4gICAgfVxuICAgIGlmIChodWUgPT0gbnVsbCkge1xuICAgICAgaHVlID0gMTtcbiAgICB9XG4gICAgaWYgKGdhbW1hID09IG51bGwpIHtcbiAgICAgIGdhbW1hID0gMTtcbiAgICB9XG4gICAgaWYgKGxpZ2h0bmVzcyA9PSBudWxsKSB7XG4gICAgICBsaWdodG5lc3MgPSBbMCwgMV07XG4gICAgfVxuICAgIGRsID0gbGlnaHRuZXNzWzFdIC0gbGlnaHRuZXNzWzBdO1xuICAgIGRoID0gMDtcbiAgICBmID0gZnVuY3Rpb24oZnJhY3QpIHtcbiAgICAgIHZhciBhLCBhbXAsIGIsIGNvc19hLCBnLCBoLCBsLCByLCBzaW5fYTtcbiAgICAgIGEgPSBUV09QSSAqICgoc3RhcnQgKyAxMjApIC8gMzYwICsgcm90YXRpb25zICogZnJhY3QpO1xuICAgICAgbCA9IHBvdyhsaWdodG5lc3NbMF0gKyBkbCAqIGZyYWN0LCBnYW1tYSk7XG4gICAgICBoID0gZGggIT09IDAgPyBodWVbMF0gKyBmcmFjdCAqIGRoIDogaHVlO1xuICAgICAgYW1wID0gaCAqIGwgKiAoMSAtIGwpIC8gMjtcbiAgICAgIGNvc19hID0gY29zKGEpO1xuICAgICAgc2luX2EgPSBzaW4oYSk7XG4gICAgICByID0gbCArIGFtcCAqICgtMC4xNDg2MSAqIGNvc19hICsgMS43ODI3NyAqIHNpbl9hKTtcbiAgICAgIGcgPSBsICsgYW1wICogKC0wLjI5MjI3ICogY29zX2EgLSAwLjkwNjQ5ICogc2luX2EpO1xuICAgICAgYiA9IGwgKyBhbXAgKiAoKzEuOTcyOTQgKiBjb3NfYSk7XG4gICAgICByZXR1cm4gY2hyb21hKGNsaXBfcmdiKFtyICogMjU1LCBnICogMjU1LCBiICogMjU1XSkpO1xuICAgIH07XG4gICAgZi5zdGFydCA9IGZ1bmN0aW9uKHMpIHtcbiAgICAgIGlmIChzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHN0YXJ0O1xuICAgICAgfVxuICAgICAgc3RhcnQgPSBzO1xuICAgICAgcmV0dXJuIGY7XG4gICAgfTtcbiAgICBmLnJvdGF0aW9ucyA9IGZ1bmN0aW9uKHIpIHtcbiAgICAgIGlmIChyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJvdGF0aW9ucztcbiAgICAgIH1cbiAgICAgIHJvdGF0aW9ucyA9IHI7XG4gICAgICByZXR1cm4gZjtcbiAgICB9O1xuICAgIGYuZ2FtbWEgPSBmdW5jdGlvbihnKSB7XG4gICAgICBpZiAoZyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBnYW1tYTtcbiAgICAgIH1cbiAgICAgIGdhbW1hID0gZztcbiAgICAgIHJldHVybiBmO1xuICAgIH07XG4gICAgZi5odWUgPSBmdW5jdGlvbihoKSB7XG4gICAgICBpZiAoaCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBodWU7XG4gICAgICB9XG4gICAgICBodWUgPSBoO1xuICAgICAgaWYgKHR5cGUoaHVlKSA9PT0gJ2FycmF5Jykge1xuICAgICAgICBkaCA9IGh1ZVsxXSAtIGh1ZVswXTtcbiAgICAgICAgaWYgKGRoID09PSAwKSB7XG4gICAgICAgICAgaHVlID0gaHVlWzFdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaCA9IDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gZjtcbiAgICB9O1xuICAgIGYubGlnaHRuZXNzID0gZnVuY3Rpb24oaCkge1xuICAgICAgaWYgKGggPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbGlnaHRuZXNzO1xuICAgICAgfVxuICAgICAgbGlnaHRuZXNzID0gaDtcbiAgICAgIGlmICh0eXBlKGxpZ2h0bmVzcykgPT09ICdhcnJheScpIHtcbiAgICAgICAgZGwgPSBsaWdodG5lc3NbMV0gLSBsaWdodG5lc3NbMF07XG4gICAgICAgIGlmIChkbCA9PT0gMCkge1xuICAgICAgICAgIGxpZ2h0bmVzcyA9IGxpZ2h0bmVzc1sxXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGwgPSAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGY7XG4gICAgfTtcbiAgICBmLnNjYWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY2hyb21hLnNjYWxlKGYpO1xuICAgIH07XG4gICAgZi5odWUoaHVlKTtcbiAgICByZXR1cm4gZjtcbiAgfTtcblxuICBjaHJvbWEucmFuZG9tID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvZGUsIGRpZ2l0cywgaSwgbztcbiAgICBkaWdpdHMgPSAnMDEyMzQ1Njc4OWFiY2RlZic7XG4gICAgY29kZSA9ICcjJztcbiAgICBmb3IgKGkgPSBvID0gMDsgbyA8IDY7IGkgPSArK28pIHtcbiAgICAgIGNvZGUgKz0gZGlnaXRzLmNoYXJBdChmbG9vcihNYXRoLnJhbmRvbSgpICogMTYpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb2xvcihjb2RlKTtcbiAgfTtcblxuICBfaW5wdXQucmdiID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGssIHJlZiwgcmVzdWx0cywgdjtcbiAgICByZWYgPSB1bnBhY2soYXJndW1lbnRzKTtcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChrIGluIHJlZikge1xuICAgICAgdiA9IHJlZltrXTtcbiAgICAgIHJlc3VsdHMucHVzaCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgY2hyb21hLnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoQ29sb3IsIHNsaWNlLmNhbGwoYXJndW1lbnRzKS5jb25jYXQoWydyZ2InXSksIGZ1bmN0aW9uKCl7fSk7XG4gIH07XG5cbiAgQ29sb3IucHJvdG90eXBlLnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9yZ2Iuc2xpY2UoMCwgMyk7XG4gIH07XG5cbiAgQ29sb3IucHJvdG90eXBlLnJnYmEgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmdiO1xuICB9O1xuXG4gIF9ndWVzc19mb3JtYXRzLnB1c2goe1xuICAgIHA6IDE1LFxuICAgIHRlc3Q6IGZ1bmN0aW9uKG4pIHtcbiAgICAgIHZhciBhO1xuICAgICAgYSA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgICAgaWYgKHR5cGUoYSkgPT09ICdhcnJheScgJiYgYS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgcmV0dXJuICdyZ2InO1xuICAgICAgfVxuICAgICAgaWYgKGEubGVuZ3RoID09PSA0ICYmIHR5cGUoYVszXSkgPT09IFwibnVtYmVyXCIgJiYgYVszXSA+PSAwICYmIGFbM10gPD0gMSkge1xuICAgICAgICByZXR1cm4gJ3JnYic7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBoZXgycmdiID0gZnVuY3Rpb24oaGV4KSB7XG4gICAgdmFyIGEsIGIsIGcsIHIsIHJnYiwgdTtcbiAgICBpZiAoaGV4Lm1hdGNoKC9eIz8oW0EtRmEtZjAtOV17Nn18W0EtRmEtZjAtOV17M30pJC8pKSB7XG4gICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gNCB8fCBoZXgubGVuZ3RoID09PSA3KSB7XG4gICAgICAgIGhleCA9IGhleC5zdWJzdHIoMSk7XG4gICAgICB9XG4gICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gMykge1xuICAgICAgICBoZXggPSBoZXguc3BsaXQoXCJcIik7XG4gICAgICAgIGhleCA9IGhleFswXSArIGhleFswXSArIGhleFsxXSArIGhleFsxXSArIGhleFsyXSArIGhleFsyXTtcbiAgICAgIH1cbiAgICAgIHUgPSBwYXJzZUludChoZXgsIDE2KTtcbiAgICAgIHIgPSB1ID4+IDE2O1xuICAgICAgZyA9IHUgPj4gOCAmIDB4RkY7XG4gICAgICBiID0gdSAmIDB4RkY7XG4gICAgICByZXR1cm4gW3IsIGcsIGIsIDFdO1xuICAgIH1cbiAgICBpZiAoaGV4Lm1hdGNoKC9eIz8oW0EtRmEtZjAtOV17OH0pJC8pKSB7XG4gICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gOSkge1xuICAgICAgICBoZXggPSBoZXguc3Vic3RyKDEpO1xuICAgICAgfVxuICAgICAgdSA9IHBhcnNlSW50KGhleCwgMTYpO1xuICAgICAgciA9IHUgPj4gMjQgJiAweEZGO1xuICAgICAgZyA9IHUgPj4gMTYgJiAweEZGO1xuICAgICAgYiA9IHUgPj4gOCAmIDB4RkY7XG4gICAgICBhID0gcm91bmQoKHUgJiAweEZGKSAvIDB4RkYgKiAxMDApIC8gMTAwO1xuICAgICAgcmV0dXJuIFtyLCBnLCBiLCBhXTtcbiAgICB9XG4gICAgaWYgKChfaW5wdXQuY3NzICE9IG51bGwpICYmIChyZ2IgPSBfaW5wdXQuY3NzKGhleCkpKSB7XG4gICAgICByZXR1cm4gcmdiO1xuICAgIH1cbiAgICB0aHJvdyBcInVua25vd24gY29sb3I6IFwiICsgaGV4O1xuICB9O1xuXG4gIHJnYjJoZXggPSBmdW5jdGlvbihjaGFubmVscywgbW9kZSkge1xuICAgIHZhciBhLCBiLCBnLCBoeGEsIHIsIHN0ciwgdTtcbiAgICBpZiAobW9kZSA9PSBudWxsKSB7XG4gICAgICBtb2RlID0gJ3JnYic7XG4gICAgfVxuICAgIHIgPSBjaGFubmVsc1swXSwgZyA9IGNoYW5uZWxzWzFdLCBiID0gY2hhbm5lbHNbMl0sIGEgPSBjaGFubmVsc1szXTtcbiAgICB1ID0gciA8PCAxNiB8IGcgPDwgOCB8IGI7XG4gICAgc3RyID0gXCIwMDAwMDBcIiArIHUudG9TdHJpbmcoMTYpO1xuICAgIHN0ciA9IHN0ci5zdWJzdHIoc3RyLmxlbmd0aCAtIDYpO1xuICAgIGh4YSA9ICcwJyArIHJvdW5kKGEgKiAyNTUpLnRvU3RyaW5nKDE2KTtcbiAgICBoeGEgPSBoeGEuc3Vic3RyKGh4YS5sZW5ndGggLSAyKTtcbiAgICByZXR1cm4gXCIjXCIgKyAoZnVuY3Rpb24oKSB7XG4gICAgICBzd2l0Y2ggKG1vZGUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICdyZ2JhJzpcbiAgICAgICAgICByZXR1cm4gc3RyICsgaHhhO1xuICAgICAgICBjYXNlICdhcmdiJzpcbiAgICAgICAgICByZXR1cm4gaHhhICsgc3RyO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgfTtcblxuICBfaW5wdXQuaGV4ID0gZnVuY3Rpb24oaCkge1xuICAgIHJldHVybiBoZXgycmdiKGgpO1xuICB9O1xuXG4gIGNocm9tYS5oZXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xuICAgIH0pKENvbG9yLCBzbGljZS5jYWxsKGFyZ3VtZW50cykuY29uY2F0KFsnaGV4J10pLCBmdW5jdGlvbigpe30pO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5oZXggPSBmdW5jdGlvbihtb2RlKSB7XG4gICAgaWYgKG1vZGUgPT0gbnVsbCkge1xuICAgICAgbW9kZSA9ICdyZ2InO1xuICAgIH1cbiAgICByZXR1cm4gcmdiMmhleCh0aGlzLl9yZ2IsIG1vZGUpO1xuICB9O1xuXG4gIF9ndWVzc19mb3JtYXRzLnB1c2goe1xuICAgIHA6IDEwLFxuICAgIHRlc3Q6IGZ1bmN0aW9uKG4pIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGUobikgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuICdoZXgnO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgaHNsMnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBiLCBjLCBnLCBoLCBpLCBsLCBvLCByLCByZWYsIHMsIHQxLCB0MiwgdDM7XG4gICAgYXJncyA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgIGggPSBhcmdzWzBdLCBzID0gYXJnc1sxXSwgbCA9IGFyZ3NbMl07XG4gICAgaWYgKHMgPT09IDApIHtcbiAgICAgIHIgPSBnID0gYiA9IGwgKiAyNTU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHQzID0gWzAsIDAsIDBdO1xuICAgICAgYyA9IFswLCAwLCAwXTtcbiAgICAgIHQyID0gbCA8IDAuNSA/IGwgKiAoMSArIHMpIDogbCArIHMgLSBsICogcztcbiAgICAgIHQxID0gMiAqIGwgLSB0MjtcbiAgICAgIGggLz0gMzYwO1xuICAgICAgdDNbMF0gPSBoICsgMSAvIDM7XG4gICAgICB0M1sxXSA9IGg7XG4gICAgICB0M1syXSA9IGggLSAxIC8gMztcbiAgICAgIGZvciAoaSA9IG8gPSAwOyBvIDw9IDI7IGkgPSArK28pIHtcbiAgICAgICAgaWYgKHQzW2ldIDwgMCkge1xuICAgICAgICAgIHQzW2ldICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHQzW2ldID4gMSkge1xuICAgICAgICAgIHQzW2ldIC09IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKDYgKiB0M1tpXSA8IDEpIHtcbiAgICAgICAgICBjW2ldID0gdDEgKyAodDIgLSB0MSkgKiA2ICogdDNbaV07XG4gICAgICAgIH0gZWxzZSBpZiAoMiAqIHQzW2ldIDwgMSkge1xuICAgICAgICAgIGNbaV0gPSB0MjtcbiAgICAgICAgfSBlbHNlIGlmICgzICogdDNbaV0gPCAyKSB7XG4gICAgICAgICAgY1tpXSA9IHQxICsgKHQyIC0gdDEpICogKCgyIC8gMykgLSB0M1tpXSkgKiA2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNbaV0gPSB0MTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVmID0gW3JvdW5kKGNbMF0gKiAyNTUpLCByb3VuZChjWzFdICogMjU1KSwgcm91bmQoY1syXSAqIDI1NSldLCByID0gcmVmWzBdLCBnID0gcmVmWzFdLCBiID0gcmVmWzJdO1xuICAgIH1cbiAgICBpZiAoYXJncy5sZW5ndGggPiAzKSB7XG4gICAgICByZXR1cm4gW3IsIGcsIGIsIGFyZ3NbM11dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW3IsIGcsIGJdO1xuICAgIH1cbiAgfTtcblxuICByZ2IyaHNsID0gZnVuY3Rpb24ociwgZywgYikge1xuICAgIHZhciBoLCBsLCBtaW4sIHJlZiwgcztcbiAgICBpZiAociAhPT0gdm9pZCAwICYmIHIubGVuZ3RoID49IDMpIHtcbiAgICAgIHJlZiA9IHIsIHIgPSByZWZbMF0sIGcgPSByZWZbMV0sIGIgPSByZWZbMl07XG4gICAgfVxuICAgIHIgLz0gMjU1O1xuICAgIGcgLz0gMjU1O1xuICAgIGIgLz0gMjU1O1xuICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIGwgPSAobWF4ICsgbWluKSAvIDI7XG4gICAgaWYgKG1heCA9PT0gbWluKSB7XG4gICAgICBzID0gMDtcbiAgICAgIGggPSBOdW1iZXIuTmFOO1xuICAgIH0gZWxzZSB7XG4gICAgICBzID0gbCA8IDAuNSA/IChtYXggLSBtaW4pIC8gKG1heCArIG1pbikgOiAobWF4IC0gbWluKSAvICgyIC0gbWF4IC0gbWluKTtcbiAgICB9XG4gICAgaWYgKHIgPT09IG1heCkge1xuICAgICAgaCA9IChnIC0gYikgLyAobWF4IC0gbWluKTtcbiAgICB9IGVsc2UgaWYgKGcgPT09IG1heCkge1xuICAgICAgaCA9IDIgKyAoYiAtIHIpIC8gKG1heCAtIG1pbik7XG4gICAgfSBlbHNlIGlmIChiID09PSBtYXgpIHtcbiAgICAgIGggPSA0ICsgKHIgLSBnKSAvIChtYXggLSBtaW4pO1xuICAgIH1cbiAgICBoICo9IDYwO1xuICAgIGlmIChoIDwgMCkge1xuICAgICAgaCArPSAzNjA7XG4gICAgfVxuICAgIHJldHVybiBbaCwgcywgbF07XG4gIH07XG5cbiAgY2hyb21hLmhzbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoQ29sb3IsIHNsaWNlLmNhbGwoYXJndW1lbnRzKS5jb25jYXQoWydoc2wnXSksIGZ1bmN0aW9uKCl7fSk7XG4gIH07XG5cbiAgX2lucHV0LmhzbCA9IGhzbDJyZ2I7XG5cbiAgQ29sb3IucHJvdG90eXBlLmhzbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiByZ2IyaHNsKHRoaXMuX3JnYik7XG4gIH07XG5cbiAgaHN2MnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzLCBiLCBmLCBnLCBoLCBpLCBwLCBxLCByLCByZWYsIHJlZjEsIHJlZjIsIHJlZjMsIHJlZjQsIHJlZjUsIHMsIHQsIHY7XG4gICAgYXJncyA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgIGggPSBhcmdzWzBdLCBzID0gYXJnc1sxXSwgdiA9IGFyZ3NbMl07XG4gICAgdiAqPSAyNTU7XG4gICAgaWYgKHMgPT09IDApIHtcbiAgICAgIHIgPSBnID0gYiA9IHY7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoID09PSAzNjApIHtcbiAgICAgICAgaCA9IDA7XG4gICAgICB9XG4gICAgICBpZiAoaCA+IDM2MCkge1xuICAgICAgICBoIC09IDM2MDtcbiAgICAgIH1cbiAgICAgIGlmIChoIDwgMCkge1xuICAgICAgICBoICs9IDM2MDtcbiAgICAgIH1cbiAgICAgIGggLz0gNjA7XG4gICAgICBpID0gZmxvb3IoaCk7XG4gICAgICBmID0gaCAtIGk7XG4gICAgICBwID0gdiAqICgxIC0gcyk7XG4gICAgICBxID0gdiAqICgxIC0gcyAqIGYpO1xuICAgICAgdCA9IHYgKiAoMSAtIHMgKiAoMSAtIGYpKTtcbiAgICAgIHN3aXRjaCAoaSkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgcmVmID0gW3YsIHQsIHBdLCByID0gcmVmWzBdLCBnID0gcmVmWzFdLCBiID0gcmVmWzJdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgcmVmMSA9IFtxLCB2LCBwXSwgciA9IHJlZjFbMF0sIGcgPSByZWYxWzFdLCBiID0gcmVmMVsyXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHJlZjIgPSBbcCwgdiwgdF0sIHIgPSByZWYyWzBdLCBnID0gcmVmMlsxXSwgYiA9IHJlZjJbMl07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICByZWYzID0gW3AsIHEsIHZdLCByID0gcmVmM1swXSwgZyA9IHJlZjNbMV0sIGIgPSByZWYzWzJdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgcmVmNCA9IFt0LCBwLCB2XSwgciA9IHJlZjRbMF0sIGcgPSByZWY0WzFdLCBiID0gcmVmNFsyXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIHJlZjUgPSBbdiwgcCwgcV0sIHIgPSByZWY1WzBdLCBnID0gcmVmNVsxXSwgYiA9IHJlZjVbMl07XG4gICAgICB9XG4gICAgfVxuICAgIHIgPSByb3VuZChyKTtcbiAgICBnID0gcm91bmQoZyk7XG4gICAgYiA9IHJvdW5kKGIpO1xuICAgIHJldHVybiBbciwgZywgYiwgYXJncy5sZW5ndGggPiAzID8gYXJnc1szXSA6IDFdO1xuICB9O1xuXG4gIHJnYjJoc3YgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYiwgZGVsdGEsIGcsIGgsIG1pbiwgciwgcmVmLCBzLCB2O1xuICAgIHJlZiA9IHVucGFjayhhcmd1bWVudHMpLCByID0gcmVmWzBdLCBnID0gcmVmWzFdLCBiID0gcmVmWzJdO1xuICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIGRlbHRhID0gbWF4IC0gbWluO1xuICAgIHYgPSBtYXggLyAyNTUuMDtcbiAgICBpZiAobWF4ID09PSAwKSB7XG4gICAgICBoID0gTnVtYmVyLk5hTjtcbiAgICAgIHMgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBzID0gZGVsdGEgLyBtYXg7XG4gICAgICBpZiAociA9PT0gbWF4KSB7XG4gICAgICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7XG4gICAgICB9XG4gICAgICBpZiAoZyA9PT0gbWF4KSB7XG4gICAgICAgIGggPSAyICsgKGIgLSByKSAvIGRlbHRhO1xuICAgICAgfVxuICAgICAgaWYgKGIgPT09IG1heCkge1xuICAgICAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcbiAgICAgIH1cbiAgICAgIGggKj0gNjA7XG4gICAgICBpZiAoaCA8IDApIHtcbiAgICAgICAgaCArPSAzNjA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbaCwgcywgdl07XG4gIH07XG5cbiAgY2hyb21hLmhzdiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoQ29sb3IsIHNsaWNlLmNhbGwoYXJndW1lbnRzKS5jb25jYXQoWydoc3YnXSksIGZ1bmN0aW9uKCl7fSk7XG4gIH07XG5cbiAgX2lucHV0LmhzdiA9IGhzdjJyZ2I7XG5cbiAgQ29sb3IucHJvdG90eXBlLmhzdiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiByZ2IyaHN2KHRoaXMuX3JnYik7XG4gIH07XG5cbiAgbnVtMnJnYiA9IGZ1bmN0aW9uKG51bSkge1xuICAgIHZhciBiLCBnLCByO1xuICAgIGlmICh0eXBlKG51bSkgPT09IFwibnVtYmVyXCIgJiYgbnVtID49IDAgJiYgbnVtIDw9IDB4RkZGRkZGKSB7XG4gICAgICByID0gbnVtID4+IDE2O1xuICAgICAgZyA9IChudW0gPj4gOCkgJiAweEZGO1xuICAgICAgYiA9IG51bSAmIDB4RkY7XG4gICAgICByZXR1cm4gW3IsIGcsIGIsIDFdO1xuICAgIH1cbiAgICBjb25zb2xlLndhcm4oXCJ1bmtub3duIG51bSBjb2xvcjogXCIgKyBudW0pO1xuICAgIHJldHVybiBbMCwgMCwgMCwgMV07XG4gIH07XG5cbiAgcmdiMm51bSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiLCBnLCByLCByZWY7XG4gICAgcmVmID0gdW5wYWNrKGFyZ3VtZW50cyksIHIgPSByZWZbMF0sIGcgPSByZWZbMV0sIGIgPSByZWZbMl07XG4gICAgcmV0dXJuIChyIDw8IDE2KSArIChnIDw8IDgpICsgYjtcbiAgfTtcblxuICBjaHJvbWEubnVtID0gZnVuY3Rpb24obnVtKSB7XG4gICAgcmV0dXJuIG5ldyBDb2xvcihudW0sICdudW0nKTtcbiAgfTtcblxuICBDb2xvci5wcm90b3R5cGUubnVtID0gZnVuY3Rpb24obW9kZSkge1xuICAgIGlmIChtb2RlID09IG51bGwpIHtcbiAgICAgIG1vZGUgPSAncmdiJztcbiAgICB9XG4gICAgcmV0dXJuIHJnYjJudW0odGhpcy5fcmdiLCBtb2RlKTtcbiAgfTtcblxuICBfaW5wdXQubnVtID0gbnVtMnJnYjtcblxuICBfZ3Vlc3NfZm9ybWF0cy5wdXNoKHtcbiAgICBwOiAxMCxcbiAgICB0ZXN0OiBmdW5jdGlvbihuKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB0eXBlKG4pID09PSBcIm51bWJlclwiICYmIG4gPj0gMCAmJiBuIDw9IDB4RkZGRkZGKSB7XG4gICAgICAgIHJldHVybiAnbnVtJztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGNzczJyZ2IgPSBmdW5jdGlvbihjc3MpIHtcbiAgICB2YXIgYWEsIGFiLCBoc2wsIGksIG0sIG8sIHJnYiwgdztcbiAgICBjc3MgPSBjc3MudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoKGNocm9tYS5jb2xvcnMgIT0gbnVsbCkgJiYgY2hyb21hLmNvbG9yc1tjc3NdKSB7XG4gICAgICByZXR1cm4gaGV4MnJnYihjaHJvbWEuY29sb3JzW2Nzc10pO1xuICAgIH1cbiAgICBpZiAobSA9IGNzcy5tYXRjaCgvcmdiXFwoXFxzKihcXC0/XFxkKyksXFxzKihcXC0/XFxkKylcXHMqLFxccyooXFwtP1xcZCspXFxzKlxcKS8pKSB7XG4gICAgICByZ2IgPSBtLnNsaWNlKDEsIDQpO1xuICAgICAgZm9yIChpID0gbyA9IDA7IG8gPD0gMjsgaSA9ICsrbykge1xuICAgICAgICByZ2JbaV0gPSArcmdiW2ldO1xuICAgICAgfVxuICAgICAgcmdiWzNdID0gMTtcbiAgICB9IGVsc2UgaWYgKG0gPSBjc3MubWF0Y2goL3JnYmFcXChcXHMqKFxcLT9cXGQrKSxcXHMqKFxcLT9cXGQrKVxccyosXFxzKihcXC0/XFxkKylcXHMqLFxccyooWzAxXXxbMDFdP1xcLlxcZCspXFwpLykpIHtcbiAgICAgIHJnYiA9IG0uc2xpY2UoMSwgNSk7XG4gICAgICBmb3IgKGkgPSB3ID0gMDsgdyA8PSAzOyBpID0gKyt3KSB7XG4gICAgICAgIHJnYltpXSA9ICtyZ2JbaV07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtID0gY3NzLm1hdGNoKC9yZ2JcXChcXHMqKFxcLT9cXGQrKD86XFwuXFxkKyk/KSUsXFxzKihcXC0/XFxkKyg/OlxcLlxcZCspPyklXFxzKixcXHMqKFxcLT9cXGQrKD86XFwuXFxkKyk/KSVcXHMqXFwpLykpIHtcbiAgICAgIHJnYiA9IG0uc2xpY2UoMSwgNCk7XG4gICAgICBmb3IgKGkgPSBhYSA9IDA7IGFhIDw9IDI7IGkgPSArK2FhKSB7XG4gICAgICAgIHJnYltpXSA9IHJvdW5kKHJnYltpXSAqIDIuNTUpO1xuICAgICAgfVxuICAgICAgcmdiWzNdID0gMTtcbiAgICB9IGVsc2UgaWYgKG0gPSBjc3MubWF0Y2goL3JnYmFcXChcXHMqKFxcLT9cXGQrKD86XFwuXFxkKyk/KSUsXFxzKihcXC0/XFxkKyg/OlxcLlxcZCspPyklXFxzKixcXHMqKFxcLT9cXGQrKD86XFwuXFxkKyk/KSVcXHMqLFxccyooWzAxXXxbMDFdP1xcLlxcZCspXFwpLykpIHtcbiAgICAgIHJnYiA9IG0uc2xpY2UoMSwgNSk7XG4gICAgICBmb3IgKGkgPSBhYiA9IDA7IGFiIDw9IDI7IGkgPSArK2FiKSB7XG4gICAgICAgIHJnYltpXSA9IHJvdW5kKHJnYltpXSAqIDIuNTUpO1xuICAgICAgfVxuICAgICAgcmdiWzNdID0gK3JnYlszXTtcbiAgICB9IGVsc2UgaWYgKG0gPSBjc3MubWF0Y2goL2hzbFxcKFxccyooXFwtP1xcZCsoPzpcXC5cXGQrKT8pLFxccyooXFwtP1xcZCsoPzpcXC5cXGQrKT8pJVxccyosXFxzKihcXC0/XFxkKyg/OlxcLlxcZCspPyklXFxzKlxcKS8pKSB7XG4gICAgICBoc2wgPSBtLnNsaWNlKDEsIDQpO1xuICAgICAgaHNsWzFdICo9IDAuMDE7XG4gICAgICBoc2xbMl0gKj0gMC4wMTtcbiAgICAgIHJnYiA9IGhzbDJyZ2IoaHNsKTtcbiAgICAgIHJnYlszXSA9IDE7XG4gICAgfSBlbHNlIGlmIChtID0gY3NzLm1hdGNoKC9oc2xhXFwoXFxzKihcXC0/XFxkKyg/OlxcLlxcZCspPyksXFxzKihcXC0/XFxkKyg/OlxcLlxcZCspPyklXFxzKixcXHMqKFxcLT9cXGQrKD86XFwuXFxkKyk/KSVcXHMqLFxccyooWzAxXXxbMDFdP1xcLlxcZCspXFwpLykpIHtcbiAgICAgIGhzbCA9IG0uc2xpY2UoMSwgNCk7XG4gICAgICBoc2xbMV0gKj0gMC4wMTtcbiAgICAgIGhzbFsyXSAqPSAwLjAxO1xuICAgICAgcmdiID0gaHNsMnJnYihoc2wpO1xuICAgICAgcmdiWzNdID0gK21bNF07XG4gICAgfVxuICAgIHJldHVybiByZ2I7XG4gIH07XG5cbiAgcmdiMmNzcyA9IGZ1bmN0aW9uKHJnYmEpIHtcbiAgICB2YXIgbW9kZTtcbiAgICBtb2RlID0gcmdiYVszXSA8IDEgPyAncmdiYScgOiAncmdiJztcbiAgICBpZiAobW9kZSA9PT0gJ3JnYicpIHtcbiAgICAgIHJldHVybiBtb2RlICsgJygnICsgcmdiYS5zbGljZSgwLCAzKS5tYXAocm91bmQpLmpvaW4oJywnKSArICcpJztcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09ICdyZ2JhJykge1xuICAgICAgcmV0dXJuIG1vZGUgKyAnKCcgKyByZ2JhLnNsaWNlKDAsIDMpLm1hcChyb3VuZCkuam9pbignLCcpICsgJywnICsgcmdiYVszXSArICcpJztcbiAgICB9IGVsc2Uge1xuXG4gICAgfVxuICB9O1xuXG4gIHJuZCA9IGZ1bmN0aW9uKGEpIHtcbiAgICByZXR1cm4gcm91bmQoYSAqIDEwMCkgLyAxMDA7XG4gIH07XG5cbiAgaHNsMmNzcyA9IGZ1bmN0aW9uKGhzbCwgYWxwaGEpIHtcbiAgICB2YXIgbW9kZTtcbiAgICBtb2RlID0gYWxwaGEgPCAxID8gJ2hzbGEnIDogJ2hzbCc7XG4gICAgaHNsWzBdID0gcm5kKGhzbFswXSB8fCAwKTtcbiAgICBoc2xbMV0gPSBybmQoaHNsWzFdICogMTAwKSArICclJztcbiAgICBoc2xbMl0gPSBybmQoaHNsWzJdICogMTAwKSArICclJztcbiAgICBpZiAobW9kZSA9PT0gJ2hzbGEnKSB7XG4gICAgICBoc2xbM10gPSBhbHBoYTtcbiAgICB9XG4gICAgcmV0dXJuIG1vZGUgKyAnKCcgKyBoc2wuam9pbignLCcpICsgJyknO1xuICB9O1xuXG4gIF9pbnB1dC5jc3MgPSBmdW5jdGlvbihoKSB7XG4gICAgcmV0dXJuIGNzczJyZ2IoaCk7XG4gIH07XG5cbiAgY2hyb21hLmNzcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoQ29sb3IsIHNsaWNlLmNhbGwoYXJndW1lbnRzKS5jb25jYXQoWydjc3MnXSksIGZ1bmN0aW9uKCl7fSk7XG4gIH07XG5cbiAgQ29sb3IucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgICBpZiAobW9kZSA9PSBudWxsKSB7XG4gICAgICBtb2RlID0gJ3JnYic7XG4gICAgfVxuICAgIGlmIChtb2RlLnNsaWNlKDAsIDMpID09PSAncmdiJykge1xuICAgICAgcmV0dXJuIHJnYjJjc3ModGhpcy5fcmdiKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUuc2xpY2UoMCwgMykgPT09ICdoc2wnKSB7XG4gICAgICByZXR1cm4gaHNsMmNzcyh0aGlzLmhzbCgpLCB0aGlzLmFscGhhKCkpO1xuICAgIH1cbiAgfTtcblxuICBfaW5wdXQubmFtZWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIGhleDJyZ2IodzNjeDExW25hbWVdKTtcbiAgfTtcblxuICBfZ3Vlc3NfZm9ybWF0cy5wdXNoKHtcbiAgICBwOiAyMCxcbiAgICB0ZXN0OiBmdW5jdGlvbihuKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiAodzNjeDExW25dICE9IG51bGwpKSB7XG4gICAgICAgIHJldHVybiAnbmFtZWQnO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgQ29sb3IucHJvdG90eXBlLm5hbWUgPSBmdW5jdGlvbihuKSB7XG4gICAgdmFyIGgsIGs7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIGlmICh3M2N4MTFbbl0pIHtcbiAgICAgICAgdGhpcy5fcmdiID0gaGV4MnJnYih3M2N4MTFbbl0pO1xuICAgICAgfVxuICAgICAgdGhpcy5fcmdiWzNdID0gMTtcbiAgICAgIHRoaXM7XG4gICAgfVxuICAgIGggPSB0aGlzLmhleCgpO1xuICAgIGZvciAoayBpbiB3M2N4MTEpIHtcbiAgICAgIGlmIChoID09PSB3M2N4MTFba10pIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoO1xuICB9O1xuXG4gIGxjaDJsYWIgPSBmdW5jdGlvbigpIHtcblxuICAgIC8qXG4gICAgQ29udmVydCBmcm9tIGEgcXVhbGl0YXRpdmUgcGFyYW1ldGVyIGggYW5kIGEgcXVhbnRpdGF0aXZlIHBhcmFtZXRlciBsIHRvIGEgMjQtYml0IHBpeGVsLlxuICAgIFRoZXNlIGZvcm11bGFzIHdlcmUgaW52ZW50ZWQgYnkgRGF2aWQgRGFscnltcGxlIHRvIG9idGFpbiBtYXhpbXVtIGNvbnRyYXN0IHdpdGhvdXQgZ29pbmdcbiAgICBvdXQgb2YgZ2FtdXQgaWYgdGhlIHBhcmFtZXRlcnMgYXJlIGluIHRoZSByYW5nZSAwLTEuXG4gICAgXG4gICAgQSBzYXR1cmF0aW9uIG11bHRpcGxpZXIgd2FzIGFkZGVkIGJ5IEdyZWdvciBBaXNjaFxuICAgICAqL1xuICAgIHZhciBjLCBoLCBsLCByZWY7XG4gICAgcmVmID0gdW5wYWNrKGFyZ3VtZW50cyksIGwgPSByZWZbMF0sIGMgPSByZWZbMV0sIGggPSByZWZbMl07XG4gICAgaCA9IGggKiBERUcyUkFEO1xuICAgIHJldHVybiBbbCwgY29zKGgpICogYywgc2luKGgpICogY107XG4gIH07XG5cbiAgbGNoMnJnYiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBMLCBhLCBhcmdzLCBiLCBjLCBnLCBoLCBsLCByLCByZWYsIHJlZjE7XG4gICAgYXJncyA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgIGwgPSBhcmdzWzBdLCBjID0gYXJnc1sxXSwgaCA9IGFyZ3NbMl07XG4gICAgcmVmID0gbGNoMmxhYihsLCBjLCBoKSwgTCA9IHJlZlswXSwgYSA9IHJlZlsxXSwgYiA9IHJlZlsyXTtcbiAgICByZWYxID0gbGFiMnJnYihMLCBhLCBiKSwgciA9IHJlZjFbMF0sIGcgPSByZWYxWzFdLCBiID0gcmVmMVsyXTtcbiAgICByZXR1cm4gW2xpbWl0KHIsIDAsIDI1NSksIGxpbWl0KGcsIDAsIDI1NSksIGxpbWl0KGIsIDAsIDI1NSksIGFyZ3MubGVuZ3RoID4gMyA/IGFyZ3NbM10gOiAxXTtcbiAgfTtcblxuICBsYWIybGNoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGEsIGIsIGMsIGgsIGwsIHJlZjtcbiAgICByZWYgPSB1bnBhY2soYXJndW1lbnRzKSwgbCA9IHJlZlswXSwgYSA9IHJlZlsxXSwgYiA9IHJlZlsyXTtcbiAgICBjID0gc3FydChhICogYSArIGIgKiBiKTtcbiAgICBoID0gKGF0YW4yKGIsIGEpICogUkFEMkRFRyArIDM2MCkgJSAzNjA7XG4gICAgaWYgKHJvdW5kKGMgKiAxMDAwMCkgPT09IDApIHtcbiAgICAgIGggPSBOdW1iZXIuTmFOO1xuICAgIH1cbiAgICByZXR1cm4gW2wsIGMsIGhdO1xuICB9O1xuXG4gIHJnYjJsY2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYSwgYiwgZywgbCwgciwgcmVmLCByZWYxO1xuICAgIHJlZiA9IHVucGFjayhhcmd1bWVudHMpLCByID0gcmVmWzBdLCBnID0gcmVmWzFdLCBiID0gcmVmWzJdO1xuICAgIHJlZjEgPSByZ2IybGFiKHIsIGcsIGIpLCBsID0gcmVmMVswXSwgYSA9IHJlZjFbMV0sIGIgPSByZWYxWzJdO1xuICAgIHJldHVybiBsYWIybGNoKGwsIGEsIGIpO1xuICB9O1xuXG4gIGNocm9tYS5sY2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncztcbiAgICBhcmdzID0gdW5wYWNrKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG5ldyBDb2xvcihhcmdzLCAnbGNoJyk7XG4gIH07XG5cbiAgY2hyb21hLmhjbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzO1xuICAgIGFyZ3MgPSB1bnBhY2soYXJndW1lbnRzKTtcbiAgICByZXR1cm4gbmV3IENvbG9yKGFyZ3MsICdoY2wnKTtcbiAgfTtcblxuICBfaW5wdXQubGNoID0gbGNoMnJnYjtcblxuICBfaW5wdXQuaGNsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGMsIGgsIGwsIHJlZjtcbiAgICByZWYgPSB1bnBhY2soYXJndW1lbnRzKSwgaCA9IHJlZlswXSwgYyA9IHJlZlsxXSwgbCA9IHJlZlsyXTtcbiAgICByZXR1cm4gbGNoMnJnYihbbCwgYywgaF0pO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5sY2ggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcmdiMmxjaCh0aGlzLl9yZ2IpO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5oY2wgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcmdiMmxjaCh0aGlzLl9yZ2IpLnJldmVyc2UoKTtcbiAgfTtcblxuICByZ2IyY215ayA9IGZ1bmN0aW9uKG1vZGUpIHtcbiAgICB2YXIgYiwgYywgZiwgZywgaywgbSwgciwgcmVmLCB5O1xuICAgIGlmIChtb2RlID09IG51bGwpIHtcbiAgICAgIG1vZGUgPSAncmdiJztcbiAgICB9XG4gICAgcmVmID0gdW5wYWNrKGFyZ3VtZW50cyksIHIgPSByZWZbMF0sIGcgPSByZWZbMV0sIGIgPSByZWZbMl07XG4gICAgciA9IHIgLyAyNTU7XG4gICAgZyA9IGcgLyAyNTU7XG4gICAgYiA9IGIgLyAyNTU7XG4gICAgayA9IDEgLSBNYXRoLm1heChyLCBNYXRoLm1heChnLCBiKSk7XG4gICAgZiA9IGsgPCAxID8gMSAvICgxIC0gaykgOiAwO1xuICAgIGMgPSAoMSAtIHIgLSBrKSAqIGY7XG4gICAgbSA9ICgxIC0gZyAtIGspICogZjtcbiAgICB5ID0gKDEgLSBiIC0gaykgKiBmO1xuICAgIHJldHVybiBbYywgbSwgeSwga107XG4gIH07XG5cbiAgY215azJyZ2IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYWxwaGEsIGFyZ3MsIGIsIGMsIGcsIGssIG0sIHIsIHk7XG4gICAgYXJncyA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgIGMgPSBhcmdzWzBdLCBtID0gYXJnc1sxXSwgeSA9IGFyZ3NbMl0sIGsgPSBhcmdzWzNdO1xuICAgIGFscGhhID0gYXJncy5sZW5ndGggPiA0ID8gYXJnc1s0XSA6IDE7XG4gICAgaWYgKGsgPT09IDEpIHtcbiAgICAgIHJldHVybiBbMCwgMCwgMCwgYWxwaGFdO1xuICAgIH1cbiAgICByID0gYyA+PSAxID8gMCA6IHJvdW5kKDI1NSAqICgxIC0gYykgKiAoMSAtIGspKTtcbiAgICBnID0gbSA+PSAxID8gMCA6IHJvdW5kKDI1NSAqICgxIC0gbSkgKiAoMSAtIGspKTtcbiAgICBiID0geSA+PSAxID8gMCA6IHJvdW5kKDI1NSAqICgxIC0geSkgKiAoMSAtIGspKTtcbiAgICByZXR1cm4gW3IsIGcsIGIsIGFscGhhXTtcbiAgfTtcblxuICBfaW5wdXQuY215ayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjbXlrMnJnYih1bnBhY2soYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgY2hyb21hLmNteWsgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xuICAgIH0pKENvbG9yLCBzbGljZS5jYWxsKGFyZ3VtZW50cykuY29uY2F0KFsnY215ayddKSwgZnVuY3Rpb24oKXt9KTtcbiAgfTtcblxuICBDb2xvci5wcm90b3R5cGUuY215ayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiByZ2IyY215ayh0aGlzLl9yZ2IpO1xuICB9O1xuXG4gIF9pbnB1dC5nbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLCBrLCBvLCByZ2IsIHY7XG4gICAgcmdiID0gKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlZiwgcmVzdWx0cztcbiAgICAgIHJlZiA9IHVucGFjayhhcmd1bWVudHMpO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChrIGluIHJlZikge1xuICAgICAgICB2ID0gcmVmW2tdO1xuICAgICAgICByZXN1bHRzLnB1c2godik7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGZvciAoaSA9IG8gPSAwOyBvIDw9IDI7IGkgPSArK28pIHtcbiAgICAgIHJnYltpXSAqPSAyNTU7XG4gICAgfVxuICAgIHJldHVybiByZ2I7XG4gIH07XG5cbiAgY2hyb21hLmdsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcbiAgICB9KShDb2xvciwgc2xpY2UuY2FsbChhcmd1bWVudHMpLmNvbmNhdChbJ2dsJ10pLCBmdW5jdGlvbigpe30pO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5nbCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZ2I7XG4gICAgcmdiID0gdGhpcy5fcmdiO1xuICAgIHJldHVybiBbcmdiWzBdIC8gMjU1LCByZ2JbMV0gLyAyNTUsIHJnYlsyXSAvIDI1NSwgcmdiWzNdXTtcbiAgfTtcblxuICByZ2IybHVtaW5hbmNlID0gZnVuY3Rpb24ociwgZywgYikge1xuICAgIHZhciByZWY7XG4gICAgcmVmID0gdW5wYWNrKGFyZ3VtZW50cyksIHIgPSByZWZbMF0sIGcgPSByZWZbMV0sIGIgPSByZWZbMl07XG4gICAgciA9IGx1bWluYW5jZV94KHIpO1xuICAgIGcgPSBsdW1pbmFuY2VfeChnKTtcbiAgICBiID0gbHVtaW5hbmNlX3goYik7XG4gICAgcmV0dXJuIDAuMjEyNiAqIHIgKyAwLjcxNTIgKiBnICsgMC4wNzIyICogYjtcbiAgfTtcblxuICBsdW1pbmFuY2VfeCA9IGZ1bmN0aW9uKHgpIHtcbiAgICB4IC89IDI1NTtcbiAgICBpZiAoeCA8PSAwLjAzOTI4KSB7XG4gICAgICByZXR1cm4geCAvIDEyLjkyO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcG93KCh4ICsgMC4wNTUpIC8gMS4wNTUsIDIuNCk7XG4gICAgfVxuICB9O1xuXG4gIF9pbnRlcnBvbGF0b3JzID0gW107XG5cbiAgaW50ZXJwb2xhdGUgPSBmdW5jdGlvbihjb2wxLCBjb2wyLCBmLCBtKSB7XG4gICAgdmFyIGludGVycG9sLCBsZW4sIG8sIHJlcztcbiAgICBpZiAoZiA9PSBudWxsKSB7XG4gICAgICBmID0gMC41O1xuICAgIH1cbiAgICBpZiAobSA9PSBudWxsKSB7XG4gICAgICBtID0gJ3JnYic7XG4gICAgfVxuXG4gICAgLypcbiAgICBpbnRlcnBvbGF0ZXMgYmV0d2VlbiBjb2xvcnNcbiAgICBmID0gMCAtLT4gbWVcbiAgICBmID0gMSAtLT4gY29sXG4gICAgICovXG4gICAgaWYgKHR5cGUoY29sMSkgIT09ICdvYmplY3QnKSB7XG4gICAgICBjb2wxID0gY2hyb21hKGNvbDEpO1xuICAgIH1cbiAgICBpZiAodHlwZShjb2wyKSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIGNvbDIgPSBjaHJvbWEoY29sMik7XG4gICAgfVxuICAgIGZvciAobyA9IDAsIGxlbiA9IF9pbnRlcnBvbGF0b3JzLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICBpbnRlcnBvbCA9IF9pbnRlcnBvbGF0b3JzW29dO1xuICAgICAgaWYgKG0gPT09IGludGVycG9sWzBdKSB7XG4gICAgICAgIHJlcyA9IGludGVycG9sWzFdKGNvbDEsIGNvbDIsIGYsIG0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlcyA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBcImNvbG9yIG1vZGUgXCIgKyBtICsgXCIgaXMgbm90IHN1cHBvcnRlZFwiO1xuICAgIH1cbiAgICByZXMuYWxwaGEoY29sMS5hbHBoYSgpICsgZiAqIChjb2wyLmFscGhhKCkgLSBjb2wxLmFscGhhKCkpKTtcbiAgICByZXR1cm4gcmVzO1xuICB9O1xuXG4gIGNocm9tYS5pbnRlcnBvbGF0ZSA9IGludGVycG9sYXRlO1xuXG4gIENvbG9yLnByb3RvdHlwZS5pbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uKGNvbDIsIGYsIG0pIHtcbiAgICByZXR1cm4gaW50ZXJwb2xhdGUodGhpcywgY29sMiwgZiwgbSk7XG4gIH07XG5cbiAgY2hyb21hLm1peCA9IGludGVycG9sYXRlO1xuXG4gIENvbG9yLnByb3RvdHlwZS5taXggPSBDb2xvci5wcm90b3R5cGUuaW50ZXJwb2xhdGU7XG5cbiAgaW50ZXJwb2xhdGVfcmdiID0gZnVuY3Rpb24oY29sMSwgY29sMiwgZiwgbSkge1xuICAgIHZhciB4eXowLCB4eXoxO1xuICAgIHh5ejAgPSBjb2wxLl9yZ2I7XG4gICAgeHl6MSA9IGNvbDIuX3JnYjtcbiAgICByZXR1cm4gbmV3IENvbG9yKHh5ejBbMF0gKyBmICogKHh5ejFbMF0gLSB4eXowWzBdKSwgeHl6MFsxXSArIGYgKiAoeHl6MVsxXSAtIHh5ejBbMV0pLCB4eXowWzJdICsgZiAqICh4eXoxWzJdIC0geHl6MFsyXSksIG0pO1xuICB9O1xuXG4gIF9pbnRlcnBvbGF0b3JzLnB1c2goWydyZ2InLCBpbnRlcnBvbGF0ZV9yZ2JdKTtcblxuICBDb2xvci5wcm90b3R5cGUubHVtaW5hbmNlID0gZnVuY3Rpb24obHVtLCBtb2RlKSB7XG4gICAgdmFyIGN1cl9sdW0sIGVwcywgbWF4X2l0ZXIsIHRlc3Q7XG4gICAgaWYgKG1vZGUgPT0gbnVsbCkge1xuICAgICAgbW9kZSA9ICdyZ2InO1xuICAgIH1cbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiByZ2IybHVtaW5hbmNlKHRoaXMuX3JnYik7XG4gICAgfVxuICAgIGlmIChsdW0gPT09IDApIHtcbiAgICAgIHRoaXMuX3JnYiA9IFswLCAwLCAwLCB0aGlzLl9yZ2JbM11dO1xuICAgIH0gZWxzZSBpZiAobHVtID09PSAxKSB7XG4gICAgICB0aGlzLl9yZ2IgPSBbMjU1LCAyNTUsIDI1NSwgdGhpcy5fcmdiWzNdXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXBzID0gMWUtNztcbiAgICAgIG1heF9pdGVyID0gMjA7XG4gICAgICB0ZXN0ID0gZnVuY3Rpb24obCwgaCkge1xuICAgICAgICB2YXIgbG0sIG07XG4gICAgICAgIG0gPSBsLmludGVycG9sYXRlKGgsIDAuNSwgbW9kZSk7XG4gICAgICAgIGxtID0gbS5sdW1pbmFuY2UoKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKGx1bSAtIGxtKSA8IGVwcyB8fCAhbWF4X2l0ZXItLSkge1xuICAgICAgICAgIHJldHVybiBtO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsbSA+IGx1bSkge1xuICAgICAgICAgIHJldHVybiB0ZXN0KGwsIG0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0ZXN0KG0sIGgpO1xuICAgICAgfTtcbiAgICAgIGN1cl9sdW0gPSByZ2IybHVtaW5hbmNlKHRoaXMuX3JnYik7XG4gICAgICB0aGlzLl9yZ2IgPSAoY3VyX2x1bSA+IGx1bSA/IHRlc3QoY2hyb21hKCdibGFjaycpLCB0aGlzKSA6IHRlc3QodGhpcywgY2hyb21hKCd3aGl0ZScpKSkucmdiYSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICB0ZW1wZXJhdHVyZTJyZ2IgPSBmdW5jdGlvbihrZWx2aW4pIHtcbiAgICB2YXIgYiwgZywgciwgdGVtcDtcbiAgICB0ZW1wID0ga2VsdmluIC8gMTAwO1xuICAgIGlmICh0ZW1wIDwgNjYpIHtcbiAgICAgIHIgPSAyNTU7XG4gICAgICBnID0gLTE1NS4yNTQ4NTU2MjcwOTE3OSAtIDAuNDQ1OTY5NTA0Njk1NzkxMzMgKiAoZyA9IHRlbXAgLSAyKSArIDEwNC40OTIxNjE5OTM5Mzg4OCAqIGxvZyhnKTtcbiAgICAgIGIgPSB0ZW1wIDwgMjAgPyAwIDogLTI1NC43NjkzNTE4NDEyMDkwMiArIDAuODI3NDA5NjA2NDAwNzM5NSAqIChiID0gdGVtcCAtIDEwKSArIDExNS42Nzk5NDQwMTA2NjE0NyAqIGxvZyhiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgciA9IDM1MS45NzY5MDU2NjgwNTY5MyArIDAuMTE0MjA2NDUzNzg0MTY1ICogKHIgPSB0ZW1wIC0gNTUpIC0gNDAuMjUzNjYzMDkzMzIxMjcgKiBsb2cocik7XG4gICAgICBnID0gMzI1LjQ0OTQxMjU3MTE5NzQgKyAwLjA3OTQzNDU2NTM2NjYyMzQyICogKGcgPSB0ZW1wIC0gNTApIC0gMjguMDg1Mjk2MzUwNzk1NyAqIGxvZyhnKTtcbiAgICAgIGIgPSAyNTU7XG4gICAgfVxuICAgIHJldHVybiBjbGlwX3JnYihbciwgZywgYl0pO1xuICB9O1xuXG4gIHJnYjJ0ZW1wZXJhdHVyZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBiLCBlcHMsIGcsIG1heFRlbXAsIG1pblRlbXAsIHIsIHJlZiwgcmdiLCB0ZW1wO1xuICAgIHJlZiA9IHVucGFjayhhcmd1bWVudHMpLCByID0gcmVmWzBdLCBnID0gcmVmWzFdLCBiID0gcmVmWzJdO1xuICAgIG1pblRlbXAgPSAxMDAwO1xuICAgIG1heFRlbXAgPSA0MDAwMDtcbiAgICBlcHMgPSAwLjQ7XG4gICAgd2hpbGUgKG1heFRlbXAgLSBtaW5UZW1wID4gZXBzKSB7XG4gICAgICB0ZW1wID0gKG1heFRlbXAgKyBtaW5UZW1wKSAqIDAuNTtcbiAgICAgIHJnYiA9IHRlbXBlcmF0dXJlMnJnYih0ZW1wKTtcbiAgICAgIGlmICgocmdiWzJdIC8gcmdiWzBdKSA+PSAoYiAvIHIpKSB7XG4gICAgICAgIG1heFRlbXAgPSB0ZW1wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWluVGVtcCA9IHRlbXA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByb3VuZCh0ZW1wKTtcbiAgfTtcblxuICBjaHJvbWEudGVtcGVyYXR1cmUgPSBjaHJvbWEua2VsdmluID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbihmdW5jLCBhcmdzLCBjdG9yKSB7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIGNoaWxkID0gbmV3IGN0b3IsIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY2hpbGQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIE9iamVjdChyZXN1bHQpID09PSByZXN1bHQgPyByZXN1bHQgOiBjaGlsZDtcbiAgICB9KShDb2xvciwgc2xpY2UuY2FsbChhcmd1bWVudHMpLmNvbmNhdChbJ3RlbXBlcmF0dXJlJ10pLCBmdW5jdGlvbigpe30pO1xuICB9O1xuXG4gIF9pbnB1dC50ZW1wZXJhdHVyZSA9IF9pbnB1dC5rZWx2aW4gPSBfaW5wdXQuSyA9IHRlbXBlcmF0dXJlMnJnYjtcblxuICBDb2xvci5wcm90b3R5cGUudGVtcGVyYXR1cmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcmdiMnRlbXBlcmF0dXJlKHRoaXMuX3JnYik7XG4gIH07XG5cbiAgQ29sb3IucHJvdG90eXBlLmtlbHZpbiA9IENvbG9yLnByb3RvdHlwZS50ZW1wZXJhdHVyZTtcblxuICBjaHJvbWEuY29udHJhc3QgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIGwxLCBsMiwgcmVmLCByZWYxO1xuICAgIGlmICgocmVmID0gdHlwZShhKSkgPT09ICdzdHJpbmcnIHx8IHJlZiA9PT0gJ251bWJlcicpIHtcbiAgICAgIGEgPSBuZXcgQ29sb3IoYSk7XG4gICAgfVxuICAgIGlmICgocmVmMSA9IHR5cGUoYikpID09PSAnc3RyaW5nJyB8fCByZWYxID09PSAnbnVtYmVyJykge1xuICAgICAgYiA9IG5ldyBDb2xvcihiKTtcbiAgICB9XG4gICAgbDEgPSBhLmx1bWluYW5jZSgpO1xuICAgIGwyID0gYi5sdW1pbmFuY2UoKTtcbiAgICBpZiAobDEgPiBsMikge1xuICAgICAgcmV0dXJuIChsMSArIDAuMDUpIC8gKGwyICsgMC4wNSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAobDIgKyAwLjA1KSAvIChsMSArIDAuMDUpO1xuICAgIH1cbiAgfTtcblxuICBDb2xvci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obW9kZWNoYW4pIHtcbiAgICB2YXIgY2hhbm5lbCwgaSwgbWUsIG1vZGUsIHJlZiwgc3JjO1xuICAgIG1lID0gdGhpcztcbiAgICByZWYgPSBtb2RlY2hhbi5zcGxpdCgnLicpLCBtb2RlID0gcmVmWzBdLCBjaGFubmVsID0gcmVmWzFdO1xuICAgIHNyYyA9IG1lW21vZGVdKCk7XG4gICAgaWYgKGNoYW5uZWwpIHtcbiAgICAgIGkgPSBtb2RlLmluZGV4T2YoY2hhbm5lbCk7XG4gICAgICBpZiAoaSA+IC0xKSB7XG4gICAgICAgIHJldHVybiBzcmNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKCd1bmtub3duIGNoYW5uZWwgJyArIGNoYW5uZWwgKyAnIGluIG1vZGUgJyArIG1vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3JjO1xuICAgIH1cbiAgfTtcblxuICBDb2xvci5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obW9kZWNoYW4sIHZhbHVlKSB7XG4gICAgdmFyIGNoYW5uZWwsIGksIG1lLCBtb2RlLCByZWYsIHNyYztcbiAgICBtZSA9IHRoaXM7XG4gICAgcmVmID0gbW9kZWNoYW4uc3BsaXQoJy4nKSwgbW9kZSA9IHJlZlswXSwgY2hhbm5lbCA9IHJlZlsxXTtcbiAgICBpZiAoY2hhbm5lbCkge1xuICAgICAgc3JjID0gbWVbbW9kZV0oKTtcbiAgICAgIGkgPSBtb2RlLmluZGV4T2YoY2hhbm5lbCk7XG4gICAgICBpZiAoaSA+IC0xKSB7XG4gICAgICAgIGlmICh0eXBlKHZhbHVlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBzd2l0Y2ggKHZhbHVlLmNoYXJBdCgwKSkge1xuICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgICAgICAgIHNyY1tpXSArPSArdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLSc6XG4gICAgICAgICAgICAgIHNyY1tpXSArPSArdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKic6XG4gICAgICAgICAgICAgIHNyY1tpXSAqPSArKHZhbHVlLnN1YnN0cigxKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnLyc6XG4gICAgICAgICAgICAgIHNyY1tpXSAvPSArKHZhbHVlLnN1YnN0cigxKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgc3JjW2ldID0gK3ZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzcmNbaV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCd1bmtub3duIGNoYW5uZWwgJyArIGNoYW5uZWwgKyAnIGluIG1vZGUgJyArIG1vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzcmMgPSB2YWx1ZTtcbiAgICB9XG4gICAgbWUuX3JnYiA9IGNocm9tYShzcmMsIG1vZGUpLmFscGhhKG1lLmFscGhhKCkpLl9yZ2I7XG4gICAgcmV0dXJuIG1lO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5kYXJrZW4gPSBmdW5jdGlvbihhbW91bnQpIHtcbiAgICB2YXIgbGFiLCBtZTtcbiAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgIGFtb3VudCA9IDE7XG4gICAgfVxuICAgIG1lID0gdGhpcztcbiAgICBsYWIgPSBtZS5sYWIoKTtcbiAgICBsYWJbMF0gLT0gTEFCX0NPTlNUQU5UUy5LbiAqIGFtb3VudDtcbiAgICByZXR1cm4gY2hyb21hLmxhYihsYWIpLmFscGhhKG1lLmFscGhhKCkpO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5icmlnaHRlbiA9IGZ1bmN0aW9uKGFtb3VudCkge1xuICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgYW1vdW50ID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGFya2VuKC1hbW91bnQpO1xuICB9O1xuXG4gIENvbG9yLnByb3RvdHlwZS5kYXJrZXIgPSBDb2xvci5wcm90b3R5cGUuZGFya2VuO1xuXG4gIENvbG9yLnByb3RvdHlwZS5icmlnaHRlciA9IENvbG9yLnByb3RvdHlwZS5icmlnaHRlbjtcblxuICBDb2xvci5wcm90b3R5cGUuc2F0dXJhdGUgPSBmdW5jdGlvbihhbW91bnQpIHtcbiAgICB2YXIgbGNoLCBtZTtcbiAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgIGFtb3VudCA9IDE7XG4gICAgfVxuICAgIG1lID0gdGhpcztcbiAgICBsY2ggPSBtZS5sY2goKTtcbiAgICBsY2hbMV0gKz0gYW1vdW50ICogTEFCX0NPTlNUQU5UUy5LbjtcbiAgICBpZiAobGNoWzFdIDwgMCkge1xuICAgICAgbGNoWzFdID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIGNocm9tYS5sY2gobGNoKS5hbHBoYShtZS5hbHBoYSgpKTtcbiAgfTtcblxuICBDb2xvci5wcm90b3R5cGUuZGVzYXR1cmF0ZSA9IGZ1bmN0aW9uKGFtb3VudCkge1xuICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgYW1vdW50ID0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc2F0dXJhdGUoLWFtb3VudCk7XG4gIH07XG5cbiAgQ29sb3IucHJvdG90eXBlLnByZW11bHRpcGx5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGEsIHJnYjtcbiAgICByZ2IgPSB0aGlzLnJnYigpO1xuICAgIGEgPSB0aGlzLmFscGhhKCk7XG4gICAgcmV0dXJuIGNocm9tYShyZ2JbMF0gKiBhLCByZ2JbMV0gKiBhLCByZ2JbMl0gKiBhLCBhKTtcbiAgfTtcblxuICBibGVuZCA9IGZ1bmN0aW9uKGJvdHRvbSwgdG9wLCBtb2RlKSB7XG4gICAgaWYgKCFibGVuZFttb2RlXSkge1xuICAgICAgdGhyb3cgJ3Vua25vd24gYmxlbmQgbW9kZSAnICsgbW9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGJsZW5kW21vZGVdKGJvdHRvbSwgdG9wKTtcbiAgfTtcblxuICBibGVuZF9mID0gZnVuY3Rpb24oZikge1xuICAgIHJldHVybiBmdW5jdGlvbihib3R0b20sIHRvcCkge1xuICAgICAgdmFyIGMwLCBjMTtcbiAgICAgIGMwID0gY2hyb21hKHRvcCkucmdiKCk7XG4gICAgICBjMSA9IGNocm9tYShib3R0b20pLnJnYigpO1xuICAgICAgcmV0dXJuIGNocm9tYShmKGMwLCBjMSksICdyZ2InKTtcbiAgICB9O1xuICB9O1xuXG4gIGVhY2ggPSBmdW5jdGlvbihmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGMwLCBjMSkge1xuICAgICAgdmFyIGksIG8sIG91dDtcbiAgICAgIG91dCA9IFtdO1xuICAgICAgZm9yIChpID0gbyA9IDA7IG8gPD0gMzsgaSA9ICsrbykge1xuICAgICAgICBvdXRbaV0gPSBmKGMwW2ldLCBjMVtpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gIH07XG5cbiAgbm9ybWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhO1xuICB9O1xuXG4gIG11bHRpcGx5ID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhICogYiAvIDI1NTtcbiAgfTtcblxuICBkYXJrZW4gPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgaWYgKGEgPiBiKSB7XG4gICAgICByZXR1cm4gYjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICB9O1xuXG4gIGxpZ2h0ZW4gPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgaWYgKGEgPiBiKSB7XG4gICAgICByZXR1cm4gYTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGI7XG4gICAgfVxuICB9O1xuXG4gIHNjcmVlbiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gMjU1ICogKDEgLSAoMSAtIGEgLyAyNTUpICogKDEgLSBiIC8gMjU1KSk7XG4gIH07XG5cbiAgb3ZlcmxheSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICBpZiAoYiA8IDEyOCkge1xuICAgICAgcmV0dXJuIDIgKiBhICogYiAvIDI1NTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDI1NSAqICgxIC0gMiAqICgxIC0gYSAvIDI1NSkgKiAoMSAtIGIgLyAyNTUpKTtcbiAgICB9XG4gIH07XG5cbiAgYnVybiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gMjU1ICogKDEgLSAoMSAtIGIgLyAyNTUpIC8gKGEgLyAyNTUpKTtcbiAgfTtcblxuICBkb2RnZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICBpZiAoYSA9PT0gMjU1KSB7XG4gICAgICByZXR1cm4gMjU1O1xuICAgIH1cbiAgICBhID0gMjU1ICogKGIgLyAyNTUpIC8gKDEgLSBhIC8gMjU1KTtcbiAgICBpZiAoYSA+IDI1NSkge1xuICAgICAgcmV0dXJuIDI1NTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICB9O1xuXG4gIGJsZW5kLm5vcm1hbCA9IGJsZW5kX2YoZWFjaChub3JtYWwpKTtcblxuICBibGVuZC5tdWx0aXBseSA9IGJsZW5kX2YoZWFjaChtdWx0aXBseSkpO1xuXG4gIGJsZW5kLnNjcmVlbiA9IGJsZW5kX2YoZWFjaChzY3JlZW4pKTtcblxuICBibGVuZC5vdmVybGF5ID0gYmxlbmRfZihlYWNoKG92ZXJsYXkpKTtcblxuICBibGVuZC5kYXJrZW4gPSBibGVuZF9mKGVhY2goZGFya2VuKSk7XG5cbiAgYmxlbmQubGlnaHRlbiA9IGJsZW5kX2YoZWFjaChsaWdodGVuKSk7XG5cbiAgYmxlbmQuZG9kZ2UgPSBibGVuZF9mKGVhY2goZG9kZ2UpKTtcblxuICBibGVuZC5idXJuID0gYmxlbmRfZihlYWNoKGJ1cm4pKTtcblxuICBjaHJvbWEuYmxlbmQgPSBibGVuZDtcblxuICBjaHJvbWEuYW5hbHl6ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgbGVuLCBvLCByLCB2YWw7XG4gICAgciA9IHtcbiAgICAgIG1pbjogTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSAqIC0xLFxuICAgICAgc3VtOiAwLFxuICAgICAgdmFsdWVzOiBbXSxcbiAgICAgIGNvdW50OiAwXG4gICAgfTtcbiAgICBmb3IgKG8gPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICB2YWwgPSBkYXRhW29dO1xuICAgICAgaWYgKCh2YWwgIT0gbnVsbCkgJiYgIWlzTmFOKHZhbCkpIHtcbiAgICAgICAgci52YWx1ZXMucHVzaCh2YWwpO1xuICAgICAgICByLnN1bSArPSB2YWw7XG4gICAgICAgIGlmICh2YWwgPCByLm1pbikge1xuICAgICAgICAgIHIubWluID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2YWwgPiByLm1heCkge1xuICAgICAgICAgIHIubWF4ID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHIuY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgci5kb21haW4gPSBbci5taW4sIHIubWF4XTtcbiAgICByLmxpbWl0cyA9IGZ1bmN0aW9uKG1vZGUsIG51bSkge1xuICAgICAgcmV0dXJuIGNocm9tYS5saW1pdHMociwgbW9kZSwgbnVtKTtcbiAgICB9O1xuICAgIHJldHVybiByO1xuICB9O1xuXG4gIGNocm9tYS5zY2FsZSA9IGZ1bmN0aW9uKGNvbG9ycywgcG9zaXRpb25zKSB7XG4gICAgdmFyIF9jbGFzc2VzLCBfY29sb3JDYWNoZSwgX2NvbG9ycywgX2NvcnJlY3RMaWdodG5lc3MsIF9kb21haW4sIF9maXhlZCwgX21heCwgX21pbiwgX21vZGUsIF9uYWNvbCwgX291dCwgX3BhZGRpbmcsIF9wb3MsIF9zcHJlYWQsIGNsYXNzaWZ5VmFsdWUsIGYsIGdldENsYXNzLCBnZXRDb2xvciwgcmVzZXRDYWNoZSwgc2V0Q29sb3JzLCB0bWFwO1xuICAgIF9tb2RlID0gJ3JnYic7XG4gICAgX25hY29sID0gY2hyb21hKCcjY2NjJyk7XG4gICAgX3NwcmVhZCA9IDA7XG4gICAgX2ZpeGVkID0gZmFsc2U7XG4gICAgX2RvbWFpbiA9IFswLCAxXTtcbiAgICBfcG9zID0gW107XG4gICAgX3BhZGRpbmcgPSBbMCwgMF07XG4gICAgX2NsYXNzZXMgPSBmYWxzZTtcbiAgICBfY29sb3JzID0gW107XG4gICAgX291dCA9IGZhbHNlO1xuICAgIF9taW4gPSAwO1xuICAgIF9tYXggPSAxO1xuICAgIF9jb3JyZWN0TGlnaHRuZXNzID0gZmFsc2U7XG4gICAgX2NvbG9yQ2FjaGUgPSB7fTtcbiAgICBzZXRDb2xvcnMgPSBmdW5jdGlvbihjb2xvcnMpIHtcbiAgICAgIHZhciBjLCBjb2wsIG8sIHJlZiwgcmVmMSwgcmVmMiwgdztcbiAgICAgIGlmIChjb2xvcnMgPT0gbnVsbCkge1xuICAgICAgICBjb2xvcnMgPSBbJyNmZmYnLCAnIzAwMCddO1xuICAgICAgfVxuICAgICAgaWYgKChjb2xvcnMgIT0gbnVsbCkgJiYgdHlwZShjb2xvcnMpID09PSAnc3RyaW5nJyAmJiAoKChyZWYgPSBjaHJvbWEuYnJld2VyKSAhPSBudWxsID8gcmVmW2NvbG9yc10gOiB2b2lkIDApICE9IG51bGwpKSB7XG4gICAgICAgIGNvbG9ycyA9IGNocm9tYS5icmV3ZXJbY29sb3JzXTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlKGNvbG9ycykgPT09ICdhcnJheScpIHtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLnNsaWNlKDApO1xuICAgICAgICBmb3IgKGMgPSBvID0gMCwgcmVmMSA9IGNvbG9ycy5sZW5ndGggLSAxOyAwIDw9IHJlZjEgPyBvIDw9IHJlZjEgOiBvID49IHJlZjE7IGMgPSAwIDw9IHJlZjEgPyArK28gOiAtLW8pIHtcbiAgICAgICAgICBjb2wgPSBjb2xvcnNbY107XG4gICAgICAgICAgaWYgKHR5cGUoY29sKSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY29sb3JzW2NdID0gY2hyb21hKGNvbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIF9wb3MubGVuZ3RoID0gMDtcbiAgICAgICAgZm9yIChjID0gdyA9IDAsIHJlZjIgPSBjb2xvcnMubGVuZ3RoIC0gMTsgMCA8PSByZWYyID8gdyA8PSByZWYyIDogdyA+PSByZWYyOyBjID0gMCA8PSByZWYyID8gKyt3IDogLS13KSB7XG4gICAgICAgICAgX3Bvcy5wdXNoKGMgLyAoY29sb3JzLmxlbmd0aCAtIDEpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzZXRDYWNoZSgpO1xuICAgICAgcmV0dXJuIF9jb2xvcnMgPSBjb2xvcnM7XG4gICAgfTtcbiAgICBnZXRDbGFzcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgaSwgbjtcbiAgICAgIGlmIChfY2xhc3NlcyAhPSBudWxsKSB7XG4gICAgICAgIG4gPSBfY2xhc3Nlcy5sZW5ndGggLSAxO1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBuICYmIHZhbHVlID49IF9jbGFzc2VzW2ldKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpIC0gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH07XG4gICAgdG1hcCA9IGZ1bmN0aW9uKHQpIHtcbiAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgY2xhc3NpZnlWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICB2YXIgaSwgbWF4YywgbWluYywgbiwgdmFsO1xuICAgICAgdmFsID0gdmFsdWU7XG4gICAgICBpZiAoX2NsYXNzZXMubGVuZ3RoID4gMikge1xuICAgICAgICBuID0gX2NsYXNzZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgaSA9IGdldENsYXNzKHZhbHVlKTtcbiAgICAgICAgbWluYyA9IF9jbGFzc2VzWzBdICsgKF9jbGFzc2VzWzFdIC0gX2NsYXNzZXNbMF0pICogKDAgKyBfc3ByZWFkICogMC41KTtcbiAgICAgICAgbWF4YyA9IF9jbGFzc2VzW24gLSAxXSArIChfY2xhc3Nlc1tuXSAtIF9jbGFzc2VzW24gLSAxXSkgKiAoMSAtIF9zcHJlYWQgKiAwLjUpO1xuICAgICAgICB2YWwgPSBfbWluICsgKChfY2xhc3Nlc1tpXSArIChfY2xhc3Nlc1tpICsgMV0gLSBfY2xhc3Nlc1tpXSkgKiAwLjUgLSBtaW5jKSAvIChtYXhjIC0gbWluYykpICogKF9tYXggLSBfbWluKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWw7XG4gICAgfTtcbiAgICBnZXRDb2xvciA9IGZ1bmN0aW9uKHZhbCwgYnlwYXNzTWFwKSB7XG4gICAgICB2YXIgYywgY29sLCBpLCBrLCBvLCBwLCByZWYsIHQ7XG4gICAgICBpZiAoYnlwYXNzTWFwID09IG51bGwpIHtcbiAgICAgICAgYnlwYXNzTWFwID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaXNOYU4odmFsKSkge1xuICAgICAgICByZXR1cm4gX25hY29sO1xuICAgICAgfVxuICAgICAgaWYgKCFieXBhc3NNYXApIHtcbiAgICAgICAgaWYgKF9jbGFzc2VzICYmIF9jbGFzc2VzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICBjID0gZ2V0Q2xhc3ModmFsKTtcbiAgICAgICAgICB0ID0gYyAvIChfY2xhc3Nlcy5sZW5ndGggLSAyKTtcbiAgICAgICAgICB0ID0gX3BhZGRpbmdbMF0gKyAodCAqICgxIC0gX3BhZGRpbmdbMF0gLSBfcGFkZGluZ1sxXSkpO1xuICAgICAgICB9IGVsc2UgaWYgKF9tYXggIT09IF9taW4pIHtcbiAgICAgICAgICB0ID0gKHZhbCAtIF9taW4pIC8gKF9tYXggLSBfbWluKTtcbiAgICAgICAgICB0ID0gX3BhZGRpbmdbMF0gKyAodCAqICgxIC0gX3BhZGRpbmdbMF0gLSBfcGFkZGluZ1sxXSkpO1xuICAgICAgICAgIHQgPSBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCB0KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdCA9IDE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHQgPSB2YWw7XG4gICAgICB9XG4gICAgICBpZiAoIWJ5cGFzc01hcCkge1xuICAgICAgICB0ID0gdG1hcCh0KTtcbiAgICAgIH1cbiAgICAgIGsgPSBNYXRoLmZsb29yKHQgKiAxMDAwMCk7XG4gICAgICBpZiAoX2NvbG9yQ2FjaGVba10pIHtcbiAgICAgICAgY29sID0gX2NvbG9yQ2FjaGVba107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZShfY29sb3JzKSA9PT0gJ2FycmF5Jykge1xuICAgICAgICAgIGZvciAoaSA9IG8gPSAwLCByZWYgPSBfcG9zLmxlbmd0aCAtIDE7IDAgPD0gcmVmID8gbyA8PSByZWYgOiBvID49IHJlZjsgaSA9IDAgPD0gcmVmID8gKytvIDogLS1vKSB7XG4gICAgICAgICAgICBwID0gX3Bvc1tpXTtcbiAgICAgICAgICAgIGlmICh0IDw9IHApIHtcbiAgICAgICAgICAgICAgY29sID0gX2NvbG9yc1tpXTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA+PSBwICYmIGkgPT09IF9wb3MubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICBjb2wgPSBfY29sb3JzW2ldO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID4gcCAmJiB0IDwgX3Bvc1tpICsgMV0pIHtcbiAgICAgICAgICAgICAgdCA9ICh0IC0gcCkgLyAoX3Bvc1tpICsgMV0gLSBwKTtcbiAgICAgICAgICAgICAgY29sID0gY2hyb21hLmludGVycG9sYXRlKF9jb2xvcnNbaV0sIF9jb2xvcnNbaSArIDFdLCB0LCBfbW9kZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlKF9jb2xvcnMpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgY29sID0gX2NvbG9ycyh0KTtcbiAgICAgICAgfVxuICAgICAgICBfY29sb3JDYWNoZVtrXSA9IGNvbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb2w7XG4gICAgfTtcbiAgICByZXNldENhY2hlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gX2NvbG9yQ2FjaGUgPSB7fTtcbiAgICB9O1xuICAgIHNldENvbG9ycyhjb2xvcnMpO1xuICAgIGYgPSBmdW5jdGlvbih2KSB7XG4gICAgICB2YXIgYztcbiAgICAgIGMgPSBjaHJvbWEoZ2V0Q29sb3IodikpO1xuICAgICAgaWYgKF9vdXQgJiYgY1tfb3V0XSkge1xuICAgICAgICByZXR1cm4gY1tfb3V0XSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgICB9XG4gICAgfTtcbiAgICBmLmNsYXNzZXMgPSBmdW5jdGlvbihjbGFzc2VzKSB7XG4gICAgICB2YXIgZDtcbiAgICAgIGlmIChjbGFzc2VzICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGUoY2xhc3NlcykgPT09ICdhcnJheScpIHtcbiAgICAgICAgICBfY2xhc3NlcyA9IGNsYXNzZXM7XG4gICAgICAgICAgX2RvbWFpbiA9IFtjbGFzc2VzWzBdLCBjbGFzc2VzW2NsYXNzZXMubGVuZ3RoIC0gMV1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGQgPSBjaHJvbWEuYW5hbHl6ZShfZG9tYWluKTtcbiAgICAgICAgICBpZiAoY2xhc3NlcyA9PT0gMCkge1xuICAgICAgICAgICAgX2NsYXNzZXMgPSBbZC5taW4sIGQubWF4XTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2NsYXNzZXMgPSBjaHJvbWEubGltaXRzKGQsICdlJywgY2xhc3Nlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9jbGFzc2VzO1xuICAgIH07XG4gICAgZi5kb21haW4gPSBmdW5jdGlvbihkb21haW4pIHtcbiAgICAgIHZhciBjLCBkLCBrLCBsZW4sIG8sIHJlZiwgdztcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gX2RvbWFpbjtcbiAgICAgIH1cbiAgICAgIF9taW4gPSBkb21haW5bMF07XG4gICAgICBfbWF4ID0gZG9tYWluW2RvbWFpbi5sZW5ndGggLSAxXTtcbiAgICAgIF9wb3MgPSBbXTtcbiAgICAgIGsgPSBfY29sb3JzLmxlbmd0aDtcbiAgICAgIGlmIChkb21haW4ubGVuZ3RoID09PSBrICYmIF9taW4gIT09IF9tYXgpIHtcbiAgICAgICAgZm9yIChvID0gMCwgbGVuID0gZG9tYWluLmxlbmd0aDsgbyA8IGxlbjsgbysrKSB7XG4gICAgICAgICAgZCA9IGRvbWFpbltvXTtcbiAgICAgICAgICBfcG9zLnB1c2goKGQgLSBfbWluKSAvIChfbWF4IC0gX21pbikpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGMgPSB3ID0gMCwgcmVmID0gayAtIDE7IDAgPD0gcmVmID8gdyA8PSByZWYgOiB3ID49IHJlZjsgYyA9IDAgPD0gcmVmID8gKyt3IDogLS13KSB7XG4gICAgICAgICAgX3Bvcy5wdXNoKGMgLyAoayAtIDEpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX2RvbWFpbiA9IFtfbWluLCBfbWF4XTtcbiAgICAgIHJldHVybiBmO1xuICAgIH07XG4gICAgZi5tb2RlID0gZnVuY3Rpb24oX20pIHtcbiAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gX21vZGU7XG4gICAgICB9XG4gICAgICBfbW9kZSA9IF9tO1xuICAgICAgcmVzZXRDYWNoZSgpO1xuICAgICAgcmV0dXJuIGY7XG4gICAgfTtcbiAgICBmLnJhbmdlID0gZnVuY3Rpb24oY29sb3JzLCBfcG9zKSB7XG4gICAgICBzZXRDb2xvcnMoY29sb3JzLCBfcG9zKTtcbiAgICAgIHJldHVybiBmO1xuICAgIH07XG4gICAgZi5vdXQgPSBmdW5jdGlvbihfbykge1xuICAgICAgX291dCA9IF9vO1xuICAgICAgcmV0dXJuIGY7XG4gICAgfTtcbiAgICBmLnNwcmVhZCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBfc3ByZWFkO1xuICAgICAgfVxuICAgICAgX3NwcmVhZCA9IHZhbDtcbiAgICAgIHJldHVybiBmO1xuICAgIH07XG4gICAgZi5jb3JyZWN0TGlnaHRuZXNzID0gZnVuY3Rpb24odikge1xuICAgICAgaWYgKHYgPT0gbnVsbCkge1xuICAgICAgICB2ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIF9jb3JyZWN0TGlnaHRuZXNzID0gdjtcbiAgICAgIHJlc2V0Q2FjaGUoKTtcbiAgICAgIGlmIChfY29ycmVjdExpZ2h0bmVzcykge1xuICAgICAgICB0bWFwID0gZnVuY3Rpb24odCkge1xuICAgICAgICAgIHZhciBMMCwgTDEsIExfYWN0dWFsLCBMX2RpZmYsIExfaWRlYWwsIG1heF9pdGVyLCBwb2wsIHQwLCB0MTtcbiAgICAgICAgICBMMCA9IGdldENvbG9yKDAsIHRydWUpLmxhYigpWzBdO1xuICAgICAgICAgIEwxID0gZ2V0Q29sb3IoMSwgdHJ1ZSkubGFiKClbMF07XG4gICAgICAgICAgcG9sID0gTDAgPiBMMTtcbiAgICAgICAgICBMX2FjdHVhbCA9IGdldENvbG9yKHQsIHRydWUpLmxhYigpWzBdO1xuICAgICAgICAgIExfaWRlYWwgPSBMMCArIChMMSAtIEwwKSAqIHQ7XG4gICAgICAgICAgTF9kaWZmID0gTF9hY3R1YWwgLSBMX2lkZWFsO1xuICAgICAgICAgIHQwID0gMDtcbiAgICAgICAgICB0MSA9IDE7XG4gICAgICAgICAgbWF4X2l0ZXIgPSAyMDtcbiAgICAgICAgICB3aGlsZSAoTWF0aC5hYnMoTF9kaWZmKSA+IDFlLTIgJiYgbWF4X2l0ZXItLSA+IDApIHtcbiAgICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKHBvbCkge1xuICAgICAgICAgICAgICAgIExfZGlmZiAqPSAtMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoTF9kaWZmIDwgMCkge1xuICAgICAgICAgICAgICAgIHQwID0gdDtcbiAgICAgICAgICAgICAgICB0ICs9ICh0MSAtIHQpICogMC41O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHQxID0gdDtcbiAgICAgICAgICAgICAgICB0ICs9ICh0MCAtIHQpICogMC41O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIExfYWN0dWFsID0gZ2V0Q29sb3IodCwgdHJ1ZSkubGFiKClbMF07XG4gICAgICAgICAgICAgIHJldHVybiBMX2RpZmYgPSBMX2FjdHVhbCAtIExfaWRlYWw7XG4gICAgICAgICAgICB9KSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRtYXAgPSBmdW5jdGlvbih0KSB7XG4gICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gZjtcbiAgICB9O1xuICAgIGYucGFkZGluZyA9IGZ1bmN0aW9uKHApIHtcbiAgICAgIGlmIChwICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGUocCkgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcCA9IFtwLCBwXTtcbiAgICAgICAgfVxuICAgICAgICBfcGFkZGluZyA9IHA7XG4gICAgICAgIHJldHVybiBmO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF9wYWRkaW5nO1xuICAgICAgfVxuICAgIH07XG4gICAgZi5jb2xvcnMgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkZCwgZG0sIGksIG51bUNvbG9ycywgbywgb3V0LCByZWYsIHJlc3VsdHMsIHNhbXBsZXMsIHc7XG4gICAgICBudW1Db2xvcnMgPSAwO1xuICAgICAgb3V0ID0gJ2hleCc7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAodHlwZShhcmd1bWVudHNbMF0pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIG91dCA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBudW1Db2xvcnMgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIG51bUNvbG9ycyA9IGFyZ3VtZW50c1swXSwgb3V0ID0gYXJndW1lbnRzWzFdO1xuICAgICAgfVxuICAgICAgaWYgKG51bUNvbG9ycykge1xuICAgICAgICBkbSA9IF9kb21haW5bMF07XG4gICAgICAgIGRkID0gX2RvbWFpblsxXSAtIGRtO1xuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBvID0gMDsgMCA8PSBudW1Db2xvcnMgPyBvIDwgbnVtQ29sb3JzIDogbyA+IG51bUNvbG9yczsgMCA8PSBudW1Db2xvcnMgPyBvKysgOiBvLS0peyByZXN1bHRzLnB1c2gobyk7IH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgfSkuYXBwbHkodGhpcykubWFwKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgICByZXR1cm4gZihkbSArIGkgLyAobnVtQ29sb3JzIC0gMSkgKiBkZClbb3V0XSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbG9ycyA9IFtdO1xuICAgICAgc2FtcGxlcyA9IFtdO1xuICAgICAgaWYgKF9jbGFzc2VzICYmIF9jbGFzc2VzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgZm9yIChpID0gdyA9IDEsIHJlZiA9IF9jbGFzc2VzLmxlbmd0aDsgMSA8PSByZWYgPyB3IDwgcmVmIDogdyA+IHJlZjsgaSA9IDEgPD0gcmVmID8gKyt3IDogLS13KSB7XG4gICAgICAgICAgc2FtcGxlcy5wdXNoKChfY2xhc3Nlc1tpIC0gMV0gKyBfY2xhc3Nlc1tpXSkgKiAwLjUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzYW1wbGVzID0gX2RvbWFpbjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzYW1wbGVzLm1hcChmdW5jdGlvbih2KSB7XG4gICAgICAgIHJldHVybiBmKHYpW291dF0oKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGY7XG4gIH07XG5cbiAgaWYgKGNocm9tYS5zY2FsZXMgPT0gbnVsbCkge1xuICAgIGNocm9tYS5zY2FsZXMgPSB7fTtcbiAgfVxuXG4gIGNocm9tYS5zY2FsZXMuY29vbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjaHJvbWEuc2NhbGUoW2Nocm9tYS5oc2woMTgwLCAxLCAuOSksIGNocm9tYS5oc2woMjUwLCAuNywgLjQpXSk7XG4gIH07XG5cbiAgY2hyb21hLnNjYWxlcy5ob3QgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY2hyb21hLnNjYWxlKFsnIzAwMCcsICcjZjAwJywgJyNmZjAnLCAnI2ZmZiddLCBbMCwgLjI1LCAuNzUsIDFdKS5tb2RlKCdyZ2InKTtcbiAgfTtcblxuICBjaHJvbWEuYW5hbHl6ZSA9IGZ1bmN0aW9uKGRhdGEsIGtleSwgZmlsdGVyKSB7XG4gICAgdmFyIGFkZCwgaywgbGVuLCBvLCByLCB2YWwsIHZpc2l0O1xuICAgIHIgPSB7XG4gICAgICBtaW46IE51bWJlci5NQVhfVkFMVUUsXG4gICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUgKiAtMSxcbiAgICAgIHN1bTogMCxcbiAgICAgIHZhbHVlczogW10sXG4gICAgICBjb3VudDogMFxuICAgIH07XG4gICAgaWYgKGZpbHRlciA9PSBudWxsKSB7XG4gICAgICBmaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuICAgIH1cbiAgICBhZGQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgIGlmICgodmFsICE9IG51bGwpICYmICFpc05hTih2YWwpKSB7XG4gICAgICAgIHIudmFsdWVzLnB1c2godmFsKTtcbiAgICAgICAgci5zdW0gKz0gdmFsO1xuICAgICAgICBpZiAodmFsIDwgci5taW4pIHtcbiAgICAgICAgICByLm1pbiA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsID4gci5tYXgpIHtcbiAgICAgICAgICByLm1heCA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICByLmNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgfTtcbiAgICB2aXNpdCA9IGZ1bmN0aW9uKHZhbCwgaykge1xuICAgICAgaWYgKGZpbHRlcih2YWwsIGspKSB7XG4gICAgICAgIGlmICgoa2V5ICE9IG51bGwpICYmIHR5cGUoa2V5KSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHJldHVybiBhZGQoa2V5KHZhbCkpO1xuICAgICAgICB9IGVsc2UgaWYgKChrZXkgIT0gbnVsbCkgJiYgdHlwZShrZXkpID09PSAnc3RyaW5nJyB8fCB0eXBlKGtleSkgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgcmV0dXJuIGFkZCh2YWxba2V5XSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGFkZCh2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAodHlwZShkYXRhKSA9PT0gJ2FycmF5Jykge1xuICAgICAgZm9yIChvID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IG8gPCBsZW47IG8rKykge1xuICAgICAgICB2YWwgPSBkYXRhW29dO1xuICAgICAgICB2aXNpdCh2YWwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGsgaW4gZGF0YSkge1xuICAgICAgICB2YWwgPSBkYXRhW2tdO1xuICAgICAgICB2aXNpdCh2YWwsIGspO1xuICAgICAgfVxuICAgIH1cbiAgICByLmRvbWFpbiA9IFtyLm1pbiwgci5tYXhdO1xuICAgIHIubGltaXRzID0gZnVuY3Rpb24obW9kZSwgbnVtKSB7XG4gICAgICByZXR1cm4gY2hyb21hLmxpbWl0cyhyLCBtb2RlLCBudW0pO1xuICAgIH07XG4gICAgcmV0dXJuIHI7XG4gIH07XG5cbiAgY2hyb21hLmxpbWl0cyA9IGZ1bmN0aW9uKGRhdGEsIG1vZGUsIG51bSkge1xuICAgIHZhciBhYSwgYWIsIGFjLCBhZCwgYWUsIGFmLCBhZywgYWgsIGFpLCBhaiwgYWssIGFsLCBhbSwgYXNzaWdubWVudHMsIGJlc3QsIGNlbnRyb2lkcywgY2x1c3RlciwgY2x1c3RlclNpemVzLCBkaXN0LCBpLCBqLCBrQ2x1c3RlcnMsIGxpbWl0cywgbWF4X2xvZywgbWluLCBtaW5fbG9nLCBtaW5kaXN0LCBuLCBuYl9pdGVycywgbmV3Q2VudHJvaWRzLCBvLCBwLCBwYiwgcHIsIHJlZiwgcmVmMSwgcmVmMTAsIHJlZjExLCByZWYxMiwgcmVmMTMsIHJlZjE0LCByZWYyLCByZWYzLCByZWY0LCByZWY1LCByZWY2LCByZWY3LCByZWY4LCByZWY5LCByZXBlYXQsIHN1bSwgdG1wS01lYW5zQnJlYWtzLCB2YWx1ZSwgdmFsdWVzLCB3O1xuICAgIGlmIChtb2RlID09IG51bGwpIHtcbiAgICAgIG1vZGUgPSAnZXF1YWwnO1xuICAgIH1cbiAgICBpZiAobnVtID09IG51bGwpIHtcbiAgICAgIG51bSA9IDc7XG4gICAgfVxuICAgIGlmICh0eXBlKGRhdGEpID09PSAnYXJyYXknKSB7XG4gICAgICBkYXRhID0gY2hyb21hLmFuYWx5emUoZGF0YSk7XG4gICAgfVxuICAgIG1pbiA9IGRhdGEubWluO1xuICAgIG1heCA9IGRhdGEubWF4O1xuICAgIHN1bSA9IGRhdGEuc3VtO1xuICAgIHZhbHVlcyA9IGRhdGEudmFsdWVzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIGEgLSBiO1xuICAgIH0pO1xuICAgIGxpbWl0cyA9IFtdO1xuICAgIGlmIChtb2RlLnN1YnN0cigwLCAxKSA9PT0gJ2MnKSB7XG4gICAgICBsaW1pdHMucHVzaChtaW4pO1xuICAgICAgbGltaXRzLnB1c2gobWF4KTtcbiAgICB9XG4gICAgaWYgKG1vZGUuc3Vic3RyKDAsIDEpID09PSAnZScpIHtcbiAgICAgIGxpbWl0cy5wdXNoKG1pbik7XG4gICAgICBmb3IgKGkgPSBvID0gMSwgcmVmID0gbnVtIC0gMTsgMSA8PSByZWYgPyBvIDw9IHJlZiA6IG8gPj0gcmVmOyBpID0gMSA8PSByZWYgPyArK28gOiAtLW8pIHtcbiAgICAgICAgbGltaXRzLnB1c2gobWluICsgKGkgLyBudW0pICogKG1heCAtIG1pbikpO1xuICAgICAgfVxuICAgICAgbGltaXRzLnB1c2gobWF4KTtcbiAgICB9IGVsc2UgaWYgKG1vZGUuc3Vic3RyKDAsIDEpID09PSAnbCcpIHtcbiAgICAgIGlmIChtaW4gPD0gMCkge1xuICAgICAgICB0aHJvdyAnTG9nYXJpdGhtaWMgc2NhbGVzIGFyZSBvbmx5IHBvc3NpYmxlIGZvciB2YWx1ZXMgPiAwJztcbiAgICAgIH1cbiAgICAgIG1pbl9sb2cgPSBNYXRoLkxPRzEwRSAqIGxvZyhtaW4pO1xuICAgICAgbWF4X2xvZyA9IE1hdGguTE9HMTBFICogbG9nKG1heCk7XG4gICAgICBsaW1pdHMucHVzaChtaW4pO1xuICAgICAgZm9yIChpID0gdyA9IDEsIHJlZjEgPSBudW0gLSAxOyAxIDw9IHJlZjEgPyB3IDw9IHJlZjEgOiB3ID49IHJlZjE7IGkgPSAxIDw9IHJlZjEgPyArK3cgOiAtLXcpIHtcbiAgICAgICAgbGltaXRzLnB1c2gocG93KDEwLCBtaW5fbG9nICsgKGkgLyBudW0pICogKG1heF9sb2cgLSBtaW5fbG9nKSkpO1xuICAgICAgfVxuICAgICAgbGltaXRzLnB1c2gobWF4KTtcbiAgICB9IGVsc2UgaWYgKG1vZGUuc3Vic3RyKDAsIDEpID09PSAncScpIHtcbiAgICAgIGxpbWl0cy5wdXNoKG1pbik7XG4gICAgICBmb3IgKGkgPSBhYSA9IDEsIHJlZjIgPSBudW0gLSAxOyAxIDw9IHJlZjIgPyBhYSA8PSByZWYyIDogYWEgPj0gcmVmMjsgaSA9IDEgPD0gcmVmMiA/ICsrYWEgOiAtLWFhKSB7XG4gICAgICAgIHAgPSB2YWx1ZXMubGVuZ3RoICogaSAvIG51bTtcbiAgICAgICAgcGIgPSBmbG9vcihwKTtcbiAgICAgICAgaWYgKHBiID09PSBwKSB7XG4gICAgICAgICAgbGltaXRzLnB1c2godmFsdWVzW3BiXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHIgPSBwIC0gcGI7XG4gICAgICAgICAgbGltaXRzLnB1c2godmFsdWVzW3BiXSAqIHByICsgdmFsdWVzW3BiICsgMV0gKiAoMSAtIHByKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpbWl0cy5wdXNoKG1heCk7XG4gICAgfSBlbHNlIGlmIChtb2RlLnN1YnN0cigwLCAxKSA9PT0gJ2snKSB7XG5cbiAgICAgIC8qXG4gICAgICBpbXBsZW1lbnRhdGlvbiBiYXNlZCBvblxuICAgICAgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2ZpZ3VlL3NvdXJjZS9icm93c2UvdHJ1bmsvZmlndWUuanMjMzM2XG4gICAgICBzaW1wbGlmaWVkIGZvciAxLWQgaW5wdXQgdmFsdWVzXG4gICAgICAgKi9cbiAgICAgIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgYXNzaWdubWVudHMgPSBuZXcgQXJyYXkobik7XG4gICAgICBjbHVzdGVyU2l6ZXMgPSBuZXcgQXJyYXkobnVtKTtcbiAgICAgIHJlcGVhdCA9IHRydWU7XG4gICAgICBuYl9pdGVycyA9IDA7XG4gICAgICBjZW50cm9pZHMgPSBudWxsO1xuICAgICAgY2VudHJvaWRzID0gW107XG4gICAgICBjZW50cm9pZHMucHVzaChtaW4pO1xuICAgICAgZm9yIChpID0gYWIgPSAxLCByZWYzID0gbnVtIC0gMTsgMSA8PSByZWYzID8gYWIgPD0gcmVmMyA6IGFiID49IHJlZjM7IGkgPSAxIDw9IHJlZjMgPyArK2FiIDogLS1hYikge1xuICAgICAgICBjZW50cm9pZHMucHVzaChtaW4gKyAoaSAvIG51bSkgKiAobWF4IC0gbWluKSk7XG4gICAgICB9XG4gICAgICBjZW50cm9pZHMucHVzaChtYXgpO1xuICAgICAgd2hpbGUgKHJlcGVhdCkge1xuICAgICAgICBmb3IgKGogPSBhYyA9IDAsIHJlZjQgPSBudW0gLSAxOyAwIDw9IHJlZjQgPyBhYyA8PSByZWY0IDogYWMgPj0gcmVmNDsgaiA9IDAgPD0gcmVmNCA/ICsrYWMgOiAtLWFjKSB7XG4gICAgICAgICAgY2x1c3RlclNpemVzW2pdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSBhZCA9IDAsIHJlZjUgPSBuIC0gMTsgMCA8PSByZWY1ID8gYWQgPD0gcmVmNSA6IGFkID49IHJlZjU7IGkgPSAwIDw9IHJlZjUgPyArK2FkIDogLS1hZCkge1xuICAgICAgICAgIHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIG1pbmRpc3QgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgICAgIGZvciAoaiA9IGFlID0gMCwgcmVmNiA9IG51bSAtIDE7IDAgPD0gcmVmNiA/IGFlIDw9IHJlZjYgOiBhZSA+PSByZWY2OyBqID0gMCA8PSByZWY2ID8gKythZSA6IC0tYWUpIHtcbiAgICAgICAgICAgIGRpc3QgPSBhYnMoY2VudHJvaWRzW2pdIC0gdmFsdWUpO1xuICAgICAgICAgICAgaWYgKGRpc3QgPCBtaW5kaXN0KSB7XG4gICAgICAgICAgICAgIG1pbmRpc3QgPSBkaXN0O1xuICAgICAgICAgICAgICBiZXN0ID0gajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY2x1c3RlclNpemVzW2Jlc3RdKys7XG4gICAgICAgICAgYXNzaWdubWVudHNbaV0gPSBiZXN0O1xuICAgICAgICB9XG4gICAgICAgIG5ld0NlbnRyb2lkcyA9IG5ldyBBcnJheShudW0pO1xuICAgICAgICBmb3IgKGogPSBhZiA9IDAsIHJlZjcgPSBudW0gLSAxOyAwIDw9IHJlZjcgPyBhZiA8PSByZWY3IDogYWYgPj0gcmVmNzsgaiA9IDAgPD0gcmVmNyA/ICsrYWYgOiAtLWFmKSB7XG4gICAgICAgICAgbmV3Q2VudHJvaWRzW2pdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSBhZyA9IDAsIHJlZjggPSBuIC0gMTsgMCA8PSByZWY4ID8gYWcgPD0gcmVmOCA6IGFnID49IHJlZjg7IGkgPSAwIDw9IHJlZjggPyArK2FnIDogLS1hZykge1xuICAgICAgICAgIGNsdXN0ZXIgPSBhc3NpZ25tZW50c1tpXTtcbiAgICAgICAgICBpZiAobmV3Q2VudHJvaWRzW2NsdXN0ZXJdID09PSBudWxsKSB7XG4gICAgICAgICAgICBuZXdDZW50cm9pZHNbY2x1c3Rlcl0gPSB2YWx1ZXNbaV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld0NlbnRyb2lkc1tjbHVzdGVyXSArPSB2YWx1ZXNbaV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaiA9IGFoID0gMCwgcmVmOSA9IG51bSAtIDE7IDAgPD0gcmVmOSA/IGFoIDw9IHJlZjkgOiBhaCA+PSByZWY5OyBqID0gMCA8PSByZWY5ID8gKythaCA6IC0tYWgpIHtcbiAgICAgICAgICBuZXdDZW50cm9pZHNbal0gKj0gMSAvIGNsdXN0ZXJTaXplc1tqXTtcbiAgICAgICAgfVxuICAgICAgICByZXBlYXQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gYWkgPSAwLCByZWYxMCA9IG51bSAtIDE7IDAgPD0gcmVmMTAgPyBhaSA8PSByZWYxMCA6IGFpID49IHJlZjEwOyBqID0gMCA8PSByZWYxMCA/ICsrYWkgOiAtLWFpKSB7XG4gICAgICAgICAgaWYgKG5ld0NlbnRyb2lkc1tqXSAhPT0gY2VudHJvaWRzW2ldKSB7XG4gICAgICAgICAgICByZXBlYXQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNlbnRyb2lkcyA9IG5ld0NlbnRyb2lkcztcbiAgICAgICAgbmJfaXRlcnMrKztcbiAgICAgICAgaWYgKG5iX2l0ZXJzID4gMjAwKSB7XG4gICAgICAgICAgcmVwZWF0ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGtDbHVzdGVycyA9IHt9O1xuICAgICAgZm9yIChqID0gYWogPSAwLCByZWYxMSA9IG51bSAtIDE7IDAgPD0gcmVmMTEgPyBhaiA8PSByZWYxMSA6IGFqID49IHJlZjExOyBqID0gMCA8PSByZWYxMSA/ICsrYWogOiAtLWFqKSB7XG4gICAgICAgIGtDbHVzdGVyc1tqXSA9IFtdO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gYWsgPSAwLCByZWYxMiA9IG4gLSAxOyAwIDw9IHJlZjEyID8gYWsgPD0gcmVmMTIgOiBhayA+PSByZWYxMjsgaSA9IDAgPD0gcmVmMTIgPyArK2FrIDogLS1haykge1xuICAgICAgICBjbHVzdGVyID0gYXNzaWdubWVudHNbaV07XG4gICAgICAgIGtDbHVzdGVyc1tjbHVzdGVyXS5wdXNoKHZhbHVlc1tpXSk7XG4gICAgICB9XG4gICAgICB0bXBLTWVhbnNCcmVha3MgPSBbXTtcbiAgICAgIGZvciAoaiA9IGFsID0gMCwgcmVmMTMgPSBudW0gLSAxOyAwIDw9IHJlZjEzID8gYWwgPD0gcmVmMTMgOiBhbCA+PSByZWYxMzsgaiA9IDAgPD0gcmVmMTMgPyArK2FsIDogLS1hbCkge1xuICAgICAgICB0bXBLTWVhbnNCcmVha3MucHVzaChrQ2x1c3RlcnNbal1bMF0pO1xuICAgICAgICB0bXBLTWVhbnNCcmVha3MucHVzaChrQ2x1c3RlcnNbal1ba0NsdXN0ZXJzW2pdLmxlbmd0aCAtIDFdKTtcbiAgICAgIH1cbiAgICAgIHRtcEtNZWFuc0JyZWFrcyA9IHRtcEtNZWFuc0JyZWFrcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgfSk7XG4gICAgICBsaW1pdHMucHVzaCh0bXBLTWVhbnNCcmVha3NbMF0pO1xuICAgICAgZm9yIChpID0gYW0gPSAxLCByZWYxNCA9IHRtcEtNZWFuc0JyZWFrcy5sZW5ndGggLSAxOyBhbSA8PSByZWYxNDsgaSA9IGFtICs9IDIpIHtcbiAgICAgICAgaWYgKCFpc05hTih0bXBLTWVhbnNCcmVha3NbaV0pKSB7XG4gICAgICAgICAgbGltaXRzLnB1c2godG1wS01lYW5zQnJlYWtzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGltaXRzO1xuICB9O1xuXG4gIGhzaTJyZ2IgPSBmdW5jdGlvbihoLCBzLCBpKSB7XG5cbiAgICAvKlxuICAgIGJvcnJvd2VkIGZyb20gaGVyZTpcbiAgICBodHRwOi8vaHVtbWVyLnN0YW5mb3JkLmVkdS9tdXNlaW5mby9kb2MvZXhhbXBsZXMvaHVtZHJ1bS9rZXlzY2FwZTIvaHNpMnJnYi5jcHBcbiAgICAgKi9cbiAgICB2YXIgYXJncywgYiwgZywgcjtcbiAgICBhcmdzID0gdW5wYWNrKGFyZ3VtZW50cyk7XG4gICAgaCA9IGFyZ3NbMF0sIHMgPSBhcmdzWzFdLCBpID0gYXJnc1syXTtcbiAgICBoIC89IDM2MDtcbiAgICBpZiAoaCA8IDEgLyAzKSB7XG4gICAgICBiID0gKDEgLSBzKSAvIDM7XG4gICAgICByID0gKDEgKyBzICogY29zKFRXT1BJICogaCkgLyBjb3MoUElUSElSRCAtIFRXT1BJICogaCkpIC8gMztcbiAgICAgIGcgPSAxIC0gKGIgKyByKTtcbiAgICB9IGVsc2UgaWYgKGggPCAyIC8gMykge1xuICAgICAgaCAtPSAxIC8gMztcbiAgICAgIHIgPSAoMSAtIHMpIC8gMztcbiAgICAgIGcgPSAoMSArIHMgKiBjb3MoVFdPUEkgKiBoKSAvIGNvcyhQSVRISVJEIC0gVFdPUEkgKiBoKSkgLyAzO1xuICAgICAgYiA9IDEgLSAociArIGcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoIC09IDIgLyAzO1xuICAgICAgZyA9ICgxIC0gcykgLyAzO1xuICAgICAgYiA9ICgxICsgcyAqIGNvcyhUV09QSSAqIGgpIC8gY29zKFBJVEhJUkQgLSBUV09QSSAqIGgpKSAvIDM7XG4gICAgICByID0gMSAtIChnICsgYik7XG4gICAgfVxuICAgIHIgPSBsaW1pdChpICogciAqIDMpO1xuICAgIGcgPSBsaW1pdChpICogZyAqIDMpO1xuICAgIGIgPSBsaW1pdChpICogYiAqIDMpO1xuICAgIHJldHVybiBbciAqIDI1NSwgZyAqIDI1NSwgYiAqIDI1NSwgYXJncy5sZW5ndGggPiAzID8gYXJnc1szXSA6IDFdO1xuICB9O1xuXG4gIHJnYjJoc2kgPSBmdW5jdGlvbigpIHtcblxuICAgIC8qXG4gICAgYm9ycm93ZWQgZnJvbSBoZXJlOlxuICAgIGh0dHA6Ly9odW1tZXIuc3RhbmZvcmQuZWR1L211c2VpbmZvL2RvYy9leGFtcGxlcy9odW1kcnVtL2tleXNjYXBlMi9yZ2IyaHNpLmNwcFxuICAgICAqL1xuICAgIHZhciBiLCBnLCBoLCBpLCBtaW4sIHIsIHJlZiwgcztcbiAgICByZWYgPSB1bnBhY2soYXJndW1lbnRzKSwgciA9IHJlZlswXSwgZyA9IHJlZlsxXSwgYiA9IHJlZlsyXTtcbiAgICBUV09QSSA9IE1hdGguUEkgKiAyO1xuICAgIHIgLz0gMjU1O1xuICAgIGcgLz0gMjU1O1xuICAgIGIgLz0gMjU1O1xuICAgIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIGkgPSAociArIGcgKyBiKSAvIDM7XG4gICAgcyA9IDEgLSBtaW4gLyBpO1xuICAgIGlmIChzID09PSAwKSB7XG4gICAgICBoID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgaCA9ICgociAtIGcpICsgKHIgLSBiKSkgLyAyO1xuICAgICAgaCAvPSBNYXRoLnNxcnQoKHIgLSBnKSAqIChyIC0gZykgKyAociAtIGIpICogKGcgLSBiKSk7XG4gICAgICBoID0gTWF0aC5hY29zKGgpO1xuICAgICAgaWYgKGIgPiBnKSB7XG4gICAgICAgIGggPSBUV09QSSAtIGg7XG4gICAgICB9XG4gICAgICBoIC89IFRXT1BJO1xuICAgIH1cbiAgICByZXR1cm4gW2ggKiAzNjAsIHMsIGldO1xuICB9O1xuXG4gIGNocm9tYS5oc2kgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xuICAgIH0pKENvbG9yLCBzbGljZS5jYWxsKGFyZ3VtZW50cykuY29uY2F0KFsnaHNpJ10pLCBmdW5jdGlvbigpe30pO1xuICB9O1xuXG4gIF9pbnB1dC5oc2kgPSBoc2kycmdiO1xuXG4gIENvbG9yLnByb3RvdHlwZS5oc2kgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gcmdiMmhzaSh0aGlzLl9yZ2IpO1xuICB9O1xuXG4gIGludGVycG9sYXRlX2hzeCA9IGZ1bmN0aW9uKGNvbDEsIGNvbDIsIGYsIG0pIHtcbiAgICB2YXIgZGgsIGh1ZSwgaHVlMCwgaHVlMSwgbGJ2LCBsYnYwLCBsYnYxLCByZXMsIHNhdCwgc2F0MCwgc2F0MSwgeHl6MCwgeHl6MTtcbiAgICBpZiAobSA9PT0gJ2hzbCcpIHtcbiAgICAgIHh5ejAgPSBjb2wxLmhzbCgpO1xuICAgICAgeHl6MSA9IGNvbDIuaHNsKCk7XG4gICAgfSBlbHNlIGlmIChtID09PSAnaHN2Jykge1xuICAgICAgeHl6MCA9IGNvbDEuaHN2KCk7XG4gICAgICB4eXoxID0gY29sMi5oc3YoKTtcbiAgICB9IGVsc2UgaWYgKG0gPT09ICdoc2knKSB7XG4gICAgICB4eXowID0gY29sMS5oc2koKTtcbiAgICAgIHh5ejEgPSBjb2wyLmhzaSgpO1xuICAgIH0gZWxzZSBpZiAobSA9PT0gJ2xjaCcgfHwgbSA9PT0gJ2hjbCcpIHtcbiAgICAgIG0gPSAnaGNsJztcbiAgICAgIHh5ejAgPSBjb2wxLmhjbCgpO1xuICAgICAgeHl6MSA9IGNvbDIuaGNsKCk7XG4gICAgfVxuICAgIGlmIChtLnN1YnN0cigwLCAxKSA9PT0gJ2gnKSB7XG4gICAgICBodWUwID0geHl6MFswXSwgc2F0MCA9IHh5ejBbMV0sIGxidjAgPSB4eXowWzJdO1xuICAgICAgaHVlMSA9IHh5ejFbMF0sIHNhdDEgPSB4eXoxWzFdLCBsYnYxID0geHl6MVsyXTtcbiAgICB9XG4gICAgaWYgKCFpc05hTihodWUwKSAmJiAhaXNOYU4oaHVlMSkpIHtcbiAgICAgIGlmIChodWUxID4gaHVlMCAmJiBodWUxIC0gaHVlMCA+IDE4MCkge1xuICAgICAgICBkaCA9IGh1ZTEgLSAoaHVlMCArIDM2MCk7XG4gICAgICB9IGVsc2UgaWYgKGh1ZTEgPCBodWUwICYmIGh1ZTAgLSBodWUxID4gMTgwKSB7XG4gICAgICAgIGRoID0gaHVlMSArIDM2MCAtIGh1ZTA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaCA9IGh1ZTEgLSBodWUwO1xuICAgICAgfVxuICAgICAgaHVlID0gaHVlMCArIGYgKiBkaDtcbiAgICB9IGVsc2UgaWYgKCFpc05hTihodWUwKSkge1xuICAgICAgaHVlID0gaHVlMDtcbiAgICAgIGlmICgobGJ2MSA9PT0gMSB8fCBsYnYxID09PSAwKSAmJiBtICE9PSAnaHN2Jykge1xuICAgICAgICBzYXQgPSBzYXQwO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzTmFOKGh1ZTEpKSB7XG4gICAgICBodWUgPSBodWUxO1xuICAgICAgaWYgKChsYnYwID09PSAxIHx8IGxidjAgPT09IDApICYmIG0gIT09ICdoc3YnKSB7XG4gICAgICAgIHNhdCA9IHNhdDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGh1ZSA9IE51bWJlci5OYU47XG4gICAgfVxuICAgIGlmIChzYXQgPT0gbnVsbCkge1xuICAgICAgc2F0ID0gc2F0MCArIGYgKiAoc2F0MSAtIHNhdDApO1xuICAgIH1cbiAgICBsYnYgPSBsYnYwICsgZiAqIChsYnYxIC0gbGJ2MCk7XG4gICAgcmV0dXJuIHJlcyA9IGNocm9tYVttXShodWUsIHNhdCwgbGJ2KTtcbiAgfTtcblxuICBfaW50ZXJwb2xhdG9ycyA9IF9pbnRlcnBvbGF0b3JzLmNvbmNhdCgoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbiwgbywgcmVmLCByZXN1bHRzO1xuICAgIHJlZiA9IFsnaHN2JywgJ2hzbCcsICdoc2knLCAnaGNsJywgJ2xjaCddO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKG8gPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcbiAgICAgIG0gPSByZWZbb107XG4gICAgICByZXN1bHRzLnB1c2goW20sIGludGVycG9sYXRlX2hzeF0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfSkoKSk7XG5cbiAgaW50ZXJwb2xhdGVfbnVtID0gZnVuY3Rpb24oY29sMSwgY29sMiwgZiwgbSkge1xuICAgIHZhciBuMSwgbjI7XG4gICAgbjEgPSBjb2wxLm51bSgpO1xuICAgIG4yID0gY29sMi5udW0oKTtcbiAgICByZXR1cm4gY2hyb21hLm51bShuMSArIChuMiAtIG4xKSAqIGYsICdudW0nKTtcbiAgfTtcblxuICBfaW50ZXJwb2xhdG9ycy5wdXNoKFsnbnVtJywgaW50ZXJwb2xhdGVfbnVtXSk7XG5cbiAgaW50ZXJwb2xhdGVfbGFiID0gZnVuY3Rpb24oY29sMSwgY29sMiwgZiwgbSkge1xuICAgIHZhciByZXMsIHh5ejAsIHh5ejE7XG4gICAgeHl6MCA9IGNvbDEubGFiKCk7XG4gICAgeHl6MSA9IGNvbDIubGFiKCk7XG4gICAgcmV0dXJuIHJlcyA9IG5ldyBDb2xvcih4eXowWzBdICsgZiAqICh4eXoxWzBdIC0geHl6MFswXSksIHh5ejBbMV0gKyBmICogKHh5ejFbMV0gLSB4eXowWzFdKSwgeHl6MFsyXSArIGYgKiAoeHl6MVsyXSAtIHh5ejBbMl0pLCBtKTtcbiAgfTtcblxuICBfaW50ZXJwb2xhdG9ycy5wdXNoKFsnbGFiJywgaW50ZXJwb2xhdGVfbGFiXSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCJpbXBvcnQgKiBhcyBjaHJvbWEgZnJvbSAnY2hyb21hLWpzJztcblxuZXhwb3J0IGNvbnN0IGNvbnN0YW50cyA9IE9iamVjdC5mcmVlemUoZnVuY3Rpb24oKVxue1xuICAgIGxldCBjb25zdGFudHMgPSB7fTtcbiAgICBjb25zdGFudHMuZ2FtZUxvb3BEZWxheU1zID0gMTAwMCAvIDYwOy8vNjA7XG4gICAgcmV0dXJuIGNvbnN0YW50cztcbn0oKSk7XG5cbmV4cG9ydCBjbGFzcyBXaWRnZXRcbntcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudHMgID0gb3B0aW9ucy5ldmVudHMgfHwgW107XG4gICAgICAgIHRoaXMuZ3JpZCAgICA9IG9wdGlvbnMuZ3JpZDtcbiAgICAgICAgdGhpcy5raW5kcyAgID0gb3B0aW9ucy5raW5kcyB8fCB7fTtcbiAgICAgICAgdGhpcy5vYmplY3RzID0gb3B0aW9ucy5vYmplY3RzIHx8IFtdO1xuICAgICAgICB0aGlzLnRyYWNrZXIgPSBvcHRpb25zLnRyYWNrZXI7XG5cbiAgICAgICAgdGhpcy5jYW52YXMgID0gb3B0aW9ucy5jYW52YXM7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IG9wdGlvbnMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LnNjYWxlKHRoaXMuY2FudmFzLndpZHRoIC8gdGhpcy5ncmlkLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQgLyB0aGlzLmdyaWQuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IDAuMDU7XG5cbiAgICAgICAgdGhpcy5ldmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5tb3ZlbWVudEluZGV4ID0gMDtcblxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgIHBlcmZvcm0oZXZlbnRzKVxuICAgIHtcbiAgICAgICAgdGhpcy5ldmVudHMucHVzaC5hcHBseSh0aGlzLmV2ZW50cywgZXZlbnRzKTtcbiAgICB9XG5cbiAgICByb3VuZFJlY3QoY3R4LCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCByYWRpdXMsIGZpbGwsIHN0cm9rZSlcbiAgICB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3Ryb2tlID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzdHJva2UgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcmFkaXVzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmFkaXVzID0gNTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHJhZGl1cyA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHJhZGl1cyA9IHt0bDogcmFkaXVzLCB0cjogcmFkaXVzLCBicjogcmFkaXVzLCBibDogcmFkaXVzfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBkZWZhdWx0UmFkaXVzID0ge3RsOiAwLCB0cjogMCwgYnI6IDAsIGJsOiAwfTtcbiAgICAgICAgICAgIGZvciAodmFyIHNpZGUgaW4gZGVmYXVsdFJhZGl1cykge1xuICAgICAgICAgICAgICAgIHJhZGl1c1tzaWRlXSA9IHJhZGl1c1tzaWRlXSB8fCBkZWZhdWx0UmFkaXVzW3NpZGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKHggKyByYWRpdXMudGwsIHkpO1xuICAgICAgICBjdHgubGluZVRvKHggKyB3aWR0aCAtIHJhZGl1cy50ciwgeSk7XG4gICAgICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSwgeCArIHdpZHRoLCB5ICsgcmFkaXVzLnRyKTtcbiAgICAgICAgY3R4LmxpbmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQgLSByYWRpdXMuYnIpO1xuICAgICAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHggKyB3aWR0aCAtIHJhZGl1cy5iciwgeSArIGhlaWdodCk7XG4gICAgICAgIGN0eC5saW5lVG8oeCArIHJhZGl1cy5ibCwgeSArIGhlaWdodCk7XG4gICAgICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHkgKyBoZWlnaHQsIHgsIHkgKyBoZWlnaHQgLSByYWRpdXMuYmwpO1xuICAgICAgICBjdHgubGluZVRvKHgsIHkgKyByYWRpdXMudGwpO1xuICAgICAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4ICsgcmFkaXVzLnRsLCB5KTtcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIGlmIChmaWxsKSB7XG4gICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cm9rZSkge1xuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKClcbiAgICB7XG4gICAgICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG5cbiAgICAgICAgY29uc3QgYm94U2l6ZSA9IDAuODtcbiAgICAgICAgY29uc3Qgc3BhY2luZyA9ICgxIC0gYm94U2l6ZSkgLyAyO1xuXG4gICAgICAgIGZvciAoY29uc3Qgb2JqZWN0IG9mIHRoaXMub2JqZWN0cylcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3QgY2xvbmVYID0gb2JqZWN0LnggLSB0aGlzLmdyaWQud2lkdGg7XG4gICAgICAgICAgICBjb25zdCB5ICAgICAgPSBvYmplY3QueSArIHRoaXMubW92ZW1lbnRJbmRleCAvIDU7XG4gICAgICAgICAgICBjb25zdCBraW5kICAgPSB0aGlzLmtpbmRzW29iamVjdC5raW5kXTtcblxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0ga2luZC5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBraW5kLmNvbG9yO1xuXG4gICAgICAgICAgICB0aGlzLnJvdW5kUmVjdCh0aGlzLmNvbnRleHQsXG4gICAgICAgICAgICAgICAgb2JqZWN0LnggKyBzcGFjaW5nLCB5ICsgc3BhY2luZyxcbiAgICAgICAgICAgICAgICBraW5kLnNpemUgLSAyICogc3BhY2luZywgYm94U2l6ZSxcbiAgICAgICAgICAgICAgICAwLjEsIHRydWUsIGZhbHNlKTtcblxuICAgICAgICAgICAgdGhpcy5yb3VuZFJlY3QodGhpcy5jb250ZXh0LFxuICAgICAgICAgICAgICAgIGNsb25lWCArIHNwYWNpbmcsIHkgKyBzcGFjaW5nLFxuICAgICAgICAgICAgICAgIGtpbmQuc2l6ZSAtIDIgKiBzcGFjaW5nLCBib3hTaXplLFxuICAgICAgICAgICAgICAgIDAuMSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudHJhY2tlci5jYXB0dXJlZClcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy50cmFja2VyLmNvbG9yc1s0XTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgICA9IHRoaXMudHJhY2tlci5jb2xvcnNbNF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy50cmFja2VyLmNhcHR1cmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMudHJhY2tlci5jb2xvcnNbdGhpcy5tb3ZlbWVudEluZGV4XTtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgICA9IHRoaXMudHJhY2tlci5jb2xvcnNbdGhpcy5tb3ZlbWVudEluZGV4XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnRyYWNrZXIuZmFkaW5nKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLnRyYWNrZXIuY29sb3JzWzUgLSB0aGlzLm1vdmVtZW50SW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSAgID0gdGhpcy50cmFja2VyLmNvbG9yc1s1IC0gdGhpcy5tb3ZlbWVudEluZGV4XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMudHJhY2tlci5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSB0aGlzLnRyYWNrZXIuY29sb3I7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50RXZlbnQgPSB0aGlzLmN1cnJlbnRFdmVudDtcblxuICAgICAgICBsZXQgdHJhY2tlclBvc2l0aW9uID0gdGhpcy50cmFja2VyLnBvc2l0aW9uO1xuXG4gICAgICAgIGlmIChjdXJyZW50RXZlbnQgJiYgY3VycmVudEV2ZW50Lm1vdmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRyYWNrZXJQb3NpdGlvbiArPSB0aGlzLmN1cnJlbnRFdmVudC5tb3ZlICogdGhpcy5tb3ZlbWVudEluZGV4IC8gNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0cmFja2VyQ2xvbmVQb3NpdGlvbiA9ICh0cmFja2VyUG9zaXRpb24gPCAwXG4gICAgICAgICAgICA/IHRyYWNrZXJQb3NpdGlvbiArIHRoaXMuZ3JpZC53aWR0aCA6IHRyYWNrZXJQb3NpdGlvbiAtIHRoaXMuZ3JpZC53aWR0aCk7XG5cbiAgICAgICAgdGhpcy5yb3VuZFJlY3QodGhpcy5jb250ZXh0LFxuICAgICAgICAgICAgdHJhY2tlclBvc2l0aW9uICsgc3BhY2luZywgdGhpcy5ncmlkLmhlaWdodCAtIDEgKyBzcGFjaW5nLFxuICAgICAgICAgICAgdGhpcy50cmFja2VyLnNpemUgLSAyICogc3BhY2luZywgYm94U2l6ZSxcbiAgICAgICAgICAgIDAuMSwgdHJ1ZSwgZmFsc2UpO1xuXG4gICAgICAgIHRoaXMucm91bmRSZWN0KHRoaXMuY29udGV4dCxcbiAgICAgICAgICAgIHRyYWNrZXJDbG9uZVBvc2l0aW9uICsgc3BhY2luZywgdGhpcy5ncmlkLmhlaWdodCAtIDEgKyBzcGFjaW5nLFxuICAgICAgICAgICAgdGhpcy50cmFja2VyLnNpemUgLSAyICogc3BhY2luZyxcbiAgICAgICAgICAgIGJveFNpemUsIDAuMSwgdHJ1ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGNhbGN1bGF0ZVVwZGF0ZWRQb3NpdGlvbihwb3NpdGlvbiwgbW92ZSlcbiAgICB7XG4gICAgICAgIGxldCB1cGRhdGVkUG9zaXRpb24gPSBwb3NpdGlvbiArIChtb3ZlIHx8IDApO1xuXG4gICAgICAgIGlmICh1cGRhdGVkUG9zaXRpb24gPCAwKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZFBvc2l0aW9uICsgdGhpcy5ncmlkLndpZHRoO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHVwZGF0ZWRQb3NpdGlvbiA+PSB0aGlzLmdyaWQud2lkdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVkUG9zaXRpb24gLSB0aGlzLmdyaWQud2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlZFBvc2l0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVwZGF0ZWRQb3NpdGlvbjtcbiAgICB9XG5cbiAgICB1cGRhdGUoY3VycmVudFRpbWUpXG4gICAge1xuICAgICAgICBsZXQgdGlja3MgPSAoY3VycmVudFRpbWUgJiYgdGhpcy5sYXN0VXBkYXRlVGltZVxuICAgICAgICAgICAgICAgICAgPyAoY3VycmVudFRpbWUgLSB0aGlzLmxhc3RVcGRhdGVUaW1lKSAvIGNvbnN0YW50cy5nYW1lTG9vcERlbGF5TXMgOiAwKTtcblxuICAgICAgICB0aGlzLmxhc3RVcGRhdGVUaW1lID0gY3VycmVudFRpbWU7XG5cbiAgICAgICAgbGV0IGN1cnJlbnRFdmVudCA9IHRoaXMuY3VycmVudEV2ZW50O1xuICAgICAgICBsZXQgbmV4dEV2ZW50ICAgID0gdGhpcy5uZXh0RXZlbnQ7XG5cbiAgICAgICAgZm9yICg7IHRpY2tzID4gMDsgdGlja3MgLT0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50RXZlbnQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY3VycmVudEV2ZW50ID0gdGhpcy5jdXJyZW50RXZlbnQgPSB0aGlzLmV2ZW50cy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIG5leHRFdmVudCAgICA9IHRoaXMubmV4dEV2ZW50ICAgID0gdGhpcy5ldmVudHMubGVuZ3RoID4gMCA/IHRoaXMuZXZlbnRzWzBdIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIC8vdGhpcy50cmFja2VyLmNhcHR1cmUgICA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vdGhpcy50cmFja2VyLmNvbGxpc2lvbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRFdmVudClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhY2tlci5uZXh0UG9zaXRpb24gPSB0aGlzLmNhbGN1bGF0ZVVwZGF0ZWRQb3NpdGlvbih0aGlzLnRyYWNrZXIucG9zaXRpb24sIGN1cnJlbnRFdmVudC5tb3ZlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFja2VyLmZhZGluZylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFja2VyLmZhZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhY2tlci5jYXB0dXJlZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFja2VyLmNhcHR1cmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYWNrZXIuZmFkaW5nICAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhY2tlci5jYXB0dXJlKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYWNrZXIuY2FwdHVyZSAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhY2tlci5jYXB0dXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEV2ZW50LnNwYXduKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb2JqZWN0ID0gY3VycmVudEV2ZW50LnNwYXduO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnkgICA9IC0xO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzLnB1c2gob2JqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0RXZlbnQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVVcGRhdGVkUG9zaXRpb24odGhpcy50cmFja2VyLm5leHRQb3NpdGlvbiwgbmV4dEV2ZW50Lm1vdmUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3QueSA9PT0gdGhpcy5ncmlkLmhlaWdodCAtIDMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBraW5kID0gdGhpcy5raW5kc1tvYmplY3Qua2luZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG94ID0gKG9iamVjdC54ICsgKHRoaXMuZ3JpZC53aWR0aCAtIHRoaXMudHJhY2tlci5uZXh0UG9zaXRpb24pKSAlIHRoaXMuZ3JpZC53aWR0aDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXB0dXJlID0gb3ggKyBraW5kLnNpemUgPD0gdGhpcy50cmFja2VyLnNpemU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcHR1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhY2tlci5jYXB0dXJlID0gY2FwdHVyZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhY2tlci5jb2xvcnMgID0gY2hyb21hLnNjYWxlKFt0aGlzLnRyYWNrZXIuY29sb3IsIGtpbmQuY29sb3JdKS5tb2RlKCdsY2gnKS5jb2xvcnMoNSwgJ2NzcycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudEV2ZW50KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVtZW50SW5kZXggPSArK3RoaXMubW92ZW1lbnRJbmRleDtcblxuICAgICAgICAgICAgICAgIGlmIChtb3ZlbWVudEluZGV4ID09PSA1KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFja2VyLnBvc2l0aW9uID0gdGhpcy50cmFja2VyLm5leHRQb3NpdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFja2VyLmNhcHR1cmVkKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0cyA9IHRoaXMub2JqZWN0cy5maWx0ZXIob2JqZWN0ID0+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC55ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0LnkgPCB0aGlzLmdyaWQuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRFdmVudCAgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmVtZW50SW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbiJdfQ==
