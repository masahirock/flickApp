#---------------------------------------------
# Class 
# *FlickApp
#
# FrameWork
# * Spine
# * Jquery 1.7 over
#
# Dest
# * sp.flickApp.js
# * sp.flickApp.min.js
# 
# Author
# * mitsumoto masahiro 
#---------------------------------------------

@.ns = {}
#---------------------------------------------
# Model
#---------------------------------------------
class FlickAppModel extends Spine.Model
  @configure 'FlickAppModel', 'name', 'articleUrl', 'imagePath', 'photoNo', 'imageEl'

  @init: (options) ->
    #初回ロード時
    #APIを5枚読み込む
    param = options['ajaxOpt']
    @options = options
    @apiUrl = "#{param.url}"
    @pvUrl = "#{param.pvUrl}"
    @storageFlag = @storageApi.isStorage()

    url = "#{@apiUrl}#{param.pageNo}"

    ajaxOpt =
      type: 'GET'
      dataType: 'json'
      jsonpCallback: null
      success: null

    def = @getApi(url, ajaxOpt).done (res) =>
      if res?
        maxsize = res['flickListSize']
        @pageDetail maxsize
        switch @start
          when 1 then loadPages = [maxsize - 1, maxsize, 2, 3]
          when 2 then loadPages = [maxsize, 1, 3, 4]
          when 3 then loadPages = [1, 2, 4, 5]
          when maxsize then loadPages = [maxsize - 2, maxsize - 1, 1, 2]
          when maxsize - 1 then loadPages = [maxsize - 3, maxsize - 2, maxsize, 1]
          when maxsize - 2 then loadPages = [maxsize - 4, maxsize - 3, maxsize - 1, maxsize]
          else loadPages = [@start - 2, @start - 1, @start + 1, @start + 2]

        url2 = "#{@apiUrl}#{loadPages[0]}"
        url3 = "#{@apiUrl}#{loadPages[1]}"
        url4 = "#{@apiUrl}#{loadPages[2]}"
        url5 = "#{@apiUrl}#{loadPages[3]}"

        xhr2 = @apiPipes def, => @getApi(url2, ajaxOpt)
        xhr3 = @apiPipes def, => @getApi(url3, ajaxOpt)
        xhr4 = @apiPipes def, => @getApi(url4, ajaxOpt)
        xhr5 = @apiPipes def, => @getApi(url5, ajaxOpt)
        xhr6 = @apiPipes def, => @getApi(@pvUrl + @start, ajaxOpt)

        $.when(xhr2, xhr3, xhr4, xhr5).then (res2, res3, res4, res5) =>
          #API全て読み完了したらデータを全て書き込む
          xhrData = [res2[0], res3[0], res, res4[0], res5[0]]
          for i in [0..5]
            @refresh xhrData[i]['flickList'][0]
            if i is 4
              @trigger 'initializeApi'
              return
      else
        @reject()

  @storageApi =
    isStorage: =>
      if window.sessionStorage?
        return true
      else
        FlickAppModel.articleRecords = {}
        return false

    set: (keyName, data) =>
        storageObj = JSON.stringify(data)
        window.sessionStorage.setItem(keyName, storageObj)

    get: (key) ->
        storageObj = window.sessionStorage.getItem(key)
    
    search: (key) ->
      item = window.sessionStorage[key]
      if item is undefined
        return false
      else
        return true
  @storageDeferred: (data) ->
    xhr = $.Deferred()
    parseData = {"flickList":[JSON.parse data]}
    return xhr.resolve parseData

  @fetchApi: (prm) ->
    url = "#{@apiUrl}#{prm.apiNumber}"
    if @storageFlag
      isStorageItem = @storageApi.search(prm.apiNumber)
    ajaxOpt =
      type: 'GET'
      dataType: 'json'
      jsonpCallback: null
      success: null

    if not isStorageItem or not @storageFlag
      def = @getApi(url, ajaxOpt)
    else
      def = @storageDeferred(@storageApi.get prm.apiNumber)

    recordArry = @all()
    $.when(def).then (res) =>
      @trigger 'bindTouchEvent'
      @unbind 'bindTouchEvent'
      if not isStorageItem or @storageFlag then @storageApi.set(res['flickList'][0]['photoNo'], res['flickList'][0])
      @refresh res['flickList'][0], clear:true
      @trigger 'fetchApi', prm.apiNumber, prm.currentNumber
      @unbind 'fetchApi'
      @getApi @pvUrl + prm.currentNumber, ajaxOpt

  @pageDetail: (n) ->
    if @options['ajaxOpt']['pageNo']?
      @start = @options['ajaxOpt']['pageNo'] >> 0
    else
      @start = 1
    @maxsize = n

  @getApi: (url, prm) ->
    if xhr?
      xhr= $.Deferred()
    xhr = $.ajax
      url: url
      type: prm['type']
      dataType: prm['dataType']
      jsonpCallback: prm['jsonpCallback']

  @apiPipes: (def, callback) ->
    xhr = def.pipe callback

  @reject: ->
    @trigger 'rejected'
    return

