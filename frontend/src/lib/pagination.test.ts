import { getPageItems } from './pagination'

describe('getPageItems', () => {
  it.each([
    [1, 0, []],
    [1, -3, []],
    [1, 1, [1]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [1, 8, [1, 2, 3, 4, 5, 'end-ellipsis', 8]],
    [8, 8, [1, 'start-ellipsis', 4, 5, 6, 7, 8]],
    [4, 10, [1, 2, 3, 4, 5, 'end-ellipsis', 10]],
    [5, 10, [1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 10]],
    [6, 10, [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 10]],
    [7, 10, [1, 'start-ellipsis', 6, 7, 8, 9, 10]],
    [10, 10, [1, 'start-ellipsis', 6, 7, 8, 9, 10]],
    [0, 10, [1, 2, 3, 4, 5, 'end-ellipsis', 10]],
    [99, 10, [1, 'start-ellipsis', 6, 7, 8, 9, 10]],
  ] as const)('page %i of %i gives %j', (current, total, expected) => {
    expect(getPageItems(current, total)).toEqual(expected)
  })
})
