class ConflictRequestError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
    // Stringified error message
    this.name = "ConflictError";
  }
}

module.exports = ConflictRequestError;
