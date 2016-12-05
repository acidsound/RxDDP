# RxDDP

A RxJS-Based Meteor DDP client.

# Dependencies

* RxJS 5.0+

# Methods

* connect() - Starts a Websocket connection. returns Observable which subscribes on successful connection.

```
ddp = new RxDDP 'ws://whereyougo.com/websocket'
ddp.connect.subscribe ->
  console.log 'connected'
```

* close() - Ends a Websocket connection.
* callStream() - call Meteor method. return Observable which susbscribes with any returned data.
* subscribeStream - subscribes to server publications on the server. returns Observable which subscribes on successful. 

# Properties

* closeObservable - returns Observable which subscribes on close connection.