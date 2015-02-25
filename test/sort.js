
var tape = require('tape')
var BitTodo = require('../')
//concurrent updates...

// create a task, one update adds an estimate
// another update adds a dependency.

// then another task marks it as done.

var tasks = [
{
  "key": "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s",
  "ts": 1423697939082,
  "value": {
    "previous": "HcsYRCD+upad4WgFoag7vbryVlJcqpb7mQCPuVji6Nk=.blake2s",
    "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
    "sequence": 125,
    "timestamp": 1423697939009,
    "hash": "blake2s",
    "content": {
      "type": "task",
      "assigned": [{
          "feed": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2"
        }],
      "text": "create tests for concurrent task updates",
      "state": "open"
    },
    "signature": "HuHGxTBveaSaKpH0enEofcLzMdtIz3kNq6wtpzA+3cGZZzTVA2RC/vWGpGcP7VNbnDB/BvWsjCAxpnOl+71uiQ==.blake2s.k256"
  }
},
{
  "key": "OJl+OUQa919zzmTEWCtn6qJ+RlOpuDHdhs9w4BigTBM=.blake2s",
  "ts": 1423698055570,
  "value": {
    "previous": "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s",
    "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
    "sequence": 126,
    "timestamp": 1423698055472,
    "hash": "blake2s",
    "content": {
      "type": "_task",
      "root": {
        "msg": "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s",
      },
      "depends": [{
        "msg": "KZFrAFHwzEZrhX81KdJU1t73V4XqoLBs3eG/UD/GRVg=.blake2s",
      }]
    },
    "signature": "MrjcLvJLJeo12e+KxmbVbPg7q0z1e2FVN9p9PBvpQ+iqCneM1/3ByHMmw2jiU65hCvnJ0FK4f4nwJdljmfRVXg==.blake2s.k256"
  }
},
{
  "key": "ajOY+MqAzIBY0e28qWgOoeqoXd/QAg2nIhiet9GRsUI=.blake2s",
  "ts": 1423698127380,
  "value": {
    "previous": "OJl+OUQa919zzmTEWCtn6qJ+RlOpuDHdhs9w4BigTBM=.blake2s",
    "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
    "sequence": 127,
    "timestamp": 1423698127304,
    "hash": "blake2s",
    "content": {
      "type": "_task",
      root: {
        msg: "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s",
      },
      branch: [{
        msg: "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s",
      }],
      "estimate": "2h"
    },
    "signature": "5ePyoZwSPxjyIiqJ/hePspwrerGauHFSmx5RZ95waIS5t1dFuEo86/71YCtPtGxYL+AVk9AJf90L8iqTuySWKA==.blake2s.k256"
  }
},
{
  "key": "L1iNExdBkpjz0W+hNok2js5bLJWUvQ5NGuueENyYrk4=.blake2s",
  "ts": 1423701086159,
  "value": {
    "previous": "hWWPoXwM/FKIpfdpoSGtGC2rXT1aBncqaxmIYE8YIfk=.blake2s",
    "author": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2s",
    "sequence": 129,
    "timestamp": 1423701086044,
    "hash": "blake2s",
    "content": {
      "type": "_task",
      root: {
        msg: "IDtUUFgMwxHVyF0+3QO3Z7a0LFZFyIDhTixAg422w+Q=.blake2s"
      },
      "branch": [
        { "msg": "ajOY+MqAzIBY0e28qWgOoeqoXd/QAg2nIhiet9GRsUI=.blake2s" },
        { "msg": "OJl+OUQa919zzmTEWCtn6qJ+RlOpuDHdhs9w4BigTBM=.blake2s" }
      ],
      "state": "done"
    },
    "signature": "3yPmv5TcZDddmO7ZtptWSW608Zar/bfFlvtF/hcEM2Vf1pPcSb2jD7PP2qWSBstHQp8w5DAv0eADS1RZtncfCQ==.blake2s.k256"
  }
}]

var sort = require('../sort')

function toKey(e) {
  return e.key
}
function random () {
  return (Math.random() * 2) - 1
}

var sorted = tasks.map(toKey)

function randomSort(ary) {
  return ary.slice().sort(random)
}

tape('simple', function (t) {
  t.deepEqual(sort(tasks, 'branch'), tasks)
  t.deepEqual(sort(randomSort(tasks), 'branch').map(toKey), sorted)
  t.deepEqual(sort(randomSort(tasks), 'branch').map(toKey), sorted)
  t.deepEqual(sort(randomSort(tasks), 'branch').map(toKey), sorted)
  t.deepEqual(sort(randomSort(tasks), 'branch').map(toKey), sorted)
  t.deepEqual(sort(randomSort(tasks), 'branch').map(toKey), sorted)

  t.end()

})

tape('apply', function (t) {

  t.deepEqual(
    BitTodo.apply(tasks, BitTodo.reduce), {

      key: tasks[0].key,

      value: {
      "text": "create tests for concurrent task updates",
      "state": "done",
      created: tasks[0].value.timestamp,
      updated: tasks[3].value.timestamp,

      "assigned": [{
          "feed": "wuDDnMxVtk8U9hrueDj/T0itgp5HJZ4ZDEJodTyoMdg=.blake2"
        }],

      "depends": [{
        "msg": "KZFrAFHwzEZrhX81KdJU1t73V4XqoLBs3eG/UD/GRVg=.blake2s"
      }],
      "estimate": "2h",
    },
    leaves: [
      {
        "msg": "L1iNExdBkpjz0W+hNok2js5bLJWUvQ5NGuueENyYrk4=.blake2s",
      }
    ]
  })

  t.end()

})
