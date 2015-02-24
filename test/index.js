
var tape = require('tape')
var BitTodo = require('../')
var sort = require('../sort')

var author = "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s"
var tasks = [
  {
    "key": "KZFrAFHwzEZrhX81KdJU1t73V4XqoLBs3eG/UD/GRVg=.blake2s",
    "ts": 1423541850369,
    "value": {
      "previous": "n+NMJJstS21FX5vXnLlE59NcrYkQVaVs6zVc0/Uz/f8=.blake2s",
      "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
      "sequence": 107,
      "timestamp": 1423541850157,
      "hash": "blake2s",
      "content": {
        "type": "task",
        "state": "open",
        "estimate": "2m",
        "text": "make this task as done"
      },
      "signature": "0Dcbb3gdS2o+s2cYP7PRxJ//FvsHgu4Xd83aLmFKJKbP0J3uJ6J1ejOp0rL1w4IsE19zjXBeLwV8QRx2skOV+Q==.blake2s.k256"
    }
  },

  {
    "key": "PkD8uzIIygf4l14+fjN1FiJItxfDdmXBhXWAnuXmTUY=.blake2s",
    "ts": 1423541916982,
    "value": {
      "previous": "KZFrAFHwzEZrhX81KdJU1t73V4XqoLBs3eG/UD/GRVg=.blake2s",
      "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
      "sequence": 108,
      "timestamp": 1423541916778,
      "hash": "blake2s",
      "content": {
        "type": "task",
        "state": "done",
        "updates": {
          "msg": "KZFrAFHwzEZrhX81KdJU1t73V4XqoLBs3eG/UD/GRVg=.blake2s",
          "rel": "updates"
        }
      },
      "signature": "+G7M9hrxQp2B6agEeH8F+skefGovXT5r4ZeYi9S1fvlCXEMEcVYr2jxxrcN0VrRQLDrImu/+71cjkzBP9C1rBQ==.blake2s.k256"
    }
  }
]

tape('initial', function (t) {
  var state = BitTodo.reduce(null, tasks[0].value)

  t.deepEqual(state, {
    assigned: [{feed: author, rel: 'assigned'}],
    state: 'open',
    estimate: '2m',
    text: 'make this task as done',
  })

  state = BitTodo.reduce(state, tasks[1].value)

  t.deepEqual(state, {
    assigned: [{feed: author, rel: 'assigned'}],
    state: 'done',
    estimate: '2m',
    text: 'make this task as done',
  })

  t.end()

})

tape('updates', function (t) {

  var state = BitTodo.apply(tasks, BitTodo.reduce)
  t.deepEqual(state, {
    assigned: [{feed: author, rel: 'assigned'}],
    state: 'done',
    estimate: '2m',
    text: 'make this task as done',
    updates: [{msg: tasks[1].key, rel: 'updates'}]
  })

  t.end()
})

tape('sort', function (t) {
  console.log(sort(tasks.reverse()))
  t.end()
})
