@ddp = new RxDDP 'wss://www.discover-jeju.com/websocket'
ddp.connect()
  .subscribe ->
    document.getElementById 'connecting'
      .classList.add '숨김'
    document.getElementById 'signInForm'
      .classList.remove '숨김'
    loginButton = document.getElementById 'login'
    Rx.Observable.fromEvent loginButton, 'click'
      .subscribe (e)->
        e.preventDefault()
        login$ = ddp.callStream 'login', [
          user:
            username: loginForm.username.value
          password:
            digest: SHA256 loginForm.password.value
            algorithm: 'sha-256'
        ]
        login$.subscribe (o)-> console.log "login", o
        users$ = ddp.getCollection 'users'
          .filter (o)-> o.msg is "added"
        isLoggedIn$ = login$.combineLatest users$
          .filter ([login, users])-> login.id is users.id
        isLoggedIn$.subscribe ->
          console.log 'logged in'
          document.getElementById 'signInForm'
            .classList.add '숨김'
          loginButton.classList.remove '안됨'
          loginButton.removeAttribute 'disabled'
          login$.unsubscribe()
          users$.unsubscribe()
          isLoggedIn$.unsubscribe()

    # get featured tours
    ddp.subscribeStream 'getFeaturedTour'
      .subscribe console.log
    tours$ = ddp.getCollection 'tours'
      .filter (o)->o.msg is 'added'
      .map (o)->o.fields
    document.getElementById('tours').innerHTML = ''
    tours$.subscribe (tour)->
      toursList = document.getElementById('tours')
      toursList.innerHTML = "#{toursList.innerHTML}\n<dt>#{tour.title}</dt><dd>#{tour.subtitle}</dd>"
ddp.closeObservable.subscribe (o)->
  console.log "disconnected", o