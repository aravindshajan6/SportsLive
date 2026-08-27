'use strict';

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');

const FIXTURES = path.join(__dirname, 'fixtures');

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function jsonFixture(name) {
  return JSON.parse(fixture(name));
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

module.exports = { fixture, jsonFixture, ISO_RE };
