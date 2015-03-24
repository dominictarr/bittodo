var sortBy = require('./sort')

var isArray = Array.isArray

var keywords = ['type', 'branch', 'root']

function clone (e) {
  return JSON.parse(JSON.stringify(e))
}

exports.reduce = function (state, msg) {

  if(!state) state = {}

  if(!state.created) state.created = msg.timestamp

  state.updated = Math.max(state.updated || 0, msg.timestamp)

  for(var k in msg.content)
    if(!~keywords.indexOf(k)) {

      if(isArray(state[k])) {
        var ary = toArray(msg.content[k])
        var o = {}
        state[k].forEach(function (link) {
          o[link.msg || link.feed] = link
        })
        toArray(msg.content[k]).forEach(function (link) {
          if(link.retract) delete o[link.msg || link.feed]
          else             o[link.msg || link.feed] = link
        })
        state[k] = Object.keys(o).sort().map(function (key) {
          return o[key]
        })
      }
      else
        state[k] = clone(msg.content[k]) || state[k]
    }
  return state
}

var heads = require('./heads')

function sort (states) {
  //TODO actually calculate causal order.
  return sortBy(states, 'branch')
}

function merge (a, b) {
  return {
    depends: mergeLinks(a.depends, b.depends),
    state: b.state || a.state,
    text: b.text || a.text,
    assigned: mergeLinks(a.assigned, b.assigned)
  }
}

function validate (a, state) {
  return (
    (a.depends && msgLinks(a.depends)) &&
    (!a.state || a.state === 'open' || a.state == 'close') &&
    feedLinks(a.assigned) &&
    contains(state.assigned, a.author)
  )
}

function toArray(ary) {
  return clone(
    Array.isArray(ary) ? ary
  : null == ary ? []
  : [ary]
  )

}

exports.apply = function (msgs, reduce) {

  var rel = 'branch'
  //sort into causal order
  msgs = sort(msgs)
  var h = msgs[0]
  var state = null
  var updates = []
  msgs.forEach(function (msg) {
    //calculate next state.
    state = reduce(state, msg.value)
    var _updates = toArray(msg.value.content[rel])
  })

  return {
    key: msgs[0].key,
    value: state,
    leaves: heads(msgs, 'branch').map(function (e) {
      return {msg: e.key}
    })}
}
