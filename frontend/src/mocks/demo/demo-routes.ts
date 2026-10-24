import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router'

export function withDemoLogin(routes: RouteObject[], page: ComponentType): RouteObject[] {
  return routes.map((route): RouteObject => {
    if (route.path === '/login') return { path: '/login', Component: page }
    if (!route.children) return route
    return { ...route, children: withDemoLogin(route.children, page) }
  })
}
