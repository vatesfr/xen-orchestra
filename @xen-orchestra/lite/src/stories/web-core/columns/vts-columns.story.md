## Two columns layout

```vue-template
<VtsColumns>
  <VtsColumn class="column">
    <div>1st column</div>
    <div>foo</div>
    <div>bar</div>
  </VtsColumn>
  <VtsColumn class="column">
    <div>2nd column</div>
    <div>baz</div>
  </VtsColumn>
</VtsColumns>
```

## Three columns layout

```vue-template
<VtsColumns>
  <VtsColumn class="column">
    <div>1st column</div>
    <div>foo</div>
    <div>bar</div>
  </VtsColumn>
  <VtsColumn class="column">
    <div>2nd column</div>
    <div>baz</div>
  </VtsColumn>
  <VtsColumn class="column">
    <div>3rd column</div>
    <div>foo</div>
  </VtsColumn>
</VtsColumns>
```

## Three columns layout with only two columns filled

```vue-template
<VtsColumns :columns="3">
  <VtsColumn class="column">
    <div>1st column</div>
    <div>foo</div>
    <div>bar</div>
  </VtsColumn>
  <VtsColumn class="column">
    <div>2nd column</div>
    <div>baz</div>
  </VtsColumn>
</VtsColumns>
```
