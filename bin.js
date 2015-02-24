#! /usr/bin/env node

var client = require('scuttlebot/client')
var config = require('ssb-config')
var ssbKeys = require('ssb-keys')
var path = require('path')
var explain = require('explain-error')
var fs = require('fs')
var pull = require('pull-stream')
var paramap = require('pull-paramap')
var stringify = require('pull-stringify')
var minimist = require('minimist')
var cont = require('cont')

var manifestFile = path.join(config.path, 'manifest.json')

var manifest
try {
  manifest = JSON.parse(fs.readFileSync(manifestFile))
} catch (err) {
  throw explain(err,
    'could not load manifest file'
    + '- should be generated first time server is run'
  )
}

var keys = ssbKeys.loadOrCreateSync(path.join(config.path, 'secret'))

var rpc = client(config, manifest)

rpc.auth(ssbKeys.signObj(keys, {
    role: 'client',
    ts: Date.now(),
    public: keys.public
  }), function (err) {
    //give up.
    if(err) throw err
  })

var BitTodo = require('./')

function isString (s) {
  return 'string' === typeof s
}

var isHash = ssbKeys.isHash

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

//when do we need many to many?

function hydrate (msg, cb) {
  pull(
    rpc.query([
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
    rpc.query([
      {path: ['content', 'assigned', true, 'feed'], eq: id},
      {path: ['content', 'type'], eq: 'task'},
    ]),
    pull.filter(function (msg) {
      return validate(msg)
    }),
    paramap(hydrate)
  )

}

var isArray = Array.isArray

function toArray(str) {
  return isArray(str) ? str : [str]
}

function toMsg (hash) {
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

function get (key, cb) {
  rpc.get(key, function (err, msg) {
    if(err) throw err
    msg = {key: key, value: msg}
    hydrate(msg, cb)
  })
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

var opts = minimist(process.argv.slice(2))
var cmd = opts._.shift()
var arg = opts._.shift()
delete opts._

if(cmd === 'create')
  rpc.add(createTask(keys.id, opts), function (err, msg) {
    if(err) throw err
    console.log(JSON.stringify(msg, null, 2))
    process.exit()
  })

else if(cmd === 'amend') {
  get(arg, function (err, msg) {
    var _task = amendTask(keys.id, msg, opts)
    rpc.add(_task, function (err, _msg) {
      console.log(JSON.stringify(_msg, null, 2))
      process.exit()
    })
  })
}

else if(cmd === 'done') {

  get(arg, function (err, task) {
    if(task.value.state === 'done')
      throw new Error('task:' + task.key + ' is already done!')

    var _task = amendTask(keys.id, task, {state: 'done'})
    rpc.add(_task, function (err, _msg) {
      console.log(JSON.stringify(_msg, null, 2))
      process.exit()
    })
  })

}

else if(cmd === 'list') {
  pull(
    tasks(arg || keys.id),
    pull.drain(function (msg) {
      console.log(JSON.stringify(msg, null, 2) + '\n')
    }, function (err) {
      if(err) throw err
      process.exit()
    })
  )
}

else if(cmd === 'get') {
  var key = arg
  get(arg, function (err, task) {
    if(err) throw err
    console.log(JSON.stringify(task, null, 2))
    process.exit()
  })
}

else if(cmd === 'blockedBy') {
  blockedBy(arg, function (err, blocked) {
    if(err) throw err
    console.log(JSON.stringify(blocked, null, 2))
    process.exit()
  })
}

else if(cmd === 'actionable') {

  pull(
    tasks(arg || keys.id),
    pull.filter(function (task) {
      return task.value.state === 'open'
    }),
    paramap(function (task, cb) {
      blockedBy(task.key, function (err, tasks) {
        cb(err, !tasks.length ? task : null)
      })
    }),
    pull.filter(),
    pull.drain(function (msg) {
      console.log(JSON.stringify(msg, null, 2) + '\n')
    }, function (err) {
      if(err) throw err
      process.exit()
    })
  )
}


else if(cmd === 'unactionable') {

  pull(
    tasks(arg || keys.id),
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
    pull.filter(),
    pull.drain(function (msg) {
      console.log(JSON.stringify(msg, null, 2) + '\n')
    }, function (err) {
      if(err) throw err
      process.exit()
    })
  )
}

else if(cmd === 'blockers') {
  pull(
    tasks(arg || keys.id),
    pull.filter(function (task) {
      return task.value.state === 'open'
    }),
    paramap(function (task, cb) {
      blockedBy(task.key, cb)
    }),
    pull.flatten(),
    pull.unique('key'),
    pull.drain(function (msg) {
      console.log(JSON.stringify(msg, null, 2) + '\n')
    }, function (err) {
      if(err) throw err
      process.exit()
    })
  )

}


else {
  console.error('bittodo cmd {opts}')
  process.exit(1)
}
