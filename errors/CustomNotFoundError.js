class CustomNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    // Stringified error message
    this.name = "NotFoundError";
  }
}

module.exports = CustomNotFoundError;
