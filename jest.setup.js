// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Add fetch polyfill for tests
global.fetch = require('node-fetch')