#---------------------------------------------
# FlickEventController
#---------------------------------------------
toucheValues =
  currentNumber: 1 #API用カウンター　1～MaxSize
  slideCounter: 0 #移動距離（％）設定用カウンター 0～4
  elementCounter: 2 #タグのTranslate書き換え用カウンター　2ｽﾀｰﾄ(真ん中)　0～4

class FlickAppTouches
  #フリックされた時の移動距離とかの計算
  constructor: ->
    @moveInit =
      swipeTimeThreshold: 10

  #タッチイベント検出
  hasTouch: ->
    if window.ontouchstart is null
      true
    else
      false

  #Touches検出
  hasTouchesEvent: (e, useTimeStamp) ->
    if e.touches?
      touches = e.touches[0]
      if useTimeStamp
        @moveInit.timeStamp = +new Date()

    else if e.originalEvent.touches
      touches = e.originalEvent.touches[0]
      if useTimeStamp
        @moveInit.timeStamp = e.timeStamp

    return touches
  
  #画面をタッチした時に呼ぶ
  start: (e) =>
    #if e.tagName isnt 'DIV' then e.preventDefault()
    if @hasTouch
      point = @hasTouchesEvent e, true
    else
      point = e
      @moveInit.timeStamp = +new Date()

    @moveInit.startX = point.pageX#基点X1
    @moveInit.pointX = point.pageX#基点X2
    @moveInit.startY = point.pageY#基点Y1
    @moveInit.pointY = point.pageY#基点Y2
    @moveInit.derectionX = 0
    @moveInit.sx = point.clientX
    @moveInit.sy = point.clientY

  #画面をスワイプした時に呼ぶ
  move: (e) =>
    e.preventDefault()
    if @hasTouch
      point = @hasTouchesEvent e, false
    else
      point = e
    
    targetX = point.pageX #原点X
    targetY = point.pageY #原点Y
    mx = point.clientX
    my = point.clientY
    distanceX = @moveInit.pointX - targetX ##移動距離X、基点2から原点までの距離
    distanceY = @moveInit.pointY - targetY ##移動距離Y、基点2から原点までの距離
    @moveInit.pointX = targetX #基点2に原点をセットする(+1づつ動くようにする)X
    @moveInit.pointY = targetY #基点2に原点をセットする(+1づつ動くようにする)Y
    @moveInit.pointX = @moveInit.pointX - @moveInit.startX
    @moveInit.pointY = @moveInit.pointY - @moveInit.startY

    #if Math.abs(mx - @moveInit.sx) < Math.abs(my - @moveInit.sy)

  #画面から指が離れた時に呼ぶ
  end: (e) =>
    endTime = +new Date()
    distanceX = @moveInit.pointX - @moveInit.startX
    distanceY = @moveInit.pointY - @moveInit.startY
    @moveInit.diffTime = endTime - @moveInit.timeStamp
    @moveInit.distX = Math.sqrt(distanceX * distanceX)
    @moveInit.distY = Math.sqrt(distanceY * distanceY)
    if @moveInit.pointX < 0
      @moveInit.flicked = 'left'
    else if @moveInit.pointX > 0
      @moveInit.flicked = 'right'

class FlickAppTransformCSS
  #CSS3 Transition設定
  constructor: ->

  type3D: (param)->
    unless param.transformPos is ""
      transformProp = "translate3d(#{param.transformPos})"
    else
      transformProp = ""

    $(param.item).css(
      webkitTransitionProperty : param.transitionPrm.property
      webkitTransitionDuration : param.transitionPrm.duration
      webkitTransitionTimingFunction : param.transitionPrm.easing
      webkitTransitionDelay : param.transitionPrm.delay
      webkitTransform: transformProp
    )


