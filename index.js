const wildcard = require('wildcard')
const NotPermittedError = require('./error')
const termSplitPattern = /[,; ]+/
const pathSegmentSplitPattern = /\/+/
const queryHashSplitPattern = /[?#]/
const permissionSchemeSplitPattern = /[:-]+/

// access function
function access () {
  let rules = []
  let permissionProperty

  // access control middleware
  function middleware (options = {}) {
    permissionProperty = options.permissionProperty || 'permission'
    return (req, res, next) => {
      // constiables
      const method = req.method
      const path = req.originalUrl.split(queryHashSplitPattern)[0]
      const userPermission = req[permissionProperty]

      // res.locals userCan property for things like templates.
      req.userCan = (permission) => !hasPermission(userPermission, permission)

      // method: wildcard(req, def)
      // path: wildcard(def, req)
      // permission: wildcard(def, req)

      // procedure description:
      // iterate over rules, check if:
      // 1. the method/path matches and if so,
      // 2. check if the permission matches: yes: next(), no: call next(new NotPermittedError('access not permitted'))
      if (!rules || rules.length === 0) return next()

      for (let i = 0; i < rules.length; i++) {
        let rule = rules[i]

        // check rule arguments:
        if (!rule.length || rule.length < 3 || rule.length > 4) {
          return next(new TypeError('wrong access rule definition. must have 3 or 4 arguments.'))
        }

        // check method (1.argument)
        if (typeof rule[0] === 'string') rule[0] = rule[0].split(termSplitPattern)
        if (!rule[0].includes(method) && !rule[0].includes('*')) continue // with next rule

        // path (2.argument)
        if (!wildcard(rule[1], path, pathSegmentSplitPattern).length) continue // with next rule

        // permission (3.argument)
        // so method and path matched, now the permission has to match to, otherwise access is denied -> new NotPermittedError('access not permitted')
        let matches = hasPermission(userPermission, rule[2], rule[3])
        if (rule[3] && !matches) continue
        return next(matches)
      }

      // no matching access definition
      return next(new NotPermittedError('no matching access rule found'))
    }
  }

  // single route middleware
  function restrict (routePermission) {
    return (req, res, next) => next(hasPermission(req[permissionProperty], routePermission))
  }

  // general permission query function
  function hasPermission (userPermission, routePermission, block) {
    // permission (3.argument)
    // so method and path matched, now the permission has to match to, otherwise access is denied -> new NotPermittedError('access not permitted')
    if (routePermission === '*') return undefined // with next rule
    if (!userPermission) return new NotPermittedError('not authenticated')
    if (typeof userPermission === 'string') userPermission = userPermission.split(termSplitPattern)
    if (typeof routePermission === 'string') routePermission = routePermission.split(termSplitPattern)
    if (!Array.isArray(routePermission)) {
      return new TypeError('wrong permission format: ' + routePermission)
    }
    const matches = routePermission.some(p => {
      if (p === '*') return true
      if (wildcard(p, userPermission, permissionSchemeSplitPattern).length) return true
      return false
    })
    if ((!block && !matches) || (block && matches)) return new NotPermittedError('access not permitted')
    return undefined
  }

  function getRules () {
    return JSON.parse(JSON.stringify(rules))
  }

  // adding rules function
  function restAccessRules () {
    const args = [].slice.call(arguments)
    if (args.length === 1 && Array.isArray(args[0])) {
      const entries = args[0]
      const multiple = entries.every(entry => Array.isArray(entry))
      if (multiple) {
        // multiple rules provided via array
        rules = entries
      } else {
        // single rule provided via array
        rules.push(args[0])
      }
    } else {
      // single rule provided via parameters
      rules.push(args)
    }
  }
  restAccessRules.middleware = middleware
  restAccessRules.restrict = restrict
  restAccessRules.getRules = getRules
  return restAccessRules
}

/**
 * expose access
 */
module.exports = access()
