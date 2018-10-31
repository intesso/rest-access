const test = require('tape')
const access = require('../index')

test('should grant access to /signin', t => {
  access([
    [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
    [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
    [['GET'], '/signup/*', 'manage'],
    ['*', '/signin/*', 'manage'],
    ['*', '/account/password', 'manage'],
    ['*', '/account/delete', 'manage'],
    ['*', '/*', 'audit', true],
    ['*', '/upload/*', 'edit'],
    ['GET', '/translate/*', 'edit,manage'],
    ['GET', '/filemanager/*', 'edit,manage'],
    [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
    ['GET', '/ajax/*', '*'],
    ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
    ['*', '/admin/*', 'manage'],
    [['GET', 'POST'], '/*', '*']
  ])
  t.false(access.isBlocked('HEAD', '/signin', 'manage'))
  t.false(access.isBlocked('GET', '/signin', 'manage'))
  t.false(access.isBlocked('POST', '/signin', 'manage'))
  t.false(access.isBlocked('PUT', '/signin', 'manage'))
  t.false(access.isBlocked('DELETE', '/signin', 'manage'))
  t.end()
})

test('access /signin is not granted with eatingMango', t => {
  access([
    [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
    [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
    [['GET'], '/signup/*', 'manage'],
    ['*', '/signin/*', 'manage'],
    ['*', '/account/password', 'manage'],
    ['*', '/account/delete', 'manage'],
    ['*', '/*', 'audit', true],
    ['*', '/upload/*', 'edit'],
    ['GET', '/translate/*', 'edit,manage'],
    ['GET', '/filemanager/*', 'edit,manage'],
    [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
    ['GET', '/ajax/*', '*'],
    ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
    ['*', '/admin/*', 'manage'],
    [['GET', 'POST'], '/*', '*']
  ])
  t.true(access.isBlocked('GET', '/signin', 'eatingMango'))
  t.true(access.isBlocked('POST', '/signin', 'eatingMango'))
  t.true(access.isBlocked('PUT', '/signin', 'eatingMango'))
  t.end()
})

test('audit is blocked completely', t => {
  access([
    [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
    [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
    [['GET'], '/signup/*', 'manage'],
    ['*', '/signin/*', 'manage'],
    ['*', '/account/password', 'manage'],
    ['*', '/account/delete', 'manage'],
    ['*', '/*', 'audit', true],
    ['*', '/upload/*', 'edit'],
    ['GET', '/translate/*', 'edit,manage'],
    ['GET', '/filemanager/*', 'edit,manage'],
    [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
    ['GET', '/ajax/*', '*'],
    ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
    ['*', '/admin/*', 'manage'],
    [['GET', 'POST'], '/*', '*']
  ])
  t.true(access.isBlocked('GET', '/api/glint/role/*', 'audit'))
  t.true(access.isBlocked('POST', '/', 'audit'))
  t.true(access.isBlocked('GET', '/ajax', 'audit'))
  t.true(access.isBlocked('GET', '/ajax/1234', 'audit'))
  t.end()
})

test('with edit,insert,delete,manage it should be allowed to change state', t => {
  access([
    [['POST', 'PUT', 'DELETE'], '/*/glint/role/*', 'manage'],
    [['POST', 'PUT', 'DELETE'], '/*/glint/config/*', 'manage'],
    [['GET'], '/signup/*', 'manage'],
    ['*', '/signin/*', 'manage'],
    ['*', '/account/password', 'manage'],
    ['*', '/account/delete', 'manage'],
    ['*', '/*', 'audit', true],
    ['*', '/upload/*', 'edit'],
    ['GET', '/translate/*', 'edit,manage'],
    ['GET', '/filemanager/*', 'edit,manage'],
    [['POST', 'PUT', 'DELETE'], '/filemanager/*', 'edit,manage'],
    ['GET', '/ajax/*', '*'],
    ['POST,DELETE,PUT', '/ajax/*', 'edit,insert,delete'],
    ['*', '/admin/*', 'manage'],
    [['GET', 'POST'], '/*', '*']
  ])
  t.false(access.isBlocked('POST', '/filemanager/a/b', 'insert,edit'))
  t.false(access.isBlocked('DELETE', '/filemanager/a', 'manage,edit'))
  t.false(access.isBlocked('PUT', '/ajax/a/b', 'insert,edit'))
  t.false(access.isBlocked('DELETE', '/ajax/a/b', 'delete'))
  t.end()
})

test('role x-* should match role x', t => {
  access([
    ['GET', '/signup/*', 'tool-*']
  ])
  t.false(access.isBlocked('GET', '/signup', 'tool'))
  t.false(access.isBlocked('GET', '/signup/me', 'tool-admin'))
  t.false(access.isBlocked('GET', '/signup/you', 'tool-superadmin'))
  t.end()
})

test('role x-y-* should match role x-y and x-y-z', t => {
  access([
    ['GET', '/signup/*', 'tool-hero-*']
  ])
  t.true(access.isBlocked('GET', '/signup/me', 'tool'))
  t.false(access.isBlocked('GET', '/signup/me', 'tool-hero'))
  t.false(access.isBlocked('GET', '/signup/me', 'tool-hero-admin'))
  t.false(access.isBlocked('GET', '/signup/me', 'tool-hero-superadmin'))
  t.end()
})

test('role x-y should not match role x-y-z', t => {
  access([
    ['GET', '/signup/*', 'tool-hero']
  ])
  t.true(access.isBlocked('GET', '/signup/me', 'tool'))
  t.false(access.isBlocked('GET', '/signup/me', 'tool-hero'))
  t.true(access.isBlocked('GET', '/signup/me', 'tool-hero-admin'))
  t.end()
})

test('role x* should not match role x and xt', t => {
  access([
    ['GET', '/signup/*', 'tool*']
  ])
  t.true(access.isBlocked('GET', '/signup', 'tool'))
  t.true(access.isBlocked('GET', '/signup/me', 'tooladmin'))
  t.true(access.isBlocked('GET', '/signup/you', 'tool-superadmin'))
  t.end()
})
