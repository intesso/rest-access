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
      const permission = req[permissionProperty]

      // res.locals userCan property for things like templates.
      req.userCan = (requiredPermission) => !hasPermission(permission, requiredPermission)

      // if access is allowed call `next()`, otherwise call `next(new NotPermittedError())`
      const reason = isBlocked(method, path, permission)
      next(reason ? new NotPermittedError(`rest-access: ${method} ${path} with permission: ${permission}, reason ${reason}`) : undefined)
    }
  }

  function isBlocked (method, path, permission) {
    path = path.split(queryHashSplitPattern)[0]

    // procedure description:
    // iterate over rules, check if:
    // 1. the method/path matches and if so,
    // 2. check if the permission matches: return `false (boolean)`: when not blocked, return `reason (string)` when the access is not allowed
    if (!rules || rules.length === 0) return false

    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i]

      // check rule arguments:
      if (!rule.length || rule.length < 3 || rule.length > 4) {
        return 'wrong access rule definition. must have 3 or 4 arguments'
      }

      // check method (1.argument)
      if (typeof rule[0] === 'string') rule[0] = rule[0].split(termSplitPattern)
      if (!rule[0].includes(method) && !rule[0].includes('*')) continue // with next rule

      // path (2.argument)
      if (!wildcard(rule[1], path, pathSegmentSplitPattern).length) continue // with next rule

      // permission (3.argument)
      // so method and path matched, now the permission has to match to, otherwise access is denied -> new NotPermittedError('access not permitted')
      let matches = hasPermission(permission, rule[2], rule[3])
      if (rule[3] && !matches) continue
      return matches
    }

    // no matching access definition
    return 'no matching access rule found'
  }

  // single route middleware
  function restrict (routePermission) {
    return (req, res, next) => next(hasPermission(req[permissionProperty], routePermission))
  }

  // general permission query function
  function hasPermission (userPermission, routePermission, block) {
    // permission (3.argument)
    // so method and path matched, now the permission has to match to, otherwise access is denied -> new NotPermittedError('access not permitted')
    if (routePermission === '*') return false // with next rule
    if (!userPermission) return 'not authenticated'
    if (typeof userPermission === 'string') userPermission = userPermission.split(termSplitPattern)
    if (typeof routePermission === 'string') routePermission = routePermission.split(termSplitPattern)
    if (!Array.isArray(routePermission)) {
      return 'wrong permission format: ' + routePermission
    }
    const matches = routePermission.some(p => {
      if (p === '*') return true
      if (wildcard(p, userPermission, permissionSchemeSplitPattern).length) return true
      return false
    })
    if ((!block && !matches) || (block && matches)) return 'access not permitted'
    return false
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
  restAccessRules.isBlocked = isBlocked
  restAccessRules.middleware = middleware
  restAccessRules.restrict = restrict
  restAccessRules.getRules = getRules
  return restAccessRules
}

/**
 * expose access
 */
module.exports = access()
