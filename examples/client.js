require('should')
const test = require('tape')
const superagent = require('superagent')
const jwt = require('jsonwebtoken')
const token = jwt.sign({}, 'shared_secret')
const tokenNotValid = jwt.sign({}, 'bla')
const tokenApiRead = jwt.sign({ scope: ['api:read'] }, 'shared_secret')
const tokenApiWrite = jwt.sign({ scope: ['api:write'] }, 'shared_secret')
const tokenByer = jwt.sign({ scope: ['byer'] }, 'shared_secret')
const baseUrl = 'http://localhost:8080'

test('should not have access without token', t => {
  superagent.get(`${baseUrl}/hello`).catch(e => {
    t.true(e.status.should.be.exactly(401))
    t.end()
  })
})

test('should not have access with wrong token', t => {
  superagent.get(`${baseUrl}/hello`).set('Authorization', `Bearer ${tokenNotValid}`).catch(e => {
    t.true(e.status.should.be.exactly(401))
    t.end()
  })
})

test('should have public access with general token', t => {
  superagent.get(`${baseUrl}/hello`).set('Authorization', `Bearer ${token}`).then(result => {
    t.true(result.status.should.be.exactly(200))
    t.end()
  })
})

test('should not have access with general token to private api', t => {
  superagent
    .get(`${baseUrl}/api/hello`)
    .set('Authorization', `Bearer ${token}`)
    .catch(e => {
      t.true(e.status.should.be.exactly(403))
      t.end()
    })
})

test('should not have access with api:write token to /api/bye', t => {
  superagent
    .get(`${baseUrl}/api/bye`)
    .set('Authorization', `Bearer ${tokenApiWrite}`)
    .catch(e => {
      t.true(e.status.should.be.exactly(403))
      t.end()
    })
})

test('should not have access with api:read token to /api/bye', t => {
  superagent
    .get(`${baseUrl}/api/bye`)
    .set('Authorization', `Bearer ${tokenApiRead}`)
    .catch(e => {
      t.true(e.status.should.be.exactly(403))
      t.end()
    })
})

test('should have access with byer token to /api/bye', t => {
  superagent
    .get(`${baseUrl}/api/bye`)
    .set('Authorization', `Bearer ${tokenByer}`)
    .then(result => {
      t.true(result.status.should.be.exactly(200))
      t.end()
    })
})

test('should have access with api:read token to /api/info/hi', t => {
  superagent
    .get(`${baseUrl}/api/info/hi`)
    .set('Authorization', `Bearer ${tokenApiRead}`)
    .then(result => {
      t.true(result.status.should.be.exactly(200))
      t.end()
    })
})

test('should have access with api:write token to /api/info/bye', t => {
  superagent
    .get(`${baseUrl}/api/info/bye`)
    .set('Authorization', `Bearer ${tokenApiWrite}`)
    .then(result => {
      t.true(result.status.should.be.exactly(200))
      t.end()
    })
})

test('should not have access with byer token to /api/info/bye', t => {
  superagent
    .get(`${baseUrl}/api/info/bye`)
    .set('Authorization', `Bearer ${tokenByer}`)
    .catch(e => {
      t.true(e.status.should.be.exactly(403))
      t.end()
    })
})