class FlickAppAnimate
  #画像を移動させる処理とかAPIを叩くとか
  constructor: (parent) ->
    @parent = parent
    @transform = new FlickAppTransformCSS
    toucheValues.currentNumber = FlickAppModel.options['ajaxOpt']['pageNo'] >> 0
  
  moveStatus: (prmObj)->
    if prmObj.distX is 0
      #Tap判定
      return touchAction = "tap"

    if Math.abs(prmObj.pointX) > Math.abs(prmObj.pointY)
      if prmObj.diffTime >= prmObj.swipeTimeThreshold
        #Flickされた方向を判定
        return touchAction = "swipe#{prmObj.flicked}"

    #translateを0に戻す
    if prmObj.distX > 1
      #Flick終了判定
      return touchAction = "swipeEnd"

  endMoveX: (el, prmObj) ->
    #touchEndHandler
    @parent.flickStatus = status = @moveStatus(prmObj)
    slideBy = 0

    if status is "tap"
      @tap()
      return
    else if status is "swipeEnd"
      return
    else
      ex =
        property: "all"
        duration: '500ms'
        easing: 'cubic-bezier(0.175, 0.885, 0.320, 1)'
        delay: '0'

      movePrm =
        item: el
        x: 0
        y: 0
        transitionPrm: ex

      if status is 'swipeleft'
        
        if toucheValues.elementCounter is 4
          toucheValues.elementCounter = -1
        
        if toucheValues.currentNumber is FlickAppModel.maxsize
          toucheValues.currentNumber = 0
        
        toucheValues.currentNumber += 1
        toucheValues.slideCounter += 1
        toucheValues.elementCounter += 1

        slideBy = -100 * toucheValues.slideCounter

      else if status is 'swiperight'
        if toucheValues.elementCounter is 0
          toucheValues.elementCounter = 5
        
        if toucheValues.currentNumber is 1
          toucheValues.currentNumber = FlickAppModel.maxsize + 1
      
        toucheValues.currentNumber -= 1
        toucheValues.slideCounter -= 1
        toucheValues.elementCounter -= 1

        slideBy = -100 * toucheValues.slideCounter
        
      else
        slideBy = 0

    movePrm.transformPos = "#{slideBy}%, 0, 0"
    @transform.type3D movePrm
    @touchEndFunc()

  tap: ->
    #タップ時の処理を書く
    #ツールバーとかその他機能
    @toolsControl.maneger true

  touchEndFunc: ->
    #DIVの位置更新
    #APIのレスポンスが終わった時のコールバックをバインド
    #TouchEventを再バインドさせる関数をバインドする
    #新しいAPIを呼ぶ

    _apiPageNumber = () =>
      #新規APIのページナンバーをセット　左にフリックされた場合は＋３、右にフリックされた場合は－３
      _maxsize = FlickAppModel.maxsize
      _currentNumber = toucheValues.currentNumber
      
      if @parent.flickStatus is "swipeleft"
        switch _currentNumber
          when _maxsize then _apiNumber = 2
          when _maxsize - 1 then _apiNumber = 1
          else _apiNumber = _currentNumber + 2

      else if @parent.flickStatus is "swiperight"
        switch _currentNumber
          when 1 then _apiNumber = _maxsize - 1
          when 2 then _apiNumber = _maxsize
          else _apiNumber = _currentNumber - 2

      _param =
        apiNumber: _apiNumber
        currentNumber: _currentNumber
        flickstatus: @parent.flickStatus

    @resetTranslate()
    pageParam = _apiPageNumber()
    FlickAppModel.bind 'fetchApi', @fetchCallback
    FlickAppModel.bind 'bindTouchEvent', @bindTouchEvent
    appArticle = new FlickAppArticle
    appArticle.render pageParam['currentNumber']
    FlickAppModel.fetchApi pageParam
    if FlickAppModel.options['listPageOpt']? then @listPages pageParam
  
  bindTouchEvent: =>
    #touchイベントを再バインドさせる
    $(@parent.$el).bind 'touchstart', @parent.touchStart
    $(@parent.$el).bind 'touchend', @parent.touchEnd

  fetchCallback: (apiNum, currentNum) =>
    #新しいAPIの呼び出し処理が終わったら実行される
    #Viewをインスタンス化
    appArticle = new FlickAppArticle
    appArticle.refreshRecords apiNum, currentNum, @parent.flickStatus
    record = FlickAppModel.recordsValues()
    imageEl = @selectEl.find 'img'
    views = new FlickAppViews
    views.refreshImg imageEl

  
  listPages: (apiNumber) ->
    pageOption = FlickAppModel.options['listPageOpt']
    listPageNum = Math.ceil apiNumber['currentNumber'] / pageOption['maxpage']
    listPageUrl = "#{pageOption['url']}#{listPageNum}"
    $(pageOption['el']).attr('href', "#{listPageUrl}")

  toolsControl:

    maneger: (useraction) ->
      if useraction
        @hide()
        @clearHideTimer()
      @hideTimer()

    hideTimer: ->
      @timer = setTimeout () =>
        headerClass = $('header').attr('class')
        if headerClass is undefined or headerClass.indexOf('headerShow') isnt -1
          @hide()
        else
          return
      , 5000

    hide: ->
      headerEl = $ 'header'
      toolbarEl = $ '#toolbar'
      nextBtnEl = $('#nextBtn').find 'a'
      prevBtnEl = $('#prevBtn').find 'a'
      headerClass = $(headerEl).attr 'class'
      toolbarClass = $(toolbarEl).attr 'class'

      if headerClass is undefined or headerClass is 'fadeIn headerShow'
        headerEl.removeClass().addClass 'fadeOut headerHide'
        toolbarEl.removeClass().addClass 'fadeOut toolbarHide'
      else if headerClass is 'fadeOut headerHide'
        headerEl.removeClass().addClass 'fadeIn headerShow'
        toolbarEl.removeClass().addClass 'fadeIn toolbarShow'
      
      $(nextBtnEl).toggleClass 'hide'
      $(prevBtnEl).toggleClass 'hide'
    
    clearHideTimer: ->
      clearTimeout @timer

  resetTranslate: ->
    #swipeItemsを移動させる
    if @parent.flickStatus is "swipeleft"

      if toucheValues.elementCounter is 3
        item = $(FlickAppModel.swipeItems[4])
        replaceEl = $(FlickAppModel.swipeItems[0])

      else if toucheValues.elementCounter is 4
        item = $(FlickAppModel.swipeItems[0])
        replaceEl = $(FlickAppModel.swipeItems[1])
      
      else
        item = $(FlickAppModel.swipeItems[toucheValues.elementCounter + 1])
        replaceEl = $(FlickAppModel.swipeItems[toucheValues.elementCounter + 2])
      translateX = toucheValues.slideCounter + 1
      
    else if @parent.flickStatus is "swiperight"
      

      if toucheValues.elementCounter is 0
        item = $(FlickAppModel.swipeItems[4])
        replaceEl = $(FlickAppModel.swipeItems[3])

      else if toucheValues.elementCounter is 1
        item = $(FlickAppModel.swipeItems[0])
        replaceEl = $(FlickAppModel.swipeItems[4])

      else
        item = $(FlickAppModel.swipeItems[toucheValues.elementCounter - 1])
        replaceEl = $(FlickAppModel.swipeItems[toucheValues.elementCounter - 2])
      
      translateX = toucheValues.slideCounter - 1

    $(item).css(
      webkitTransform: "translate3d(#{translateX * 100}%, 0, 0)"
    )

    $(replaceEl).find('img').attr('src', 'http://stat100.ameba.jp/ofcl/img/screen/sp/portal/flick_dummy.gif').css
      width: "1px"
      height: "1px"
    
    @selectEl = replaceEl
    @parent.el.unbind 'touchstart touchend'

