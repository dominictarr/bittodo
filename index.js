var sortBy = require('./sort')

var keywords = ['type', 'branch', 'root']

function clone (e) {
  return JSON.parse(JSON.stringify(e))
}

exports.reduce = function (state, msg) {

  if(!state) state = {}

  for(var k in msg.content)
    if(!~keywords.indexOf(k))
      state[k] = clone(msg.content[k]) || state[k]

  return state
}

var heads = require('./heads')

function sort (states) {
  //TODO actually calculate causal order.
  return sortBy(states, 'branch')
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
