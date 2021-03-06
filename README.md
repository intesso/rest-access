# rest-access

## install

```sh
npm i -S rest-access
```

> `rest-access` can be used to restrict access to resources. it can be used as a standalone solution or as a express/connect middleware.

## usage

```js
const express = require('express')
const app = express()
const jwt = require('express-jwt')
const access = require('rest-access')

access([
  ['*', '/api/*', 'api:rookie', true],
  [['POST', 'PUT', 'DELETE'], '/api/*', 'api:write,admin:*'],
  [['POST', 'PUT', 'DELETE'], '/api/secret/*', 'normal-admin'],
  ['GET', '/api/*', 'api:read'],
  [['GET', 'POST'], '/*', '*']
])

app.use(jwt({ secret: 'shared_secret' })) // authenticate with jwt
app.use((req, res, next) => {
  // map req.user.scope (added by express-jwt) to req.permission (used by rest-access)
  req.permission = req.user.scope
  next()
})

app.use(access.middleware()) // restrict access according to definition above

// endpoints
let hello = 'world'
app.get('/api/hello', (req, res) => res.send(hello))
app.post('/api/hello', (req, res) => {
  hello = req.body
  res.send(201)
})
app.get('/hello', (req, res) => res.send('welcome to the unrestricted area'))
```

## api

#### access(rules)

This function lets you define the access rules all at once:

```js
access([
  [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
  [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
  [['GET'], '/signup/*', 'manage'],
  ['*', '/signin/*', 'manage'],
  ['*', '/account/password', 'manage'],
  ['*', '/account/delete', 'manage'],
  ['*', '/*', 'view', true],
  ['*', '/upload/*', 'edit'],
  ['GET', '/translate/*', 'edit,manage'],
  ['GET', '/filemanager/*', 'edit,manage'],
  [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
  ['GET', '/ajax/*', '*'],
  ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
  ['*', '/admin/*', 'manage'],
  [['GET', 'POST'], '/*', '*']
])
```

#### access(methods, path, role[, block])

Use This method if you want to define a single access rules a specific place. examples:

```js
access(['GET', 'POST'], '/*/glint/role/* ', 'admin:*')
access('POST', '/*/glint/*', 'edit:glint')
```

The fourth argument is optional. If the fourth argument is "truthy" (boolean:true or string), it means that this role is blocked (instead of allowed) for the given methods and path.
Therefore in the following example, the Role `read:glint` is blocked to `POST` the given path. 

```js
access('POST', '/*/glint/*', 'read:glint', true)
```

#### members


**access.isBlocked**
this function can be used to check if the access to the required endpoint is blocked.
`isBlocked(method, path, permission)`

Given this definition:

```js
access([
  ['GET', '/api/*', 'api:*'],
  ['GET,POST,PUT,DELETE', '/api/*', 'api:write'],
])
```

The following result is expected:

```js
access.isBlocked('GET', '/api/hello', 'api:read') // -> returns `false`
access.isBlocked('POST', '/api/message', 'api:write') // -> returns `false`
access.isBlocked('PUT', '/api/message/today', 'api:read') // -> returns `'access not permitted'`
```

**access.midleware**
middleware function

example usage: looks for user permission under req.permission
```js
app.use(access.middleware({ permissionProperty: 'permission' }))
```

**access.restrict**
restrict single route

example usage: looks for user permission under req.permission
```js
app.get('/my/home', access.restrict('api:*'), (req, res) => res.send('restricted api access'))
```

**access.getRules**
use this function to return a copy of the existing rules.

example:
```js
restAccess.getRules().forEach(rule => console.log(rule.join(' ')));
```

#### extends

`access.middleware()` adds `req.userCan` function to the express/connect Request Object. 
Example call: `req.userCan('admin:*')`

## test


**run unittests**
```sh
npm test
```

**run integrationtests**
```sh
npm test:integration
```

## license

MIT

## credits

extracted from: https://github.com/glintcms/glintcms-starter-glintcms/blob/master/local_modules/page-auth-access/access.js