class FlickAppEvents extends Spine.Controller
  constructor: ->
    super
    @touches = new FlickAppTouches()
    @touches.el = @el
    @animate = new FlickAppAnimate @
    windowEvnet = new FlickAppWindowEvents el: window

  events:
    "touchstart": "touchStart"
    "touchmove": "touchMove"
    "touchend": "touchEnd"

  touchStart: (e) =>
    @touches.start e

  touchMove: (e) =>
    @touches.move e
  
  touchEnd: (e) =>
    @touches.end e
    @animate.endMoveX @el, @touches.moveInit

class FlickAppSwipeButtonEvent extends Spine.Controller
  constructor: ->
    super
    @animate = new FlickAppAnimate @

  events:
    "click": "clickHandler"
    "touchmove": "move"
  
  move: (e) ->
    e.preventDefault()

  clickHandler: (e) ->
    e.preventDefault()
    if e.currentTarget.id is 'nextBtn' then flicked = 'left' else flicked = 'right'
    el = $ '#tocuhEventArea'
    moveInit =
      pointX: 1
      pointY: 0
      diffTime: 100
      swipeTimeThreshold: 0
      flicked: flicked

    @animate.toolsControl.clearHideTimer()
    @animate.endMoveX el, moveInit
    @animate.toolsControl.maneger()

class FlickAppDeviceControl extends Spine.Controller
  constructor: ->
    super
  
  ua: ->
    bBrowser = {}
    ua = window.navigator.userAgent
    version = ua.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || []
    testEl = document.createElement('div')

    bBrowser.safari = (/Safari/gi).test(window.navigator.appVersion)
    bBrowser.opera = /opera/i.test(ua)
    bBrowser.mozzila = /mozzila/i.test(ua) && !/(compatible|webkit|)/.test(ua)
    bBrowser.android = /android/i.test(ua)
    bBrowser.iphone = /iphone/gi.test(window.navigator.platform)
    bBrowser.version = version[0]

    return bBrowser

  deviceHeadBar: ->
    bar = 0
    height = screen.height
    ua = @ua()
    portrait =  (window.innerHeight > window.innerWidth)

    $.browser['height'] = window.innerHeight

    if not window.navigator.standalone
      if ua.android
        if ua.safari
          bar = (window.outerHeight/window.devicePixelRatio) - window.innerHeight
      else if ua.iphone
        if portrait
          height = screen.height
          tab = 40
        else
          height = screen.width
          tab = 32
        bar = height - window.innerHeight - (20 + tab)
      
    return bar

  hideAddressBar: ->
    bar = @deviceHeadBar()
    $("body").css("height", window.innerHeight + bar)
    setTimeout () ->
      window.scrollTo(0, 1)
    , 100

  orientationType: (callbackName) ->
    ua = @ua()
    if ua.android
      if window.onorientationchange isnt undefined or window.onorientationchange isnt null
        orientType =
          "orientationchange": callbackName
      else
        orientType =
          "resize": callbackName
    else if ua.iphone
      orientType =
        "orientationchange": callbackName
    else
      orientType =
        "resize": callbackName
    return orientType

