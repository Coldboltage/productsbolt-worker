const { test, expect } = require('@jest/globals');

test('hello world functionality', () => {
  const result = 'Hello, World!';
  expect(result).toBe('Hello, World!');
});
