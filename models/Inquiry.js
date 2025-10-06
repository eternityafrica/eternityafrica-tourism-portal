const db = require('../config/db');

class Inquiry {
  constructor(id, name, email, message, createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.message = message;
    this.createdAt = createdAt;
  }

  static async findAll() {
    // Database query implementation would go here
    return [];
  }

  static async findById(id) {
    // Database query implementation would go here
    return null;
  }

  async save() {
    // Database save implementation would go here
    return this;
  }
}

module.exports = Inquiry;