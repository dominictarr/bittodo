
var isArray = Array.isArray

module.exports = function (msgs, rel) {

  // iterate through the list, and find the msgs that
  // are not linked to.

  var heads = {}
  msgs.forEach(function (m) {
    heads[m.key] = m
  })

  msgs.forEach(function (m) {
    if(!isArray(m.value.content[rel])) return
    m.value.content[rel].forEach(function (link) {
      if(link.msg) delete heads[link.msg]
    })
  })

  var ary = []

  for(var k in heads)
    ary.push(heads[k])

  return ary
}
