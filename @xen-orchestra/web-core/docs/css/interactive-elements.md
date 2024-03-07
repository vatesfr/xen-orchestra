# Interactive elements

When an element has user interaction (hover, focus, pressed, disabled, etc.), its CSS rules should be defined (if
applicable) in the following order:

1. `.active, .selected`
2. `:hover, .hover, :focus-visible`
3. `:active, .pressed`
4. `:disabled, .disabled`

## Example

```css
.my-component {
  /* color: ...; */

  &.active,
  &.selected {
    /* color: ...; */
  }

  &:hover,
  &.hover,
  &:focus-visible {
    /* color: ...; */
  }

  &:active,
  &.pressed {
    /* color: ...; */
  }

  &:disabled,
  &.disabled {
    /* color: ...; */
  }
}
```