class FlickAppWindowEvents extends Spine.Controller
  constructor: ->
    super
    @device = new FlickAppDeviceControl()
    @delegateEvents @device.orientationType "resetElStyle"

  events:
    "onload": "clearStorage"

  clearStorage: ->
    window.sessionStorage.clear()

  resetElStyle: ->
    setTimeout () =>
      @device.hideAddressBar()
      _bar = @device.deviceHeadBar()
      _views = new FlickAppViews el: $('#app')
      _views.resizeElements _bar
    , 100


#---------------------------------------------
# View 
#---------------------------------------------
class FlickAppViews extends Spine.Controller
  constructor: ->
    super
  preload: (imagePath) =>
    if imagePath?
      res = ''
      def = $.Deferred()
      preImg = new Image()
      preImg.onload = ->
        def.resolve @src
      preImg.onerror = ->
        def.reject @src
      preImg.src = imagePath
      
    def.promise()
  
  onloadImg: (imageEl)->
    src = $(imageEl).attr 'data-orign'
    $(imageEl).attr 'src', src

  smallImagePath: (path) ->
    newPath = path.replace('.jpg', '_200.jpg')

  imageResizeStyle: (el, size) ->
    if size?
      if size['w'] > size['h'] or size['w'] is size['h']
          h = 'auto'
          w = '100%'
      else
        scaleH = window.innerHeight/ size['h']
        w = Math.floor size['w'] * scaleH
        if(window.innerWidth < w)
            h = 'auto'
            w = '100%'
        else
          h = '100%'
          w = 'auto'
      $(el).css
        'height': h
        'width': w
    else
      $(el).css
        'height': 'auto'
        'width': "100%"
      if $(el).height() > window.innerHeight
        $(el).css
          'height': '100%'
          'width': 'auto'

   renderImg: (imageOpt, el) ->
    def = $.Deferred()
    replacePath = @smallImagePath imageOpt['resizePath']
    newImg = new Image
    $(newImg).attr('data-orign', imageOpt['orgPath']).attr('data-resize', replacePath).addClass 'userImg'

    @preload(replacePath).then (res) =>
      newImg.src = replacePath
      def.resolve()
    , () ->
      newImg.src = 'http://stat100.ameba.jp/ofcl/img/screen/sp/portal/flick_dummy.gif'
      def.resolve()
    
    if imageOpt['w'] is 0
      @imageResizeStyle newImg
    else
      @imageResizeStyle newImg, imageOpt
    $(el).append newImg
      
    def.promise()
   
  refreshImg: (imageEl) ->
    _this = @
    record = FlickAppModel.recordsValues()[0]
    imagePath = "http://stat001.ameba.jp#{record['shortImagePath']}"
    imageResizePath = "http://official.stat.ameba.jp/imageResize#{record['shortImagePath']}"
    imageSize =
      w: record['width']
      h: record['height']

    amember = record['amemberFlag']
    imageResizePath = @smallImagePath imageResizePath
    imageEl.attr 'data-resize', imageResizePath
    imageEl.attr 'data-orign', imagePath

    if amember is undefined or !amember
      
      @imageResizeStyle imageEl, imageSize
      @preload(imageResizePath).then (res) =>
        imageEl.attr 'src', res
        @orignImg imagePath, imageSize, 'loaded'
        return
      , (res) =>
        @orignImg imagePath, imageSize, 'timeout'
    else
      imageEl.attr('src', 'http://stat100.ameba.jp/blog/img/user/thumb_amember_80.gif')
             .attr('data-orign','')
             .attr('data-resize', '')
             .css
                height: 'auto'
                width: 'auto'

  orignImg: (imagePath, imageSize, imgLoad) =>
    @preload(imagePath).done (res) =>
      findImage = document.getElementsByClassName 'userImg'
      for result in findImage
        if result.getAttribute('data-orign') is res
          $(result).attr 'src', imagePath
          if imageSize['w'] is 0
            @imageResizeStyle $(result)

  render: (imageOpt, count, amember) ->
    def = $.Deferred()
    itemEl = $('<div class="swipeItem"><p class="swipeItem-loader"></p></div>')
    childEl = $(itemEl).find 'p'
    $(itemEl).css( webkitTransform: "translate3d(#{@position count}%, 0, 0)" )
    $(childEl).css(
      height: "#{$('body').height()}px"
      width: window.innerWidth
    )
    if amember is undefined or !amember
      @touchEl.append itemEl
      @renderImg(imageOpt, childEl).done () =>
        def.resolve()
    else
      amemberImg = '<img src="http://stat100.ameba.jp/blog/img/user/thumb_amember_80.gif" class="userImg" />'
      childEl.html amemberImg
      @touchEl.append itemEl
      def.resolve()

    def.promise()
  
  position: (count) ->
    switch count
      when 0 then w = -100 * 2
      when 1 then w = -100 * 1
      when 2 then w = 0
      when 3 then w = 100 * 1
      when 4 then w = 100 * 2
    return w

  resizeElements: (bar) ->
    els = $('#tocuhEventArea').find('p')
    buttons = $ 'div.flickbutton'
    recommend = $ '#recMoveArea'
    boxWidth = "#{window.innerWidth}px"
    boxHeight = "#{window.innerHeight + bar}px"
    buttonH = 32
    buttonTop = @swipeButtonsPosition()
    
    @el.css
      height: boxHeight
      width: boxWidth
    for resultEls in els
      $(resultEls).css
        height: boxHeight
        width: boxWidth
      @imageResizeStyle $(resultEls).find('img')

    for resultButtons in buttons
      $(resultButtons).find('p').css
        top: "#{buttonTop}px"

    unless recommend.length is 0
      $(recommend).css
        width: "#{window.innerWidth}px"
      $(recommend).find('ul').css
        width: "#{(window.innerWidth - 70) * 2}px"
    @

  swipeButtonsPosition: ->
    if FlickAppModel.options['isRecommend']
      _toolbarH = 73 + $('#blog_area').height()
    else
      _toolbarH = $('#toolbar').height()
    
    _headerH = $('header').height()
    _windowH = window.innerHeight
    _buttonH = 32
    _buttonTop = ( _windowH - (_toolbarH + _headerH) ) / 2 + (_buttonH / 2)
    return _buttonTop

  swipeButtons: =>
    nextBtnWrap = $ '<div id="nextBtn" class="flickbutton bounceSet bounceR" />'
    prevBtnWrap = $ '<div id="prevBtn" class="flickbutton bounceSet bounceL" />'

    nextBtn = """
      <a href="#"><p class="ripple2" style="top:#{@swipeButtonsPosition()}px;"></p><p class="ripple" style="top:#{@swipeButtonsPosition()}px;"></p></a>
    """
    prevBtn = """
      <a href="#"><p class="ripple2" style="top:#{@swipeButtonsPosition()}px;"></p><p class="ripple" style="top:#{@swipeButtonsPosition()}px;"></p></a>
    """
    nextBtnWrap.html nextBtn
    prevBtnWrap.html prevBtn
    
    $('body').append(nextBtnWrap).append prevBtnWrap
    buttonEvent = new FlickAppSwipeButtonEvent el: $ '.flickbutton'

