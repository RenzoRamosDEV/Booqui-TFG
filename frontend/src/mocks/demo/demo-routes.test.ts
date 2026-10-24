import type { RouteObject } from 'react-router'
import { withDemoLogin } from './demo-routes'

const Page = () => null
const Login = () => null

const routes: RouteObject[] = [
  {
    id: 'root',
    children: [
      { path: '/', Component: Page },
      { path: '/login', Component: Login },
      { children: [{ path: '/checkout', Component: Page }] },
    ],
  },
]

describe('withDemoLogin', () => {
  it('swaps only the /login route for the demo page, however deep it is', () => {
    const swapped = withDemoLogin(routes, Page)
    expect(swapped[0]!.children![1]).toEqual({ path: '/login', Component: Page })
    expect(swapped[0]!.children![0]).toBe(routes[0]!.children![0])
    expect(swapped[0]!.children![2]).toEqual(routes[0]!.children![2])
  })

  it('leaves the original route map untouched', () => {
    withDemoLogin(routes, Page)
    expect(routes[0]!.children![1]).toEqual({ path: '/login', Component: Login })
  })

  it('returns an equal map when there is no /login route', () => {
    const plain: RouteObject[] = [{ path: '/', Component: Page }]
    expect(withDemoLogin(plain, Login)).toEqual(plain)
  })
})
