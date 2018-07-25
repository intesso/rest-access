function NotPermittedError (message, code) {
  this.name = 'NotPermittedError'
  this.message = message
  Error.call(this, message)
  Error.captureStackTrace(this, this.constructor)
  this.status = 403
  this.code = code || message.toLowerCase().replace(/[\W]/g, '_')
}

NotPermittedError.prototype = Object.create(Error.prototype)
NotPermittedError.prototype.constructor = NotPermittedError

module.exports = NotPermittedError