class FlickAppViewInit extends Spine.Controller
  constructor: ->
    super
    if FlickAppModel.storageFlag then window.sessionStorage.clear()
    device = new FlickAppDeviceControl()
    device.hideAddressBar()
    FlickAppModel.bind 'rejected', @rejected
    FlickAppModel.bind 'initializeApi', =>
      @initialize()
      if FlickAppModel.options['recommendOpt']? then FlickAppRecommend.init()
      _appArticle = new FlickAppArticle()
      _appArticle.initialize()
      _animate = new FlickAppAnimate()
      _animate.toolsControl.maneger false

  initialize: ->
    recordAll = FlickAppModel.all()
    views = new FlickAppViews
        el: @el
        touchEl: @touchEl

    count = 0
    toolbarWrap = $ '<div id="toolbar" style="bottom:0px;" />'
    toolbar = """
      <a id="blog_area" href=""><p id="talentName"></p><p id="article"></p></a>
    """
    @el.css
      height: "#{$('body').height()}px"
      width: "#{window.innerWidth}px"

    @touchEl.css
      height: "100%"
      width: "100%"
     
    for result, i in recordAll
      imageOpt =
        orgPath: "http://stat001.ameba.jp#{result['shortImagePath']}"
        resizePath: "http://official.stat.ameba.jp/imageResize#{result['shortImagePath']}"
        h: result['height']
        w: result['width']
      amember = result['amemberFlag']
      views.render(imageOpt, i, amember).done () ->
        views.preload(imageOpt['orgPath']).done (res) ->
          imageEls = $('#tocuhEventArea').find 'img'
          views.onloadImg $(imageEls[count])
          FlickAppModel.swipeItems = $('#tocuhEventArea').find 'div'
          count++

    $(toolbarWrap).html(toolbar)
    $('body').append toolbarWrap
    events = new FlickAppEvents el: "#tocuhEventArea"
    FlickAppModel.bind 'renderSwipeButtons', views.swipeButtons

    $('#toolbar').on 'touchmove', (e) =>
      @skidbreak e
    $('header').on 'touchmove', (e) =>
      @skidbreak e
      
  skidbreak: (e) ->
    e.preventDefault()

  rejected: =>
    errorEl = $ '<div id="rejectError">表示できるブログ画像はありません</div>'
    @el.append errorEl

