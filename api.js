var isHash = require('ssb-keys').isHash
var cont = require('cont')
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var defer = require('pull-defer')

var BitTodo = require('./')

function isString (s) {
  return 'string' === typeof s
}

function isMsgLink (value) {
  if(Array.isArray(value)) return value.every(isMsgLink)
  return value && isHash(value.msg) && isString(value.rel)
}

function validate (e) {
  var msg = e.value || e
  //a task must be type=task
  if(!/^_?task?$/.test(msg.content.type)) return false
  if(msg.content.parent) {
    if(!(isMsgLink(msg.content.parent)
      && isMsgLink(msg.content.root))
    ) return false
  }
  return true
}

var isArray = Array.isArray

function toArray(str) {
  return isArray(str) ? str : [str]
}

function toMsg (hash) {
  if(hash.msg) return hash
  return {msg: hash}
}

function toFeed (hash) {
  return {feed: hash}
}


function createTask (id, opts) {

  var content = {type: 'task'}

  if(!isString(opts.text))
    throw new Error('createTask: must have text: description')
  content.text = opts.text

  if(!opts.assigned)
    content.assigned = [{feed: id}]
  else
    content.assigned = toArray(opts.assigned).map(toFeed)

  if(opts.depends)
    content.depends = toArray(opts.depends).map(toMsg)

  if(opts.estimate)
    content.estimate = opts.estimate

  content.state = 'open'

  return content
}

function amendTask (id, task, opts) {

  var content = {type: '_task'}

  // handle removing links to other entities
  // (assigned feeds, and depended on tasks)

  if(opts.unassign)
    content.assigned = toArray(opts.unassign).map(function (hash) {
      return {feed: hash, revoke: true}
    })

  if(opts.undepends)
    content.depends = toArray(opts.undepends).map(function (hash) {
      return {msg: hash, revoke: true}
    })

  if(opts.assigned)
    content.assigned = toArray(opts.assigned).map(toFeed)

  if(opts.depends)
    content.depends = toArray(opts.depends).map(toMsg)

  if(opts.text)
    content.text = opts.text

  if(opts.estimate)
    content.estimate = opts.estimate

  if(opts.state === 'done' || opts.state === 'open')
    content.state = opts.state


  content.root = {msg: task.key}
  content.branch = task.leaves || [{msg: task.key}]

  return content
}


module.exports = function (rpc, id) {


  //if rpc is actually a sbot instance, it will have .feed property.
  if(!id) id = rpc.feed.id

  var query = rpc.query || rpc.ssb.query
  var add = rpc.add || rpc.ssb.add

  function get (key, cb) {
    (rpc['get'] || rpc.ssb['get'])(key, function (err, msg) {
      if(err) throw err
      if(!msg.key)
        msg = {key: key, value: msg}
      hydrate(msg, cb)
    })
  }

  function hydrate (msg, cb) {

    if(!msg.key)
      return cb(new Error('msg should be in {key, value: msg} form'))
    pull(
      query([
                         // v change to "object" ? or "dataset" ?
        {path: ['content', 'root', 'msg'], eq: msg.key},
                                      // v change to taskMod
        {path: ['content', 'type'], eq: '_task'},
      ]),
      pull.filter(validate),
      pull.collect(function (err, ary) {
        ary.unshift(msg)
        cb(err, BitTodo.apply(ary, BitTodo.reduce))
      })
    )
  }

  function tasks (id) {
    return pull(
      query([
        {path: ['content', 'assigned', true, 'feed'], eq: id},
        {path: ['content', 'type'], eq: 'task'},
      ]),
      pull.filter(function (msg) {
        return validate(msg)
      }),
      paramap(hydrate)
    )

  }

  var blockedBy = cont(function (key, cb) {

    var isOpen = cont(function isOpen (key, cb) {
      key = key.msg || key
      get(key, function (err, task) {
        if(err) cb(err)
        cb(null, task.value.state === 'open' ? task : null)
      })
    })

    get(key, function (err, task) {
      if (err) return cb(err)

      if(task.value.state === 'done' || !task.value.depends)
        return cb(null, [])
      else
        cont.para(task.value.depends.map(function (key) {
          return isOpen(key)
        })) (function (err, ary) {
          cb(null, ary.filter(Boolean))
        })
    })
  })

  return {
    create: function (opts, cb) {
      add(createTask(id, opts), cb)
    },
    update: function (opts, cb) {
      get(opts.root, function (err, task) {
        if(err) return cb(err)
        add(amendTask(id, task, opts), cb)
      })
    },
    get: function (key, cb) {
      get(key, cb)
    },
    list: function (_id) {
      return tasks(_id || id)
    },
    blockedBy: blockedBy,
    actionable: function (_id) {
      return pull(
        tasks(_id || id),
        pull.filter(function (task) {
          return task.value.state === 'open'
        }),
        paramap(function (task, cb) {
          blockedBy(task.key, function (err, tasks) {
            cb(err, !tasks.length ? task : null)
          })
        }),
        pull.filter()
      )
    },
    blocked:  function (_id) {
      return pull(
        tasks(_id || id),
        pull.filter(function (task) {
          return task.value.state === 'open'
        }),
        paramap(function (task, cb) {
          blockedBy(task.key, function (err, tasks) {
            if(!tasks.length) return cb(err)
            task.blockedBy = tasks.map(function (t) {
              return {msg: t.key}
            })
            cb(err, task)
          })
        }),
        pull.filter()
      )
    },

    blockers: function (_id) {
      return pull(
        tasks(_id || id),
        pull.filter(function (task) {
          return task.value.state === 'open'
        }),
        paramap(function (task, cb) {
          blockedBy(task.key, cb)
        }),
        pull.flatten(),
        pull.unique('key')
      )
    }
  }
}
