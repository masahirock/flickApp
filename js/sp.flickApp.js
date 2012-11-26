(function() {
  var FlickAppAnimate, FlickAppArticle, FlickAppDeviceControl, FlickAppEvents, FlickAppModel, FlickAppRecommend, FlickAppRecommendEvent, FlickAppRecommendView, FlickAppRecommnedAnimate, FlickAppSwipeButtonEvent, FlickAppTouches, FlickAppTransformCSS, FlickAppViewInit, FlickAppViews, FlickAppWindowEvents, toucheValues,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  this.ns = {};

  FlickAppModel = (function(_super) {
    var _this = this;

    __extends(FlickAppModel, _super);

    function FlickAppModel() {
      return FlickAppModel.__super__.constructor.apply(this, arguments);
    }

    FlickAppModel.configure('FlickAppModel', 'name', 'articleUrl', 'imagePath', 'photoNo', 'imageEl');

    FlickAppModel.init = function(options) {
      var ajaxOpt, def, param, url,
        _this = this;
      param = options['ajaxOpt'];
      this.options = options;
      this.apiUrl = "" + param.url;
      this.pvUrl = "" + param.pvUrl;
      this.storageFlag = this.storageApi.isStorage();
      url = "" + this.apiUrl + param.pageNo;
      ajaxOpt = {
        type: 'GET',
        dataType: 'json',
        jsonpCallback: null,
        success: null
      };
      return def = this.getApi(url, ajaxOpt).done(function(res) {
        var loadPages, maxsize, url2, url3, url4, url5, xhr2, xhr3, xhr4, xhr5, xhr6;
        if (res != null) {
          maxsize = res['flickListSize'];
          _this.pageDetail(maxsize);
          switch (_this.start) {
            case 1:
              loadPages = [maxsize - 1, maxsize, 2, 3];
              break;
            case 2:
              loadPages = [maxsize, 1, 3, 4];
              break;
            case 3:
              loadPages = [1, 2, 4, 5];
              break;
            case maxsize:
              loadPages = [maxsize - 2, maxsize - 1, 1, 2];
              break;
            case maxsize - 1:
              loadPages = [maxsize - 3, maxsize - 2, maxsize, 1];
              break;
            case maxsize - 2:
              loadPages = [maxsize - 4, maxsize - 3, maxsize - 1, maxsize];
              break;
            default:
              loadPages = [_this.start - 2, _this.start - 1, _this.start + 1, _this.start + 2];
          }
          url2 = "" + _this.apiUrl + loadPages[0];
          url3 = "" + _this.apiUrl + loadPages[1];
          url4 = "" + _this.apiUrl + loadPages[2];
          url5 = "" + _this.apiUrl + loadPages[3];
          xhr2 = _this.apiPipes(def, function() {
            return _this.getApi(url2, ajaxOpt);
          });
          xhr3 = _this.apiPipes(def, function() {
            return _this.getApi(url3, ajaxOpt);
          });
          xhr4 = _this.apiPipes(def, function() {
            return _this.getApi(url4, ajaxOpt);
          });
          xhr5 = _this.apiPipes(def, function() {
            return _this.getApi(url5, ajaxOpt);
          });
          xhr6 = _this.apiPipes(def, function() {
            return _this.getApi(_this.pvUrl + _this.start, ajaxOpt);
          });
          return $.when(xhr2, xhr3, xhr4, xhr5).then(function(res2, res3, res4, res5) {
            var i, xhrData, _i;
            xhrData = [res2[0], res3[0], res, res4[0], res5[0]];
            for (i = _i = 0; _i <= 5; i = ++_i) {
              _this.refresh(xhrData[i]['flickList'][0]);
              if (i === 4) {
                _this.trigger('initializeApi');
                return;
              }
            }
          });
        } else {
          return _this.reject();
        }
      });
    };

    FlickAppModel.storageApi = {
      isStorage: function() {
        if (window.sessionStorage != null) {
          return true;
        } else {
          FlickAppModel.articleRecords = {};
          return false;
        }
      },
      set: function(keyName, data) {
        var storageObj;
        storageObj = JSON.stringify(data);
        return window.sessionStorage.setItem(keyName, storageObj);
      },
      get: function(key) {
        var storageObj;
        return storageObj = window.sessionStorage.getItem(key);
      },
      search: function(key) {
        var item;
        item = window.sessionStorage[key];
        if (item === void 0) {
          return false;
        } else {
          return true;
        }
      }
    };

    FlickAppModel.storageDeferred = function(data) {
      var parseData, xhr;
      xhr = $.Deferred();
      parseData = {
        "flickList": [JSON.parse(data)]
      };
      return xhr.resolve(parseData);
    };

    FlickAppModel.fetchApi = function(prm) {
      var ajaxOpt, def, isStorageItem, recordArry, url,
        _this = this;
      url = "" + this.apiUrl + prm.apiNumber;
      if (this.storageFlag) {
        isStorageItem = this.storageApi.search(prm.apiNumber);
      }
      ajaxOpt = {
        type: 'GET',
        dataType: 'json',
        jsonpCallback: null,
        success: null
      };
      if (!isStorageItem || !this.storageFlag) {
        def = this.getApi(url, ajaxOpt);
      } else {
        def = this.storageDeferred(this.storageApi.get(prm.apiNumber));
      }
      recordArry = this.all();
      return $.when(def).then(function(res) {
        _this.trigger('bindTouchEvent');
        _this.unbind('bindTouchEvent');
        if (!isStorageItem || _this.storageFlag) {
          _this.storageApi.set(res['flickList'][0]['photoNo'], res['flickList'][0]);
        }
        _this.refresh(res['flickList'][0], {
          clear: true
        });
        _this.trigger('fetchApi', prm.apiNumber, prm.currentNumber);
        _this.unbind('fetchApi');
        return _this.getApi(_this.pvUrl + prm.currentNumber, ajaxOpt);
      });
    };

    FlickAppModel.pageDetail = function(n) {
      if (this.options['ajaxOpt']['pageNo'] != null) {
        this.start = this.options['ajaxOpt']['pageNo'] >> 0;
      } else {
        this.start = 1;
      }
      return this.maxsize = n;
    };

    FlickAppModel.getApi = function(url, prm) {
      var xhr;
      if (typeof xhr !== "undefined" && xhr !== null) {
        xhr = $.Deferred();
      }
      return xhr = $.ajax({
        url: url,
        type: prm['type'],
        dataType: prm['dataType'],
        jsonpCallback: prm['jsonpCallback']
      });
    };

    FlickAppModel.apiPipes = function(def, callback) {
      var xhr;
      return xhr = def.pipe(callback);
    };

    FlickAppModel.reject = function() {
      this.trigger('rejected');
    };

    return FlickAppModel;

  }).call(this, Spine.Model);

  toucheValues = {
    currentNumber: 1,
    slideCounter: 0,
    elementCounter: 2
  };

  FlickAppTouches = (function() {

    function FlickAppTouches() {
      this.end = __bind(this.end, this);

      this.move = __bind(this.move, this);

      this.start = __bind(this.start, this);
      this.moveInit = {
        swipeTimeThreshold: 10
      };
    }

    FlickAppTouches.prototype.hasTouch = function() {
      if (window.ontouchstart === null) {
        return true;
      } else {
        return false;
      }
    };

    FlickAppTouches.prototype.hasTouchesEvent = function(e, useTimeStamp) {
      var touches;
      if (e.touches != null) {
        touches = e.touches[0];
        if (useTimeStamp) {
          this.moveInit.timeStamp = +new Date();
        }
      } else if (e.originalEvent.touches) {
        touches = e.originalEvent.touches[0];
        if (useTimeStamp) {
          this.moveInit.timeStamp = e.timeStamp;
        }
      }
      return touches;
    };

    FlickAppTouches.prototype.start = function(e) {
      var point;
      if (this.hasTouch) {
        point = this.hasTouchesEvent(e, true);
      } else {
        point = e;
        this.moveInit.timeStamp = +new Date();
      }
      this.moveInit.startX = point.pageX;
      this.moveInit.pointX = point.pageX;
      this.moveInit.startY = point.pageY;
      this.moveInit.pointY = point.pageY;
      this.moveInit.derectionX = 0;
      this.moveInit.sx = point.clientX;
      return this.moveInit.sy = point.clientY;
    };

    FlickAppTouches.prototype.move = function(e) {
      var distanceX, distanceY, mx, my, point, targetX, targetY;
      e.preventDefault();
      if (this.hasTouch) {
        point = this.hasTouchesEvent(e, false);
      } else {
        point = e;
      }
      targetX = point.pageX;
      targetY = point.pageY;
      mx = point.clientX;
      my = point.clientY;
      distanceX = this.moveInit.pointX - targetX;
      distanceY = this.moveInit.pointY - targetY;
      this.moveInit.pointX = targetX;
      this.moveInit.pointY = targetY;
      this.moveInit.pointX = this.moveInit.pointX - this.moveInit.startX;
      return this.moveInit.pointY = this.moveInit.pointY - this.moveInit.startY;
    };

    FlickAppTouches.prototype.end = function(e) {
      var distanceX, distanceY, endTime;
      endTime = +new Date();
      distanceX = this.moveInit.pointX - this.moveInit.startX;
      distanceY = this.moveInit.pointY - this.moveInit.startY;
      this.moveInit.diffTime = endTime - this.moveInit.timeStamp;
      this.moveInit.distX = Math.sqrt(distanceX * distanceX);
      this.moveInit.distY = Math.sqrt(distanceY * distanceY);
      if (this.moveInit.pointX < 0) {
        return this.moveInit.flicked = 'left';
      } else if (this.moveInit.pointX > 0) {
        return this.moveInit.flicked = 'right';
      }
    };

    return FlickAppTouches;

  })();

  FlickAppTransformCSS = (function() {

    function FlickAppTransformCSS() {}

    FlickAppTransformCSS.prototype.type3D = function(param) {
      var transformProp;
      if (param.transformPos !== "") {
        transformProp = "translate3d(" + param.transformPos + ")";
      } else {
        transformProp = "";
      }
      return $(param.item).css({
        webkitTransitionProperty: param.transitionPrm.property,
        webkitTransitionDuration: param.transitionPrm.duration,
        webkitTransitionTimingFunction: param.transitionPrm.easing,
        webkitTransitionDelay: param.transitionPrm.delay,
        webkitTransform: transformProp
      });
    };

    return FlickAppTransformCSS;

  })();

  FlickAppAnimate = (function() {

    function FlickAppAnimate(parent) {
      this.fetchCallback = __bind(this.fetchCallback, this);

      this.bindTouchEvent = __bind(this.bindTouchEvent, this);
      this.parent = parent;
      this.transform = new FlickAppTransformCSS;
      toucheValues.currentNumber = FlickAppModel.options['ajaxOpt']['pageNo'] >> 0;
    }

    FlickAppAnimate.prototype.moveStatus = function(prmObj) {
      var touchAction;
      if (prmObj.distX === 0) {
        return touchAction = "tap";
      }
      if (Math.abs(prmObj.pointX) > Math.abs(prmObj.pointY)) {
        if (prmObj.diffTime >= prmObj.swipeTimeThreshold) {
          return touchAction = "swipe" + prmObj.flicked;
        }
      }
      if (prmObj.distX > 1) {
        return touchAction = "swipeEnd";
      }
    };

    FlickAppAnimate.prototype.endMoveX = function(el, prmObj) {
      var ex, movePrm, slideBy, status;
      this.parent.flickStatus = status = this.moveStatus(prmObj);
      slideBy = 0;
      if (status === "tap") {
        this.tap();
        return;
      } else if (status === "swipeEnd") {
        return;
      } else {
        ex = {
          property: "all",
          duration: '500ms',
          easing: 'cubic-bezier(0.175, 0.885, 0.320, 1)',
          delay: '0'
        };
        movePrm = {
          item: el,
          x: 0,
          y: 0,
          transitionPrm: ex
        };
        if (status === 'swipeleft') {
          if (toucheValues.elementCounter === 4) {
            toucheValues.elementCounter = -1;
          }
          if (toucheValues.currentNumber === FlickAppModel.maxsize) {
            toucheValues.currentNumber = 0;
          }
          toucheValues.currentNumber += 1;
          toucheValues.slideCounter += 1;
          toucheValues.elementCounter += 1;
          slideBy = -100 * toucheValues.slideCounter;
        } else if (status === 'swiperight') {
          if (toucheValues.elementCounter === 0) {
            toucheValues.elementCounter = 5;
          }
          if (toucheValues.currentNumber === 1) {
            toucheValues.currentNumber = FlickAppModel.maxsize + 1;
          }
          toucheValues.currentNumber -= 1;
          toucheValues.slideCounter -= 1;
          toucheValues.elementCounter -= 1;
          slideBy = -100 * toucheValues.slideCounter;
        } else {
          slideBy = 0;
        }
      }
      movePrm.transformPos = "" + slideBy + "%, 0, 0";
      this.transform.type3D(movePrm);
      return this.touchEndFunc();
    };

    FlickAppAnimate.prototype.tap = function() {
      return this.toolsControl.maneger(true);
    };

    FlickAppAnimate.prototype.touchEndFunc = function() {
      var appArticle, pageParam, _apiPageNumber,
        _this = this;
      _apiPageNumber = function() {
        var _apiNumber, _currentNumber, _maxsize, _param;
        _maxsize = FlickAppModel.maxsize;
        _currentNumber = toucheValues.currentNumber;
        if (_this.parent.flickStatus === "swipeleft") {
          switch (_currentNumber) {
            case _maxsize:
              _apiNumber = 2;
              break;
            case _maxsize - 1:
              _apiNumber = 1;
              break;
            default:
              _apiNumber = _currentNumber + 2;
          }
        } else if (_this.parent.flickStatus === "swiperight") {
          switch (_currentNumber) {
            case 1:
              _apiNumber = _maxsize - 1;
              break;
            case 2:
              _apiNumber = _maxsize;
              break;
            default:
              _apiNumber = _currentNumber - 2;
          }
        }
        return _param = {
          apiNumber: _apiNumber,
          currentNumber: _currentNumber,
          flickstatus: _this.parent.flickStatus
        };
      };
      this.resetTranslate();
      pageParam = _apiPageNumber();
      FlickAppModel.bind('fetchApi', this.fetchCallback);
      FlickAppModel.bind('bindTouchEvent', this.bindTouchEvent);
      appArticle = new FlickAppArticle;
      appArticle.render(pageParam['currentNumber']);
      FlickAppModel.fetchApi(pageParam);
      if (FlickAppModel.options['listPageOpt'] != null) {
        return this.listPages(pageParam);
      }
    };

    FlickAppAnimate.prototype.bindTouchEvent = function() {
      $(this.parent.$el).bind('touchstart', this.parent.touchStart);
      return $(this.parent.$el).bind('touchend', this.parent.touchEnd);
    };

    FlickAppAnimate.prototype.fetchCallback = function(apiNum, currentNum) {
      var appArticle, imageEl, record, views;
      appArticle = new FlickAppArticle;
      appArticle.refreshRecords(apiNum, currentNum, this.parent.flickStatus);
      record = FlickAppModel.recordsValues();
      imageEl = this.selectEl.find('img');
      views = new FlickAppViews;
      return views.refreshImg(imageEl);
    };

    FlickAppAnimate.prototype.listPages = function(apiNumber) {
      var listPageNum, listPageUrl, pageOption;
      pageOption = FlickAppModel.options['listPageOpt'];
      listPageNum = Math.ceil(apiNumber['currentNumber'] / pageOption['maxpage']);
      listPageUrl = "" + pageOption['url'] + listPageNum;
      return $(pageOption['el']).attr('href', "" + listPageUrl);
    };

    FlickAppAnimate.prototype.toolsControl = {
      maneger: function(useraction) {
        if (useraction) {
          this.hide();
          this.clearHideTimer();
        }
        return this.hideTimer();
      },
      hideTimer: function() {
        var _this = this;
        return this.timer = setTimeout(function() {
          var headerClass;
          headerClass = $('header').attr('class');
          if (headerClass === void 0 || headerClass.indexOf('headerShow') !== -1) {
            return _this.hide();
          } else {

          }
        }, 5000);
      },
      hide: function() {
        var headerClass, headerEl, nextBtnEl, prevBtnEl, toolbarClass, toolbarEl;
        headerEl = $('header');
        toolbarEl = $('#toolbar');
        nextBtnEl = $('#nextBtn').find('a');
        prevBtnEl = $('#prevBtn').find('a');
        headerClass = $(headerEl).attr('class');
        toolbarClass = $(toolbarEl).attr('class');
        if (headerClass === void 0 || headerClass === 'fadeIn headerShow') {
          headerEl.removeClass().addClass('fadeOut headerHide');
          toolbarEl.removeClass().addClass('fadeOut toolbarHide');
        } else if (headerClass === 'fadeOut headerHide') {
          headerEl.removeClass().addClass('fadeIn headerShow');
          toolbarEl.removeClass().addClass('fadeIn toolbarShow');
        }
        $(nextBtnEl).toggleClass('hide');
        return $(prevBtnEl).toggleClass('hide');
      },
      clearHideTimer: function() {
        return clearTimeout(this.timer);
      }
    };

    FlickAppAnimate.prototype.resetTranslate = function() {
      var item, replaceEl, translateX;
      if (this.parent.flickStatus === "swipeleft") {
        if (toucheValues.elementCounter === 3) {
          item = $(FlickAppModel.swipeItems[4]);
          replaceEl = $(FlickAppModel.swipeItems[0]);
        } else if (toucheValues.elementCounter === 4) {
          item = $(FlickAppModel.swipeItems[0]);
          replaceEl = $(FlickAppModel.swipeItems[1]);
        } else {
          item = $(FlickAppModel.swipeItems[toucheValues.elementCounter + 1]);
          replaceEl = $(FlickAppModel.swipeItems[toucheValues.elementCounter + 2]);
        }
        translateX = toucheValues.slideCounter + 1;
      } else if (this.parent.flickStatus === "swiperight") {
        if (toucheValues.elementCounter === 0) {
          item = $(FlickAppModel.swipeItems[4]);
          replaceEl = $(FlickAppModel.swipeItems[3]);
        } else if (toucheValues.elementCounter === 1) {
          item = $(FlickAppModel.swipeItems[0]);
          replaceEl = $(FlickAppModel.swipeItems[4]);
        } else {
          item = $(FlickAppModel.swipeItems[toucheValues.elementCounter - 1]);
          replaceEl = $(FlickAppModel.swipeItems[toucheValues.elementCounter - 2]);
        }
        translateX = toucheValues.slideCounter - 1;
      }
      $(item).css({
        webkitTransform: "translate3d(" + (translateX * 100) + "%, 0, 0)"
      });
      $(replaceEl).find('img').attr('src', 'http://stat100.ameba.jp/ofcl/img/screen/sp/portal/flick_dummy.gif').css({
        width: "1px",
        height: "1px"
      });
      this.selectEl = replaceEl;
      return this.parent.el.unbind('touchstart touchend');
    };

    return FlickAppAnimate;

  })();

  FlickAppEvents = (function(_super) {

    __extends(FlickAppEvents, _super);

    function FlickAppEvents() {
      this.touchEnd = __bind(this.touchEnd, this);

      this.touchMove = __bind(this.touchMove, this);

      this.touchStart = __bind(this.touchStart, this);

      var windowEvnet;
      FlickAppEvents.__super__.constructor.apply(this, arguments);
      this.touches = new FlickAppTouches();
      this.touches.el = this.el;
      this.animate = new FlickAppAnimate(this);
      windowEvnet = new FlickAppWindowEvents({
        el: window
      });
    }

    FlickAppEvents.prototype.events = {
      "touchstart": "touchStart",
      "touchmove": "touchMove",
      "touchend": "touchEnd"
    };

    FlickAppEvents.prototype.touchStart = function(e) {
      return this.touches.start(e);
    };

    FlickAppEvents.prototype.touchMove = function(e) {
      return this.touches.move(e);
    };

    FlickAppEvents.prototype.touchEnd = function(e) {
      this.touches.end(e);
      return this.animate.endMoveX(this.el, this.touches.moveInit);
    };

    return FlickAppEvents;

  })(Spine.Controller);

  FlickAppSwipeButtonEvent = (function(_super) {

    __extends(FlickAppSwipeButtonEvent, _super);

    function FlickAppSwipeButtonEvent() {
      FlickAppSwipeButtonEvent.__super__.constructor.apply(this, arguments);
      this.animate = new FlickAppAnimate(this);
    }

    FlickAppSwipeButtonEvent.prototype.events = {
      "click": "clickHandler",
      "touchmove": "move"
    };

    FlickAppSwipeButtonEvent.prototype.move = function(e) {
      return e.preventDefault();
    };

    FlickAppSwipeButtonEvent.prototype.clickHandler = function(e) {
      var el, flicked, moveInit;
      e.preventDefault();
      if (e.currentTarget.id === 'nextBtn') {
        flicked = 'left';
      } else {
        flicked = 'right';
      }
      el = $('#tocuhEventArea');
      moveInit = {
        pointX: 1,
        pointY: 0,
        diffTime: 100,
        swipeTimeThreshold: 0,
        flicked: flicked
      };
      this.animate.toolsControl.clearHideTimer();
      this.animate.endMoveX(el, moveInit);
      return this.animate.toolsControl.maneger();
    };

    return FlickAppSwipeButtonEvent;

  })(Spine.Controller);

  FlickAppDeviceControl = (function(_super) {

    __extends(FlickAppDeviceControl, _super);

    function FlickAppDeviceControl() {
      FlickAppDeviceControl.__super__.constructor.apply(this, arguments);
    }

    FlickAppDeviceControl.prototype.ua = function() {
      var bBrowser, testEl, ua, version;
      bBrowser = {};
      ua = window.navigator.userAgent;
      version = ua.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [];
      testEl = document.createElement('div');
      bBrowser.safari = /Safari/gi.test(window.navigator.appVersion);
      bBrowser.opera = /opera/i.test(ua);
      bBrowser.mozzila = /mozzila/i.test(ua) && !/(compatible|webkit|)/.test(ua);
      bBrowser.android = /android/i.test(ua);
      bBrowser.iphone = /iphone/gi.test(window.navigator.platform);
      bBrowser.version = version[0];
      return bBrowser;
    };

    FlickAppDeviceControl.prototype.deviceHeadBar = function() {
      var bar, height, portrait, tab, ua;
      bar = 0;
      height = screen.height;
      ua = this.ua();
      portrait = window.innerHeight > window.innerWidth;
      $.browser['height'] = window.innerHeight;
      if (!window.navigator.standalone) {
        if (ua.android) {
          if (ua.safari) {
            bar = (window.outerHeight / window.devicePixelRatio) - window.innerHeight;
          }
        } else if (ua.iphone) {
          if (portrait) {
            height = screen.height;
            tab = 40;
          } else {
            height = screen.width;
            tab = 32;
          }
          bar = height - window.innerHeight - (20 + tab);
        }
      }
      return bar;
    };

    FlickAppDeviceControl.prototype.hideAddressBar = function() {
      var bar;
      bar = this.deviceHeadBar();
      $("body").css("height", window.innerHeight + bar);
      return setTimeout(function() {
        return window.scrollTo(0, 1);
      }, 100);
    };

    FlickAppDeviceControl.prototype.orientationType = function(callbackName) {
      var orientType, ua;
      ua = this.ua();
      if (ua.android) {
        if (window.onorientationchange !== void 0 || window.onorientationchange !== null) {
          orientType = {
            "orientationchange": callbackName
          };
        } else {
          orientType = {
            "resize": callbackName
          };
        }
      } else if (ua.iphone) {
        orientType = {
          "orientationchange": callbackName
        };
      } else {
        orientType = {
          "resize": callbackName
        };
      }
      return orientType;
    };

    return FlickAppDeviceControl;

  })(Spine.Controller);

  FlickAppWindowEvents = (function(_super) {

    __extends(FlickAppWindowEvents, _super);

    function FlickAppWindowEvents() {
      FlickAppWindowEvents.__super__.constructor.apply(this, arguments);
      this.device = new FlickAppDeviceControl();
      this.delegateEvents(this.device.orientationType("resetElStyle"));
    }

    FlickAppWindowEvents.prototype.events = {
      "onload": "clearStorage"
    };

    FlickAppWindowEvents.prototype.clearStorage = function() {
      return window.sessionStorage.clear();
    };

    FlickAppWindowEvents.prototype.resetElStyle = function() {
      var _this = this;
      return setTimeout(function() {
        var _bar, _views;
        _this.device.hideAddressBar();
        _bar = _this.device.deviceHeadBar();
        _views = new FlickAppViews({
          el: $('#app')
        });
        return _views.resizeElements(_bar);
      }, 100);
    };

    return FlickAppWindowEvents;

  })(Spine.Controller);

  FlickAppViews = (function(_super) {

    __extends(FlickAppViews, _super);

    function FlickAppViews() {
      this.swipeButtons = __bind(this.swipeButtons, this);

      this.orignImg = __bind(this.orignImg, this);

      this.preload = __bind(this.preload, this);
      FlickAppViews.__super__.constructor.apply(this, arguments);
    }

    FlickAppViews.prototype.preload = function(imagePath) {
      var def, preImg, res;
      if (imagePath != null) {
        res = '';
        def = $.Deferred();
        preImg = new Image();
        preImg.onload = function() {
          return def.resolve(this.src);
        };
        preImg.onerror = function() {
          return def.reject(this.src);
        };
        preImg.src = imagePath;
      }
      return def.promise();
    };

    FlickAppViews.prototype.onloadImg = function(imageEl) {
      var src;
      src = $(imageEl).attr('data-orign');
      return $(imageEl).attr('src', src);
    };

    FlickAppViews.prototype.smallImagePath = function(path) {
      var newPath;
      return newPath = path.replace('.jpg', '_200.jpg');
    };

    FlickAppViews.prototype.imageResizeStyle = function(el, size) {
      var h, scaleH, w;
      if (size != null) {
        if (size['w'] > size['h'] || size['w'] === size['h']) {
          h = 'auto';
          w = '100%';
        } else {
          scaleH = window.innerHeight / size['h'];
          w = Math.floor(size['w'] * scaleH);
          if (window.innerWidth < w) {
            h = 'auto';
            w = '100%';
          } else {
            h = '100%';
            w = 'auto';
          }
        }
        return $(el).css({
          'height': h,
          'width': w
        });
      } else {
        $(el).css({
          'height': 'auto',
          'width': "100%"
        });
        if ($(el).height() > window.innerHeight) {
          return $(el).css({
            'height': '100%',
            'width': 'auto'
          });
        }
      }
    };

    FlickAppViews.prototype.renderImg = function(imageOpt, el) {
      var def, newImg, replacePath,
        _this = this;
      def = $.Deferred();
      replacePath = this.smallImagePath(imageOpt['resizePath']);
      newImg = new Image;
      $(newImg).attr('data-orign', imageOpt['orgPath']).attr('data-resize', replacePath).addClass('userImg');
      this.preload(replacePath).then(function(res) {
        newImg.src = replacePath;
        return def.resolve();
      }, function() {
        newImg.src = 'http://stat100.ameba.jp/ofcl/img/screen/sp/portal/flick_dummy.gif';
        return def.resolve();
      });
      if (imageOpt['w'] === 0) {
        this.imageResizeStyle(newImg);
      } else {
        this.imageResizeStyle(newImg, imageOpt);
      }
      $(el).append(newImg);
      return def.promise();
    };

    FlickAppViews.prototype.refreshImg = function(imageEl) {
      var amember, imagePath, imageResizePath, imageSize, record,
        _this = this;
      _this = this;
      record = FlickAppModel.recordsValues()[0];
      imagePath = "http://stat001.ameba.jp" + record['shortImagePath'];
      imageResizePath = "http://official.stat.ameba.jp/imageResize" + record['shortImagePath'];
      imageSize = {
        w: record['width'],
        h: record['height']
      };
      amember = record['amemberFlag'];
      imageResizePath = this.smallImagePath(imageResizePath);
      imageEl.attr('data-resize', imageResizePath);
      imageEl.attr('data-orign', imagePath);
      if (amember === void 0 || !amember) {
        this.imageResizeStyle(imageEl, imageSize);
        return this.preload(imageResizePath).then(function(res) {
          imageEl.attr('src', res);
          _this.orignImg(imagePath, imageSize, 'loaded');
        }, function(res) {
          return _this.orignImg(imagePath, imageSize, 'timeout');
        });
      } else {
        return imageEl.attr('src', 'http://stat100.ameba.jp/blog/img/user/thumb_amember_80.gif').attr('data-orign', '').attr('data-resize', '').css({
          height: 'auto',
          width: 'auto'
        });
      }
    };

    FlickAppViews.prototype.orignImg = function(imagePath, imageSize, imgLoad) {
      var _this = this;
      return this.preload(imagePath).done(function(res) {
        var findImage, result, _i, _len, _results;
        findImage = document.getElementsByClassName('userImg');
        _results = [];
        for (_i = 0, _len = findImage.length; _i < _len; _i++) {
          result = findImage[_i];
          if (result.getAttribute('data-orign') === res) {
            $(result).attr('src', imagePath);
            if (imageSize['w'] === 0) {
              _results.push(_this.imageResizeStyle($(result)));
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    };

    FlickAppViews.prototype.render = function(imageOpt, count, amember) {
      var amemberImg, childEl, def, itemEl,
        _this = this;
      def = $.Deferred();
      itemEl = $('<div class="swipeItem"><p class="swipeItem-loader"></p></div>');
      childEl = $(itemEl).find('p');
      $(itemEl).css({
        webkitTransform: "translate3d(" + (this.position(count)) + "%, 0, 0)"
      });
      $(childEl).css({
        height: "" + ($('body').height()) + "px",
        width: window.innerWidth
      });
      if (amember === void 0 || !amember) {
        this.touchEl.append(itemEl);
        this.renderImg(imageOpt, childEl).done(function() {
          return def.resolve();
        });
      } else {
        amemberImg = '<img src="http://stat100.ameba.jp/blog/img/user/thumb_amember_80.gif" class="userImg" />';
        childEl.html(amemberImg);
        this.touchEl.append(itemEl);
        def.resolve();
      }
      return def.promise();
    };

    FlickAppViews.prototype.position = function(count) {
      var w;
      switch (count) {
        case 0:
          w = -100 * 2;
          break;
        case 1:
          w = -100 * 1;
          break;
        case 2:
          w = 0;
          break;
        case 3:
          w = 100 * 1;
          break;
        case 4:
          w = 100 * 2;
      }
      return w;
    };

    FlickAppViews.prototype.resizeElements = function(bar) {
      var boxHeight, boxWidth, buttonH, buttonTop, buttons, els, recommend, resultButtons, resultEls, _i, _j, _len, _len1;
      els = $('#tocuhEventArea').find('p');
      buttons = $('div.flickbutton');
      recommend = $('#recMoveArea');
      boxWidth = "" + window.innerWidth + "px";
      boxHeight = "" + (window.innerHeight + bar) + "px";
      buttonH = 32;
      buttonTop = this.swipeButtonsPosition();
      this.el.css({
        height: boxHeight,
        width: boxWidth
      });
      for (_i = 0, _len = els.length; _i < _len; _i++) {
        resultEls = els[_i];
        $(resultEls).css({
          height: boxHeight,
          width: boxWidth
        });
        this.imageResizeStyle($(resultEls).find('img'));
      }
      for (_j = 0, _len1 = buttons.length; _j < _len1; _j++) {
        resultButtons = buttons[_j];
        $(resultButtons).find('p').css({
          top: "" + buttonTop + "px"
        });
      }
      if (recommend.length !== 0) {
        $(recommend).css({
          width: "" + window.innerWidth + "px"
        });
        $(recommend).find('ul').css({
          width: "" + ((window.innerWidth - 70) * 2) + "px"
        });
      }
      return this;
    };

    FlickAppViews.prototype.swipeButtonsPosition = function() {
      var _buttonH, _buttonTop, _headerH, _toolbarH, _windowH;
      if (FlickAppModel.options['isRecommend']) {
        _toolbarH = 73 + $('#blog_area').height();
      } else {
        _toolbarH = $('#toolbar').height();
      }
      _headerH = $('header').height();
      _windowH = window.innerHeight;
      _buttonH = 32;
      _buttonTop = (_windowH - (_toolbarH + _headerH)) / 2 + (_buttonH / 2);
      return _buttonTop;
    };

    FlickAppViews.prototype.swipeButtons = function() {
      var buttonEvent, nextBtn, nextBtnWrap, prevBtn, prevBtnWrap;
      nextBtnWrap = $('<div id="nextBtn" class="flickbutton bounceSet bounceR" />');
      prevBtnWrap = $('<div id="prevBtn" class="flickbutton bounceSet bounceL" />');
      nextBtn = "<a href=\"#\"><p class=\"ripple2\" style=\"top:" + (this.swipeButtonsPosition()) + "px;\"></p><p class=\"ripple\" style=\"top:" + (this.swipeButtonsPosition()) + "px;\"></p></a>";
      prevBtn = "<a href=\"#\"><p class=\"ripple2\" style=\"top:" + (this.swipeButtonsPosition()) + "px;\"></p><p class=\"ripple\" style=\"top:" + (this.swipeButtonsPosition()) + "px;\"></p></a>";
      nextBtnWrap.html(nextBtn);
      prevBtnWrap.html(prevBtn);
      $('body').append(nextBtnWrap).append(prevBtnWrap);
      return buttonEvent = new FlickAppSwipeButtonEvent({
        el: $('.flickbutton')
      });
    };

    return FlickAppViews;

  })(Spine.Controller);

  FlickAppViewInit = (function(_super) {

    __extends(FlickAppViewInit, _super);

    function FlickAppViewInit() {
      this.rejected = __bind(this.rejected, this);

      var device,
        _this = this;
      FlickAppViewInit.__super__.constructor.apply(this, arguments);
      if (FlickAppModel.storageFlag) {
        window.sessionStorage.clear();
      }
      device = new FlickAppDeviceControl();
      device.hideAddressBar();
      FlickAppModel.bind('rejected', this.rejected);
      FlickAppModel.bind('initializeApi', function() {
        var _animate, _appArticle;
        _this.initialize();
        if (FlickAppModel.options['recommendOpt'] != null) {
          FlickAppRecommend.init();
        }
        _appArticle = new FlickAppArticle();
        _appArticle.initialize();
        _animate = new FlickAppAnimate();
        return _animate.toolsControl.maneger(false);
      });
    }

    FlickAppViewInit.prototype.initialize = function() {
      var amember, count, events, i, imageOpt, recordAll, result, toolbar, toolbarWrap, views, _i, _len,
        _this = this;
      recordAll = FlickAppModel.all();
      views = new FlickAppViews({
        el: this.el,
        touchEl: this.touchEl
      });
      count = 0;
      toolbarWrap = $('<div id="toolbar" style="bottom:0px;" />');
      toolbar = "<a id=\"blog_area\" href=\"\"><p id=\"talentName\"></p><p id=\"article\"></p></a>";
      this.el.css({
        height: "" + ($('body').height()) + "px",
        width: "" + window.innerWidth + "px"
      });
      this.touchEl.css({
        height: "100%",
        width: "100%"
      });
      for (i = _i = 0, _len = recordAll.length; _i < _len; i = ++_i) {
        result = recordAll[i];
        imageOpt = {
          orgPath: "http://stat001.ameba.jp" + result['shortImagePath'],
          resizePath: "http://official.stat.ameba.jp/imageResize" + result['shortImagePath'],
          h: result['height'],
          w: result['width']
        };
        amember = result['amemberFlag'];
        views.render(imageOpt, i, amember).done(function() {
          return views.preload(imageOpt['orgPath']).done(function(res) {
            var imageEls;
            imageEls = $('#tocuhEventArea').find('img');
            views.onloadImg($(imageEls[count]));
            FlickAppModel.swipeItems = $('#tocuhEventArea').find('div');
            return count++;
          });
        });
      }
      $(toolbarWrap).html(toolbar);
      $('body').append(toolbarWrap);
      events = new FlickAppEvents({
        el: "#tocuhEventArea"
      });
      FlickAppModel.bind('renderSwipeButtons', views.swipeButtons);
      $('#toolbar').on('touchmove', function(e) {
        return _this.skidbreak(e);
      });
      return $('header').on('touchmove', function(e) {
        return _this.skidbreak(e);
      });
    };

    FlickAppViewInit.prototype.skidbreak = function(e) {
      return e.preventDefault();
    };

    FlickAppViewInit.prototype.rejected = function() {
      var errorEl;
      errorEl = $('<div id="rejectError">表示できるブログ画像はありません</div>');
      return this.el.append(errorEl);
    };

    return FlickAppViewInit;

  })(Spine.Controller);

  FlickAppArticle = (function(_super) {

    __extends(FlickAppArticle, _super);

    function FlickAppArticle() {
      FlickAppArticle.__super__.constructor.apply(this, arguments);
    }

    FlickAppArticle.prototype.initialize = function() {
      var articleOpt, articleValue, attribute, attributeName, key, record, recordNumber, _i, _len;
      record = FlickAppModel.records;
      articleOpt = FlickAppModel.options['articleOpt'];
      attributeName = articleOpt['attrName'];
      articleValue = {};
      for (key in record) {
        recordNumber = record[key][articleOpt['storageKey']];
        articleValue[recordNumber] = {};
        for (_i = 0, _len = attributeName.length; _i < _len; _i++) {
          attribute = attributeName[_i];
          if (attribute === 'title' && record[key]['title'] === void 0) {
            articleValue[recordNumber]['title'] = "この画像の記事を見る";
          } else {
            articleValue[recordNumber][attribute] = record[key][attribute];
          }
        }
        if (FlickAppModel.storageFlag) {
          FlickAppModel.storageApi.set("article-" + recordNumber, articleValue[recordNumber]);
        } else {
          FlickAppModel.articleRecords["" + recordNumber] = articleValue[recordNumber];
        }
      }
      this.render(FlickAppModel.options['ajaxOpt']['pageNo']);
      return FlickAppModel.trigger('renderSwipeButtons');
    };

    FlickAppArticle.prototype.refreshRecords = function(apiNum, currentNum, flickstate) {
      var articleOpt, articleValue, attribute, attributeName, currentRecord, deleteNum, item, key, keyArr, recordNumber, searchKey, _i, _len;
      if (item === void 0) {
        searchKey = "article-" + apiNum;
        item = window.sessionStorage[searchKey];
        articleValue = {};
        currentRecord = FlickAppModel.recordsValues()[0];
        articleOpt = FlickAppModel.options['articleOpt'];
        attributeName = articleOpt['attrName'];
        recordNumber = currentRecord[articleOpt['storageKey']];
        for (_i = 0, _len = attributeName.length; _i < _len; _i++) {
          attribute = attributeName[_i];
          if (attribute === 'title' && currentRecord['title'] === void 0) {
            articleValue['title'] = "この画像の記事を見る";
          } else {
            articleValue[attribute] = currentRecord[attribute];
          }
        }
        if (FlickAppModel.storageFlag) {
          return FlickAppModel.storageApi.set("article-" + recordNumber, articleValue);
        } else {
          keyArr = [];
          for (key in FlickAppModel.articleRecords) {
            keyArr.push(key >> 0);
          }
          if (flickstate === 'swipeleft') {
            switch (currentNum) {
              case FlickAppModel.maxsize:
                deleteNum = FlickAppModel.maxsize - 3;
                break;
              case 1:
                deleteNum = FlickAppModel.maxsize - 2;
                break;
              case 2:
                deleteNum = FlickAppModel.maxsize - 1;
                break;
              case 3:
                deleteNum = FlickAppModel.maxsize;
                break;
              default:
                deleteNum = keyArr[0];
            }
          } else if (flickstate === 'swiperight') {
            switch (currentNum) {
              case 1:
                deleteNum = 4;
                break;
              case FlickAppModel.maxsize:
                deleteNum = 3;
                break;
              case FlickAppModel.maxsize - 1:
                deleteNum = 2;
                break;
              case FlickAppModel.maxsize - 2:
                deleteNum = 1;
                break;
              default:
                deleteNum = keyArr[4];
            }
          }
          delete FlickAppModel.articleRecords[deleteNum];
          return FlickAppModel.articleRecords[apiNum] = articleValue;
        }
      }
    };

    FlickAppArticle.prototype.render = function(currentNum) {
      var articleUrl, articleValue, linkText, name, threeReader, title;
      if (FlickAppModel.storageFlag) {
        articleValue = FlickAppModel.storageApi.get("article-" + currentNum);
        if (articleValue != null) {
          articleValue = JSON.parse(articleValue);
        } else {
          articleValue = {
            name: "取得できませんでした",
            title: "取得できませんでした",
            articleUrl: "取得できませんでした"
          };
        }
      } else {
        articleValue = FlickAppModel.articleRecords[currentNum];
      }
      name = articleValue['name'] || "取得できませんでした";
      title = articleValue['title'] || "取得できませんでした";
      articleUrl = articleValue['articleUrl'] || "http://ameblo.jp/";
      if (FlickAppModel.options['articleOpt']['isRanking']) {
        $('#talentName').html("" + currentNum + "位 " + name);
      } else {
        $('#talentName').html(name);
      }
      $('#blog_area').attr('href', articleUrl);
      $('#article').html(title);
      if (FlickAppModel.options['headerOpt'] != null) {
        threeReader = function() {
          var n, string, _maxLen, _readerStr, _sliceTxt, _strLen, _thatStr;
          string = arguments[0], n = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          _maxLen = n;
          _readerStr = "...";
          _thatStr = string;
          _strLen = _thatStr.length;
          if (_maxLen < _strLen) {
            _sliceTxt = _thatStr.slice(0, _maxLen);
            _thatStr = _sliceTxt + _readerStr;
          }
          return _thatStr;
        };
        linkText = "" + (threeReader(articleValue['name'], 4)) + FlickAppModel.options['headerOpt']['linkText'];
        return $('#linkTop').find('a').attr('href', "" + FlickAppModel.options['headerOpt']['linkTop'] + "?amebaId=" + articleValue['amebaId'] + "&" + FlickAppModel.options['headerOpt']['prop1'] + "=1").html(linkText);
      }
    };

    return FlickAppArticle;

  })(Spine.Controller);

  FlickAppRecommend = (function(_super) {

    __extends(FlickAppRecommend, _super);

    function FlickAppRecommend() {
      return FlickAppRecommend.__super__.constructor.apply(this, arguments);
    }

    FlickAppRecommend.configure('FlickAppRecommend');

    FlickAppRecommend.init = function() {
      var ajaxOpt, recommendOpt, shuffle, url,
        _this = this;
      recommendOpt = FlickAppModel.options['recommendOpt'];
      url = recommendOpt['url'];
      ajaxOpt = {
        data: 'GET',
        dataType: recommendOpt['dataType']
      };
      if (FlickAppModel.options['recommendOpt']['callbackName'] != null) {
        ajaxOpt.jsonpCallback = recommendOpt['callbackName'];
        ajaxOpt.success = function(res) {};
      } else {
        ajaxOpt.success = null;
      }
      shuffle = function(list) {
        var i, j, t;
        i = list.length;
        while (i) {
          j = Math.floor(Math.random() * i);
          t = list[--i];
          list[i] = list[j];
          list[j] = t;
        }
        return list;
      };
      return FlickAppModel.getApi(url, ajaxOpt).done(function(res) {
        var newResponseData;
        newResponseData = shuffle(res).slice(0, 8);
        return _this.refresh(newResponseData);
      });
    };

    return FlickAppRecommend;

  })(Spine.Model);

  FlickAppRecommnedAnimate = (function() {

    function FlickAppRecommnedAnimate() {
      this.transform = new FlickAppTransformCSS();
    }

    FlickAppRecommnedAnimate.prototype.moveX = function(el, param) {
      var ex, movePrm, slideBy;
      ex = {
        property: "all",
        duration: '250ms',
        easing: 'ease-in',
        delay: '0'
      };
      movePrm = {
        item: el,
        x: 0,
        y: 0,
        transitionPrm: ex
      };
      if (param.distX <= 0) {
        return;
      }
      if (param.flicked === 'left') {
        slideBy = -(window.innerWidth / 2) - $(el).find('li').eq(0).width() - 20;
      } else if (param.flicked === 'right') {
        slideBy = 0;
      }
      movePrm.transformPos = "" + slideBy + "px, 0, 0";
      return this.transform.type3D(movePrm);
    };

    return FlickAppRecommnedAnimate;

  })();

  FlickAppRecommendEvent = (function(_super) {

    __extends(FlickAppRecommendEvent, _super);

    function FlickAppRecommendEvent() {
      this.touchEnd = __bind(this.touchEnd, this);

      this.touchMove = __bind(this.touchMove, this);

      this.touchStart = __bind(this.touchStart, this);
      FlickAppRecommendEvent.__super__.constructor.apply(this, arguments);
      this.touches = new FlickAppTouches();
      this.touches.el = this.el;
      this.animate = new FlickAppRecommnedAnimate();
      this.mainAnimate = new FlickAppAnimate();
    }

    FlickAppRecommendEvent.prototype.events = {
      "touchstart": "touchStart",
      "touchmove": "touchMove",
      "touchend": "touchEnd"
    };

    FlickAppRecommendEvent.prototype.touchStart = function(e) {
      this.mainAnimate.toolsControl.clearHideTimer();
      return this.touches.start(e);
    };

    FlickAppRecommendEvent.prototype.touchMove = function(e) {
      return this.touches.move(e);
    };

    FlickAppRecommendEvent.prototype.touchEnd = function(e) {
      this.mainAnimate.toolsControl.maneger();
      this.touches.end(e);
      return this.animate.moveX(this.el, this.touches.moveInit);
    };

    return FlickAppRecommendEvent;

  })(Spine.Controller);

  FlickAppRecommendView = (function(_super) {

    __extends(FlickAppRecommendView, _super);

    function FlickAppRecommendView() {
      this.renderOne = __bind(this.renderOne, this);

      this.render = __bind(this.render, this);
      FlickAppRecommendView.__super__.constructor.apply(this, arguments);
      this.recommendOption = FlickAppModel.options['recommendOpt'];
      FlickAppRecommend.bind('refresh', this.render);
    }

    FlickAppRecommendView.prototype.render = function() {
      var els, listEls, toolbarEl, ulWidth, wrap;
      ulWidth = (window.innerWidth - 70) * 2;
      toolbarEl = $('#toolbar');
      wrap = $('<div id="rec_area" />');
      els = "<p>" + FlickAppModel.options['recommendOpt']['title'] + "</p><div id='recMoveArea' style='width:" + window.innerWidth + "px;'><ul style='width:" + ulWidth + "px;'>";
      listEls = FlickAppRecommend.each(this.renderOne);
      els += listEls.join('') + '</ul></div>';
      wrap.html(els);
      toolbarEl.append(wrap);
      return new FlickAppRecommendEvent({
        el: '#rec_area ul'
      });
    };

    FlickAppRecommendView.prototype.renderOne = function(res) {
      var els;
      if (this.recommendOption['attributeName'] != null) {
        return els = "<li><a href=\"" + res[this.recommendOption['attributeName'][0]] + "\" class=\"noHidden\"><div>\n<span class=\"thumb\"><img src=\"" + res[this.recommendOption['attributeName'][1]] + "\" alt=\"\" class=\"rec_thumb\"></span>\n<span class=\"rec_name\">" + res[this.recommendOption['attributeName'][2]] + "</span></div></a></li>";
      } else {
        return els = "<li><a href=\"" + this.recommendOption['thumbUrl'] + res['amebaId'] + "&amp;pageNo=1\" class=\"noHidden\"><div>\n<span class=\"thumb\"><img src=\"" + this.recommendOption['thumbPath'] + res['amebaId'] + "_48.jpg\" alt=\"\" class=\"rec_thumb\"></span>\n<span class=\"rec_name\">" + res['upperText'] + "</span></div></a></li>";
      }
    };

    FlickAppRecommendView.prototype.clickEvent = function() {
      return $('#rec_area').on('touchstart touchend', 'a', function(e) {
        var opa;
        if (e.type === 'touchstart') {
          opa = .5;
        } else if (e.type === 'touchend') {
          opa = 1;
        }
        return $(this).css({
          opacity: opa
        });
      });
    };

    return FlickAppRecommendView;

  })(Spine.Controller);

  this.ns.FlickAppModel = FlickAppModel;

  this.ns.FlickAppRecommend = FlickAppRecommendView;

  this.ns.FlickAppView = FlickAppViewInit;

}).call(this);