#---------------------------------------------
# ArticleView 
#---------------------------------------------
class FlickAppArticle extends Spine.Controller
  constructor: ->
    super
  
  initialize: ->
    record = FlickAppModel.records
    articleOpt = FlickAppModel.options['articleOpt']
    attributeName =  articleOpt['attrName']
    articleValue = {}
    for key of record
      recordNumber = record[key][articleOpt['storageKey']]
      articleValue[recordNumber] = {}
      for attribute in attributeName

        if attribute is 'title' and record[key]['title'] is undefined
          articleValue[recordNumber]['title'] = "この画像の記事を見る"
        else
          articleValue[recordNumber][attribute] = record[key][attribute]

      if FlickAppModel.storageFlag
        FlickAppModel.storageApi.set "article-#{recordNumber}", articleValue[recordNumber]
      else
        FlickAppModel.articleRecords["#{recordNumber}"] = articleValue[recordNumber]
    
    @render FlickAppModel.options['ajaxOpt']['pageNo']
    FlickAppModel.trigger 'renderSwipeButtons'
  
  refreshRecords: (apiNum, currentNum, flickstate) ->
    
    if item is undefined
      searchKey = "article-#{apiNum}"
      item = window.sessionStorage[searchKey]
      articleValue = {}
      currentRecord = FlickAppModel.recordsValues()[0]
      articleOpt = FlickAppModel.options['articleOpt']
      attributeName = articleOpt['attrName']
      recordNumber = currentRecord[articleOpt['storageKey']]


      for attribute in attributeName
        if attribute is 'title' and currentRecord['title'] is undefined
          articleValue['title'] = "この画像の記事を見る"
        else
          articleValue[attribute] = currentRecord[attribute]
            
      if FlickAppModel.storageFlag
        FlickAppModel.storageApi.set "article-#{recordNumber}", articleValue
      else
        keyArr = []
        for key of FlickAppModel.articleRecords
           keyArr.push key >> 0
        if flickstate is 'swipeleft'
          switch currentNum
            when FlickAppModel.maxsize then deleteNum = FlickAppModel.maxsize - 3
            when 1 then deleteNum = FlickAppModel.maxsize - 2
            when 2 then deleteNum = FlickAppModel.maxsize - 1
            when 3 then deleteNum = FlickAppModel.maxsize
            else
              deleteNum = keyArr[0]

        else if flickstate is 'swiperight'
          switch currentNum
            when 1 then deleteNum = 4
            when FlickAppModel.maxsize then deleteNum = 3
            when FlickAppModel.maxsize - 1 then deleteNum = 2
            when FlickAppModel.maxsize - 2 then deleteNum = 1
            else
              deleteNum = keyArr[4]

        delete FlickAppModel.articleRecords[deleteNum]
        FlickAppModel.articleRecords[apiNum] = articleValue
      
  render: (currentNum) ->
    if FlickAppModel.storageFlag
      articleValue = FlickAppModel.storageApi.get "article-#{currentNum}"
      if articleValue?
        articleValue = JSON.parse articleValue
      else
        articleValue =
          name:"取得できませんでした"
          title: "取得できませんでした"
          articleUrl: "取得できませんでした"
    else
      articleValue =  FlickAppModel.articleRecords[currentNum]

    name = articleValue['name'] || "取得できませんでした"
    title = articleValue['title'] || "取得できませんでした"
    articleUrl = articleValue['articleUrl'] || "http://ameblo.jp/"
    
    if FlickAppModel.options['articleOpt']['isRanking']
      $('#talentName').html "#{currentNum}位 #{name}"
    else
      $('#talentName').html name

    $('#blog_area').attr 'href', articleUrl
    $('#article').html title

    if FlickAppModel.options['headerOpt']?
      threeReader = (string, n...) ->
        _maxLen = n
        _readerStr = "..."
        _thatStr = string
        _strLen = _thatStr.length

        if _maxLen < _strLen
          _sliceTxt = _thatStr.slice 0, _maxLen
          _thatStr = _sliceTxt + _readerStr
        
        return _thatStr

      linkText = "#{threeReader(articleValue['name'], 4)}#{FlickAppModel.options['headerOpt']['linkText']}"
      $('#linkTop').find('a').attr('href', "#{FlickAppModel.options['headerOpt']['linkTop']}?amebaId=#{articleValue['amebaId']}&#{FlickAppModel.options['headerOpt']['prop1']}=1").html(linkText)
  

