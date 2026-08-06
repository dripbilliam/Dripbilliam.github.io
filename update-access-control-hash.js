// SPDX-FileCopyrightText: 2026 Dripbilliam contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ACCESS_CONTROL_PATH = path.resolve(__dirname, 'access-control.json');
const MAP_INDEX_PATH = path.resolve(__dirname, 'Map', 'index.html');
const HASH_REGEX = /(const ACCESS_CONTROL_SHA256 = ')([0-9a-f]{64})(';)/;

const normalizeForHash = (text) => text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const readRequiredFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const accessControlRaw = readRequiredFile(ACCESS_CONTROL_PATH);
const mapIndexRaw = readRequiredFile(MAP_INDEX_PATH);
const computedHash = crypto
  .createHash('sha256')
  .update(normalizeForHash(accessControlRaw), 'utf8')
  .digest('hex');

if (!HASH_REGEX.test(mapIndexRaw)) {
  throw new Error('Could not find ACCESS_CONTROL_SHA256 constant in Map/index.html');
}

const currentHash = mapIndexRaw.match(HASH_REGEX)[2];
if (currentHash === computedHash) {
  console.log('[access-control] Hash already up to date.');
  process.exit(0);
}

const updatedMapIndex = mapIndexRaw.replace(HASH_REGEX, `$1${computedHash}$3`);
fs.writeFileSync(MAP_INDEX_PATH, updatedMapIndex, 'utf8');

console.log(`[access-control] Updated ACCESS_CONTROL_SHA256 to ${computedHash}`);