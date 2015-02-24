var getLinks = require('ssb-msgs').getLinks

module.exports = function (_msgs, rel) {

  // optimistically sort by something that
  // will *probably* be casually ordered.

  var msgs = {}, count = 0
  _msgs.slice().sort(function (a, b) {
    return a.value.timestamp - b.value.timestamp
  }).forEach(function (msg) {
    msgs[msg.key] = msg
    count ++
  })


  var seen = {}, sorted = [], links = {}

  for(var key in msgs) {
    var msg = msgs[key]
    var l = links[key] =
      getLinks(msg.value)
        .filter(function (s) { return rel === s.rel && msgs[s.msg] })

    if(!l.length) {sorted.push(msg); seen[msg.key] = true }
  }

  var better = true
  while(better) {
    better = false
    for(var key in msgs) {
      if(!seen[key]) {
        var found = true
        for(var j in links[key])
          if(!seen[links[key][j].msg]) {
            found = false; break;
          }
        if(found) {
          sorted.push(links[key] = msgs[key])
          seen[key] = true
          better = true
        }
      }
    }
  }

  if(sorted.length !== count)
    throw new Error('could not sort causal order')

  return sorted
}
