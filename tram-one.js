const xtend = require('xtend')
const nanorouter = require('nanorouter')
const belCreateElement = require('bel').createElement
const rbelRegister = require('rbel')
const minidux = require('minidux')
const yoyoUpdate = require('yo-yo').update
const document = require('global/document')

class Tram {
  constructor(options) {
    options = options || {}
    const defaultRoute = options.defaultRoute || '/404'

    this.router = nanorouter({ default: defaultRoute })
    this.reducers = {}
    this.state = {}
    this.store = {}
  }

  addReducer(key, reducer, state) {
    this.reducers[key] = reducer
    this.state[key] = state
  }

  addRoute(path, page) {
    this.router.on(path, (pathParams) => (state) => {
      const completeState = xtend(
        state, {dispatch: this.store.dispatch},
        pathParams
      )
      return page(completeState)
    })
  }

  start(selector, pathName) {
    const reducers = minidux.combineReducers(this.reducers)
    this.store = minidux.createStore(reducers, this.state)

    this.store.subscribe((state) => {
      this.mount(selector, pathName, state)
    })

    this.mount(selector, pathName, this.store.getState())
  }

  mount(selector, pathName, state) {
    if (typeof document.querySelector === 'undefined') {
      throw new Error('document.querySelector is undefined, are you running on server? Use .toString instead')
    }
    const target = (typeof selector) === 'string' ? document.querySelector(selector) : selector
    if (!target.firstElementChild) {
      const targetChild = belCreateElement`<div></div>`
      target.appendChild(targetChild)
    }
    const targetChild = target.firstElementChild

    const routePath = pathName || window.location.href.replace(window.location.origin, '')
    yoyoUpdate(targetChild, this.toNode(routePath, state))
  }

  toNode(pathName, state) {
    const pageComponent = this.router(pathName)
    const pageState = state || this.state
    return pageComponent(pageState)
  }

  toString(pathName, state) {
    const node = this.toNode(pathName, state)
    if (node.outerHTML) {
      return this.toNode(pathName, state).outerHTML
    }
    return this.toNode(pathName, state).toString()
  }

  static html(registry) {
    return rbelRegister(belCreateElement, registry || {})
  }
}

module.exports = Tram
