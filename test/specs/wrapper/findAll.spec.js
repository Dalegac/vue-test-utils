import { compileToFunctions } from 'vue-template-compiler'
import ComponentWithChild from '~resources/components/component-with-child.vue'
import ComponentWithoutName from '~resources/components/component-without-name.vue'
import ComponentWithSlots from '~resources/components/component-with-slots.vue'
import ComponentWithVFor from '~resources/components/component-with-v-for.vue'
import Component from '~resources/components/component.vue'
import FunctionalComponent from '~resources/components/functional-component.vue'
import ComponentAsAClass from '~resources/components/component-as-a-class.vue'
import {
  functionalSFCsSupported,
  describeWithShallowAndMount,
  isRunningChrome
} from '~resources/utils'
import { itDoNotRunIf, itSkipIf } from 'conditional-specs'

describeWithShallowAndMount('findAll', mountingMethod => {
  it('returns an WrapperArray of elements matching tag selector passed', () => {
    const compiled = compileToFunctions('<div><p></p><p></p></div>')
    const wrapper = mountingMethod(compiled)
    const divs = wrapper.findAll('p')
    expect(divs.length).toEqual(2)
  })

  it('returns an array of Wrapper of elements matching class selector passed', () => {
    const compiled = compileToFunctions('<div><div class="foo" /></div>')
    const wrapper = mountingMethod(compiled)
    const fooArr = wrapper.findAll('.foo')
    expect(fooArr.length).toEqual(1)
  })

  it('returns an array of Wrapper of elements matching class selector passed if they are nested in a transition', () => {
    const compiled = compileToFunctions('<transition><div /></transition>')
    const wrapper = mountingMethod(compiled)
    const divArr = wrapper.findAll('div')
    expect(divArr.length).toEqual(1)
  })

  itDoNotRunIf(
    isRunningChrome,
    'returns nodes matching class selector inside a slot',
    () => {
      const wrapper = mountingMethod(ComponentWithSlots, {
        slots: {
          default: '<div class="foo"><div class="foo"></div></div>'
        }
      })
      const fooArr = wrapper.findAll('.foo')
      expect(fooArr.length).toEqual(2)
    }
  )

  it('returns nodes matching selector in a functional component', () => {
    const TestComponent = {
      functional: true,
      render(h) {
        return h('p', {}, [
          h('p', {
            class: {
              foo: true
            }
          }),
          h('p')
        ])
      },
      name: 'common'
    }

    const wrapper = mountingMethod(TestComponent)
    expect(wrapper.findAll('p').length).toEqual(3)
  })

  it('works correctly with innerHTML', () => {
    const TestComponent = {
      render(createElement) {
        return createElement('div', {
          domProps: {
            innerHTML: '<svg></svg>'
          }
        })
      }
    }
    const wrapper = mountingMethod(TestComponent)
    expect(wrapper.findAll('svg').length).toEqual(1)
  })

  it('returns an array of Wrappers of elements matching id selector passed', () => {
    const compiled = compileToFunctions('<div><div id="foo" /></div>')
    const wrapper = mountingMethod(compiled)
    const fooArr = wrapper.findAll('#foo')
    expect(fooArr.length).toEqual(1)
  })

  it('returns an array of Wrappers of elements matching attribute selector passed', () => {
    const compiled = compileToFunctions('<div><a href="/"></a></div>')
    const wrapper = mountingMethod(compiled)
    const hrefArr = wrapper.findAll('[href="/"]')
    expect(hrefArr.length).toEqual(1)
  })

  it('throws an error when passed an invalid DOM selector', () => {
    const compiled = compileToFunctions('<div><a href="/"></a></div>')
    const wrapper = mountingMethod(compiled)
    const message =
      '[vue-test-utils]: wrapper.findAll() must be passed a valid CSS selector, Vue constructor, or valid find option object'
    const fn = () => wrapper.findAll('[href=&6"/"]')
    expect(fn).toThrow(message)
  })

  it('returns an array of Wrappers of elements matching selector when descendant combinator passed', () => {
    const compiled = compileToFunctions(
      '<div><ul><li>list</li>item<li></li></ul></div>'
    )
    const wrapper = mountingMethod(compiled)
    const liArr = wrapper.findAll('div li')
    expect(liArr.length).toEqual(2)
  })

  it('does not return duplicate nodes', () => {
    const compiled = compileToFunctions(
      '<div><div><div><p/><p/></div></div></div></div>'
    )
    const wrapper = mountingMethod(compiled)
    expect(wrapper.findAll('div p').length).toEqual(2)
  })

  it('returns an array of Wrappers of elements matching selector with direct descendant combinator passed', () => {
    const compiled = compileToFunctions('<div><ul><ul></ul></ul></div>')
    const wrapper = mountingMethod(compiled)
    const ulArr = wrapper.findAll('div > ul')
    expect(ulArr.length).toEqual(1)
  })

  it('returns an array of Wrappers of elements matching pseudo selector', () => {
    const compiled = compileToFunctions('<div><p></p><p></p></div>')
    const wrapper = mountingMethod(compiled)
    const divs = wrapper.findAll('p:first-of-type')
    expect(divs.length).toEqual(1)
  })

  it('returns an array of VueWrappers of Vue Components matching component', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const componentArr = wrapper.findAll(Component)
    expect(componentArr.length).toEqual(1)
  })

  it('returns an array of VueWrappers of Vue Components matching components using findAllComponents', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const componentArr = wrapper.findAllComponents(Component)
    expect(componentArr.length).toEqual(1)
  })

  it('findAllComponents ignores DOM nodes matching same CSS selector', () => {
    const RootComponent = {
      components: { Component },
      template: '<div><Component class="foo" /><div class="foo"></div></div>'
    }
    const wrapper = mountingMethod(RootComponent)
    expect(wrapper.findAllComponents('.foo')).toHaveLength(1)
    expect(
      wrapper
        .findAllComponents('.foo')
        .at(0)
        .is(Component)
    ).toBe(true)
  })

  it('findAllComponents returns top-level components when components are nested', () => {
    const DeepNestedChild = {
      name: 'DeepNestedChild',
      template: '<div>I am deeply nested</div>'
    }
    const NestedChild = {
      name: 'NestedChild',
      components: { DeepNestedChild },
      template: '<deep-nested-child class="in-child" />'
    }
    const RootComponent = {
      name: 'RootComponent',
      components: { NestedChild },
      template: '<div><nested-child class="in-root"></nested-child></div>'
    }

    const wrapper = mountingMethod(RootComponent, { stubs: { NestedChild } })

    expect(wrapper.findAllComponents('.in-root')).toHaveLength(1)
    expect(
      wrapper.findAllComponents('.in-root').at(0).vm.$options.name
    ).toEqual('NestedChild')

    expect(wrapper.findAllComponents('.in-child')).toHaveLength(1)

    // someone might expect DeepNestedChild here, but
    // we always return TOP component matching DOM element
    expect(
      wrapper.findAllComponents('.in-child').at(0).vm.$options.name
    ).toEqual('NestedChild')
  })

  it('returns correct number of Vue Wrapper when component has a v-for', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const wrapper = mountingMethod(ComponentWithVFor, { propsData: { items } })
    const componentArray = wrapper.findAll(Component)
    expect(componentArray.length).toEqual(items.length)
  })

  it('returns array of VueWrappers of Vue Components matching component if component name in parent is different to filename', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const div = wrapper.findAll('span').at(0)
    const componentArr = div.findAll(Component)
    expect(componentArr.length).toEqual(1)
  })

  it('returns an array of VueWrappers of Vue Components matching component using Wrapper as reference', () => {
    // same test as above, but good to be explicit
    const wrapper = mountingMethod(ComponentWithChild)
    const div = wrapper.findAll('span').at(0)
    const componentArr = div.findAll(Component)
    expect(componentArr.length).toEqual(1)
  })

  it('only returns Vue components that exists as children of Wrapper', () => {
    const AComponent = {
      render: () => {},
      name: 'a-component'
    }
    const TestComponent = {
      template: `
        <div>
          <span>
            <a-component />
          </span>
          <a-component />
        </div>
      `,
      components: {
        'a-component': AComponent
      }
    }
    const wrapper = mountingMethod(TestComponent)
    const span = wrapper.find('span')
    expect(span.findAll(AComponent).length).toEqual(1)
  })

  it('returns matching Vue components that have no name property', () => {
    const TestComponent = {
      template: `
        <div>
          <component-without-name />
          <component-without-name />
          <component-without-name />
        </div>
      `,
      components: {
        ComponentWithoutName
      }
    }
    const wrapper = mountingMethod(TestComponent)
    expect(wrapper.findAll(ComponentWithoutName).length).toEqual(3)
  })

  itSkipIf(isRunningChrome, 'returns Wrapper of class component', () => {
    const TestComponent = {
      template: `
        <div>
          <component-as-a-class />
        </div>
      `,
      components: {
        ComponentAsAClass
      }
    }

    const wrapper = mountingMethod(TestComponent)
    expect(wrapper.findAll(ComponentAsAClass).length).toEqual(1)
  })

  it('returns Wrapper of Vue Component matching functional component', () => {
    if (!functionalSFCsSupported) {
      return
    }
    const TestComponent = {
      template: `
        <div>
          <functional-component />
        </div>
      `,
      components: {
        FunctionalComponent
      }
    }

    const wrapper = mountingMethod(TestComponent)
    expect(wrapper.findAll(FunctionalComponent).length).toEqual(1)
  })

  it('returns VueWrapper with length 0 if no nodes matching selector are found', () => {
    const wrapper = mountingMethod(Component)
    const preArray = wrapper.findAll('pre')
    expect(preArray.length).toEqual(0)
    expect(preArray.wrappers).toEqual([])
  })

  it('returns an array of Wrapper of elements matching a component name in options object', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const wrapperArray = wrapper.findAll({ name: 'test-component' })
    expect(wrapperArray.at(0).name()).toEqual('test-component')
    expect(wrapperArray.length).toEqual(1)
  })

  it('returns an array of Wrapper of elements matching the ref in options object', () => {
    const compiled = compileToFunctions('<div><div ref="foo" /></div>')
    const wrapper = mountingMethod(compiled)
    const fooArr = wrapper.findAll({ ref: 'foo' })
    expect(fooArr.length).toEqual(1)
  })

  it('throws an error when ref selector is called on a wrapper that is not a Vue component', () => {
    const compiled = compileToFunctions('<div><a href="/"></a></div>')
    const wrapper = mountingMethod(compiled)
    const a = wrapper.find('a')
    const message =
      '[vue-test-utils]: $ref selectors can only be used on Vue component wrappers'
    const fn = () => a.findAll({ ref: 'foo' })
    expect(fn).toThrow(message)
  })

  it('returns an array of Wrapper of elements matching the ref in options object if they are nested in a transition', () => {
    const compiled = compileToFunctions(
      '<transition><div ref="foo" /></transition>'
    )
    const wrapper = mountingMethod(compiled)
    const divArr = wrapper.findAll({ ref: 'foo' })
    expect(divArr.length).toEqual(1)
  })

  it('returns correct number of Vue Wrapper when component has a v-for and matches the ref in options object', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const wrapper = mountingMethod(ComponentWithVFor, { propsData: { items } })
    const componentArray = wrapper.findAll({ ref: 'item' })
    expect(componentArray.length).toEqual(items.length)
  })

  it('returns VueWrapper with length 0 if no nodes matching the ref in options object are found', () => {
    const wrapper = mountingMethod(Component)
    const preArray = wrapper.findAll({ ref: 'foo' })
    expect(preArray.length).toEqual(0)
    expect(preArray.wrappers).toEqual([])
  })

  it('throws an error if selector is not a valid selector', () => {
    const wrapper = mountingMethod(Component)
    const invalidSelectors = [
      undefined,
      null,
      NaN,
      0,
      2,
      true,
      false,
      () => {},
      {},
      { name: undefined },
      { ref: 'foo', nope: true },
      []
    ]
    invalidSelectors.forEach(invalidSelector => {
      const message =
        '[vue-test-utils]: wrapper.findAll() must be passed a valid CSS selector, Vue constructor, or valid find option object'
      const fn = () => wrapper.findAll(invalidSelector)
      expect(fn).toThrow(message)
    })
  })

  itDoNotRunIf(
    mountingMethod.name === 'shallowMount',
    'returns a WrapperArray which includes VueWrapper if the elements binds a Vue instance',
    () => {
      const childComponent = {
        name: 'bar',
        template: '<p class="foo" />'
      }
      const wrapper = mountingMethod({
        name: 'foo',
        template: '<div class="foo"><p class="foo" /><child-component /></div>',
        components: { childComponent }
      })
      const wrappers = wrapper.findAll('.foo')
      expect(wrappers.at(0).vm.$options.name).toEqual('foo')
      expect(wrappers.at(1).vm).toEqual(undefined)
      expect(wrappers.at(2).vm.$options.name).toEqual('bar')
    }
  )

  it('stores CSS selector', () => {
    const compiled = compileToFunctions('<div><p></p><p></p></div>')
    const wrapper = mountingMethod(compiled)
    const selector = 'p'
    const result = wrapper.findAll('p')
    expect(result.selector).toEqual(selector)
    expect(result.at(0).selector).toEqual(selector)
  })

  it('stores ref selector', () => {
    const compiled = compileToFunctions('<div><div ref="foo" /></div>')
    const wrapper = mountingMethod(compiled)
    const selector = { ref: 'foo' }
    const result = wrapper.findAll(selector)
    expect(result.selector).toEqual(selector)
    expect(result.at(0).selector).toEqual(selector)
  })

  it('stores component selector', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const selector = Component
    const result = wrapper.findAll(selector)
    expect(result.selector).toEqual(selector)
    expect(result.at(0).selector).toEqual(selector)
  })

  it('stores name selector', () => {
    const wrapper = mountingMethod(ComponentWithChild)
    const selector = { name: 'test-component' }
    const result = wrapper.findAll(selector)
    expect(result.selector).toEqual(selector)
    expect(result.at(0).selector).toEqual(selector)
  })
})
