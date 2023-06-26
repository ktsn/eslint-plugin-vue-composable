# eslint-plugin-vue-composable

ESLint plugin providing Vue composable related rules.

## Installation

Install it with:

```sh
$ npm install -D eslint-plugin-vue-composable
```

You have to install `eslint` and `eslint-plugin-vue` if you have not installed them yet:

```sh
$ npm install -D eslint eslint-plugin-vue
```

Then add configuration in your `.eslintrc`:

```js
module.exports = {
  extends: [
    'plugin:vue-composable/recommended'
  ]
}
```

## Rules

### vue-composable/composable-placement

Enforce [composable](https://vuejs.org/guide/reusability/composables.html) call be placed in `setup()` or another composable,
not after an `await` expression. Functions start with `use` is treated as composables in this rule.

#### Rule Details

Examples of **incorrect** code for this rule:

```js
function foo() {
  /* BAD: composable is in non-composable function */
  useBar()
}

function useBaz() {
  function qux() {
    /* BAD: parent function is non-composable function */
    useBar()
  }
}

export default defineComponent({
  async setup() {
    await fetch()

    /* BAD: composable is after `await` */
    useBaz()
  }
})
```

Examples of **correct** code for this rule:

```js
function useFoo() {
  /* GOOD: composable is in another composable */
  useBar()
}

export default defineComponent({
  setup() {
    /* GOOD: composable is in setup() */
    useBaz()
  }
})
```

```vue
<script setup>
/* GOOD: composable is in script setup */
useFoo()

await fetch()

/* GOOD: you can place composable after `await` if it is in script setup */
useBar()
</script>
```


### vue-composable/lifecycle-placement

Enforce lifecycle hook call be placed in `setup()` or another composable, not after an `await` expression.
Supporting core lifecycle hooks and Vue Router's hooks.

#### Rule Details

Examples of **incorrect** code for this rule:

```js
function foo() {
  /* BAD: the lifecycle hook is in non-composable function */
  onMounted(() => {})
}

function useBaz() {
  function qux() {
    /* BAD: parent function is non-composable function */
    onMounted(() => {})
  }
}

export default defineComponent({
  async setup() {
    await fetch()

    /* BAD: the lifecycle hook is after `await` */
    onMounted(() => {})
  }
})
```

Examples of **correct** code for this rule:

```js
function useFoo() {
  /* GOOD: the lifecycle hook is in a composable */
  onMounted(() => {})
}

export default defineComponent({
  setup() {
    /* GOOD: the lifecycle hook is in setup() */
    onMounted(() => {
      /* GOOD: the lifecycle hook can be in another lifecycle hook */
      onBeforeMount(() => {})
    })
  }
})
```

```vue
<script setup>
/* GOOD: the lifecycle hook is in script setup */
onMounted(() => {})

await fetch()

/* GOOD: you can place a lifecycle hook after `await` if it is in script setup */
onBeforeUnmount(() => {})
</script>
```

## License

MIT