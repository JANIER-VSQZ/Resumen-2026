import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdjacentScreen } from '../src/navigation.js';

const cover = { view: 'cover' };
const map = { view: 'map' };

test('both arrows only alternate between home and map', () => {
  for (const direction of [-1, 1]) {
    assert.deepEqual(getAdjacentScreen(cover, direction), map);
    assert.deepEqual(getAdjacentScreen(map, direction), cover);
  }
});

test('repeated navigation from main pages never opens a department', () => {
  let current = cover;
  for (const direction of [1, 1, -1, -1, 1, -1, 1, 1]) {
    const next = getAdjacentScreen(current, direction);
    assert.ok(['cover', 'map'].includes(next.view));
    assert.notEqual(next.view, current.view);
    current = next;
  }
});

test('left returns from any department to the map', () => {
  for (const selected of ['Intibuc\u00e1', 'Lempira', null]) {
    assert.deepEqual(getAdjacentScreen({ view: 'detail', selected }, -1), map);
  }
});

test('right from project details has no destination and leaves selection intact', () => {
  for (const selected of ['Intibuc\u00e1', 'Lempira']) {
    const current = { view: 'detail', selected };
    assert.equal(getAdjacentScreen(current, 1), null);
    assert.deepEqual(current, { view: 'detail', selected });
  }
});
