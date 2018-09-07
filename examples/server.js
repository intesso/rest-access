const express = require('express')
const app = express()
const jwt = require('express-jwt')
const access = require('../index')

access([
  ['*', '/api/*', 'api:rookie', true],
  [['POST', 'PUT', 'DELETE'], '/api/*', 'api:write'],
  [['GET'], '/api/hello', 'api:read'],
  [['GET'], '/api/bye', 'byer'],
  [['GET'], '/api/info/*', 'api:*'],
  [['GET', 'POST'], '/*', '*']
])

app.use(jwt({ secret: 'shared_secret' })) // authenticate
app.use((req, res, next) => {
  // map req.user.scope (added by express-jwt) to req.permission (used by rest-access)
  req.permission = req.user.scope
  next()
})

app.use(access.middleware()) // restrict access according to definition above

// test endpoints
let hello = 'world'
let sayHi = (req, res) => res.send('hi')
let sayBye = (req, res) => res.send('bye')

app.get('/api/hello', (req, res) => res.send(hello))
app.post('/api/hello', (req, res) => {
  hello = req.body
  res.send(201)
})
app.get('/api/hi', sayHi)
app.get('/api/bye', sayBye)
app.get('/api/info/hi', sayHi)
app.get('/api/info/bye', sayBye)
app.get('/hello', sayHi)

app.listen(8080)
