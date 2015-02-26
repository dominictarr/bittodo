
var util = require('scuttlebot/test/util')

var tape = require('tape')

var BitTodo = require('../api')

var ssb = util.createDB('test-bittodo1')
var pull = require('pull-stream')

var btd = BitTodo(ssb)


tape('create and get a task', function (t) {

  btd.create({
    text: 'create more tests'
  }, function (err, msg) {

    pull(
      btd.list(),
      pull.collect(function (err, ary) {
        console.log(ary)
        t.equal(ary.length, 1)
        t.equal(ary[0].key, msg.key)
        t.equal(ary[0].value.state, 'open')
        btd.update({root: msg.key, state: 'done'}, function (err, _msg) {
          if(err) throw err

          btd.get(msg.key, function (err, task) {
            if(err) throw err
            t.deepEqual(task, {
              key: msg.key,
              value: {
                assigned: [{feed: msg.value.author}],
                created: msg.value.timestamp,
                updated: _msg.value.timestamp,
                text: 'create more tests',
                state: 'done'
              },
              leaves: [{msg: _msg.key}]
            })
            t.end()
          })
        })
      })
    )
  })
})


tape('add and remove dependency links', function (t) {

  btd.create({
    text: 'dependee task'
  }, function (err, msg) {
    btd.create({
      text: 'dependant task',
      depends: [{msg: msg.key}]
    }, function (err, msg2) {
      btd.get(msg2.key, function (err, task) {
        t.deepEqual(task.value.depends, 
          [{msg: msg.key}]
        )
        btd.update({root: msg2.key, depends: [
          {msg: msg.key, retract: true}
        ]}, function (err) {
          btd.get(msg2.key, function (err, task) {
            t.deepEqual(task.value.depends, [])
            t.end()
          })
        })
      })
    })

  })

})


tape('cannot depend on the same task twice', function (t) {

  btd.create({
    text: 'dependee task'
  }, function (err, msg) {
    btd.create({
      text: 'dependant task',
      depends: [{msg: msg.key}]
    }, function (err, msg2) {
      btd.update({root: msg2.key, depends: [
        {msg: msg.key}
      ]}, function (err) {
        btd.get(msg2.key, function (err, task) {
          t.deepEqual(task.value.depends, [{msg: msg.key}])
          t.end()
        })
      })
    })

  })

})

