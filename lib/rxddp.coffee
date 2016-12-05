DDP_VERSIONS = ['1', 'pre2', 'pre1']

class @RxDDP
  constructor: (wsUri)->
    @wsUri = wsUri
    @subs = {}
    @results = {}
    @collections = {}
    @sock
    @closeObservable = new Rx.Subject
  _id: ->
    cnt = 0
    next: -> "#{++cnt}"
  connect: ->
    Rx.Observable.create (conn)=>
      @sock = new WebSocket @wsUri
      @sock.onopen = =>
        @send
          msg: 'connect'
          version: DDP_VERSIONS[0]
          support: DDP_VERSIONS
      @sock.onerror = conn.error
      @sock.onmessage = (msg)=>
        data = JSON.parse msg.data
        eventHandler =
          'connected': (msg)=>
            conn.next msg
          'ping': @pong
          'added': @setCollection
          'removed': @setCollection
          'changed': @setCollection
          'result': @methodResult
          'ready': @readySubscription
          'nosub': @nosubscribe
        eventHandler = eventHandler[data.msg]
        eventHandler and eventHandler data
      @sock.onclose = (status)=>
        @closeObservable.next status
  send: (msg)->
    @sock.send JSON.stringify msg
  pong: => @send msg: 'pong'
  close: -> @sock.close()
  getStream: (id)->
    @results[id] = @results[id] or new Rx.Subject()
    @results[id]
  methodResult: (msg)=>
    @getStream msg.id
      .next msg.result
  callStream: (methodName, params=[])=>
    id = @_id().next()
    @send
      id: id
      msg: 'method'
      method: methodName
      params: params
    @getStream @results[id]
  subscribeStream: (publicationName, params=[])=>
    id = Random.id()
    @send
      id: id
      msg: 'sub'
      name: publicationName
      params: params
    @getStream id
  nosubscribe: (msg)->
    # TODO
  unsubscribe: (id)->
    @send
      id: id
      msg: 'unsub'
  readySubscription: (msg)=>
    for sub in msg.subs
      @getStream @subs[sub]
        .next sub
  setCollection: (msg)=>
    @getStream msg.collection
      .next msg
  getCollection: (collection)=>
    @getStream collection
