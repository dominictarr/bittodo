#! /usr/bin/env node

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

var keys = ssbKeys.loadOrCreateSync(config)
var client = require('ssb-client') (config)
var rpc = client

function abortIf(err) {
  if(err) throw err
}

client.connect(abortIf)
.auth(ssbKeys.createAuth(keys), abortIf)

function isEmpty (obj) {
  for(var k in obj) return false
  return true
}


var opts = minimist(process.argv.slice(2))
var cmd = opts._.shift()
var arg = opts._.shift()
delete opts._

var bittodo = require('./api')(rpc, keys.id)

if(bittodo[cmd]) {
  var maybeStream = bittodo[cmd](arg || (isEmpty(opts) ? null : opts), function (err, msg) {
    if(err) throw err
    console.log(JSON.stringify(msg, null, 2))
    process.exit()
  })

  if(maybeStream)
    pull(
      maybeStream,
      pull.drain(function (msg) {
        console.log(JSON.stringify(msg, null, 2) + '\n')
      }, function (err) {
        if(err) throw err
        process.exit()
      })
    )
}

else if(cmd === 'done') {

  bittodo.update({state: 'done', root: arg}, function (err, msg) {
    if(err) throw err
    console.log(JSON.stringify(msg, null, 2))
    process.exit()
  })

}


else {
  console.error('bittodo cmd {opts}')
  process.exit(1)
}