#---------------------------------------------
# Recommend Model
#---------------------------------------------
class FlickAppRecommend extends Spine.Model
  @configure 'FlickAppRecommend'
  
  @init: ->
    recommendOpt = FlickAppModel.options['recommendOpt']
    url = recommendOpt['url']
    ajaxOpt =
      data: 'GET'
      dataType: recommendOpt['dataType']
    if FlickAppModel.options['recommendOpt']['callbackName']?
      ajaxOpt.jsonpCallback = recommendOpt['callbackName']
      ajaxOpt.success = (res) ->
    else
      ajaxOpt.success = null

    shuffle = (list) ->
      i = list.length
      while(i)
        j = Math.floor(Math.random() * i)
        t = list[--i]
        list[i] = list[j]
        list[j] = t
      return list
    
    FlickAppModel.getApi(url, ajaxOpt).done (res) =>
      newResponseData = shuffle(res).slice 0, 8
      @refresh newResponseData

#---------------------------------------------
# Recommend Controller
#---------------------------------------------
class FlickAppRecommnedAnimate
  constructor: ->
    @transform = new FlickAppTransformCSS()

  moveX: (el, param) ->
    ex =
      property: "all"
      duration: '250ms'
      easing: 'ease-in'
      delay: '0'

    movePrm =
      item: el
      x: 0
      y: 0
      transitionPrm: ex

    if param.distX <= 0
      return
    if param.flicked is 'left'
      slideBy = -(window.innerWidth / 2) - $(el).find('li').eq(0).width() - 20
    else if param.flicked is 'right'
      slideBy = 0

    movePrm.transformPos = "#{slideBy}px, 0, 0"
    @transform.type3D movePrm

class FlickAppRecommendEvent extends Spine.Controller
  constructor: ->
    super
    @touches = new FlickAppTouches()
    @touches.el = @el
    @animate = new FlickAppRecommnedAnimate()
    @mainAnimate = new FlickAppAnimate()

  events:
    "touchstart": "touchStart"
    "touchmove": "touchMove"
    "touchend": "touchEnd"

  touchStart: (e) =>
    @mainAnimate.toolsControl.clearHideTimer()
    @touches.start e

  touchMove: (e) =>
    @touches.move e
  
  touchEnd: (e) =>
    @mainAnimate.toolsControl.maneger()
    @touches.end e
    @animate.moveX @el, @touches.moveInit

#---------------------------------------------
# Recommend View
#---------------------------------------------
class FlickAppRecommendView extends Spine.Controller
  constructor: ->
    super
    @recommendOption = FlickAppModel.options['recommendOpt']
    FlickAppRecommend.bind 'refresh', @render

  render: =>
    ulWidth = ( window.innerWidth - 70 ) * 2
    toolbarEl = $ '#toolbar'
    wrap = $ '<div id="rec_area" />'
    els = "<p>#{FlickAppModel.options['recommendOpt']['title']}</p><div id='recMoveArea' style='width:#{window.innerWidth}px;'><ul style='width:#{ulWidth}px;'>"
    listEls = FlickAppRecommend.each(@renderOne)
    els += listEls.join('') + '</ul></div>'

    wrap.html els
    toolbarEl.append wrap
    #@clickEvent()
    new FlickAppRecommendEvent el: '#rec_area ul'

  renderOne: (res) =>
    if @recommendOption['attributeName']?
      els = """
        <li><a href="#{res[@recommendOption['attributeName'][0]]}" class="noHidden"><div>
        <span class="thumb"><img src="#{res[@recommendOption['attributeName'][1]]}" alt="" class="rec_thumb"></span>
        <span class="rec_name">#{res[@recommendOption['attributeName'][2]]}</span></div></a></li>
      """
    else
      els = """
        <li><a href="#{@recommendOption['thumbUrl']}#{res['amebaId']}&amp;pageNo=1" class="noHidden"><div>
        <span class="thumb"><img src="#{@recommendOption['thumbPath']}#{res['amebaId']}_48.jpg" alt="" class="rec_thumb"></span>
        <span class="rec_name">#{res['upperText']}</span></div></a></li>
      """
  clickEvent: ->
    $('#rec_area').on 'touchstart touchend', 'a', (e) ->
      if e.type is 'touchstart' then opa = .5 else if e.type is 'touchend' then opa = 1
      $(@).css { opacity: opa }

@ns.FlickAppModel = FlickAppModel
@ns.FlickAppRecommend = FlickAppRecommendView
@ns.FlickAppView = FlickAppViewInit


