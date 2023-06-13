# eslint-plugin-vue-composable

ESLint plugin providing rules related to Vue composable.

## Installation

Install it with:

```sh
$ npm install -D eslint-plugin-vue-composable
```

You have to install `eslint` and `eslint-plugin-vue` if you have not installed them yet:

```sh
& npm install -D eslint eslint-plugin-vue
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

## License

MIT