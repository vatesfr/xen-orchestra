# An H1 title

Some content on line 1

Some content on line 2

## H2 title

Other content

And other one

### Type

```typescript
type LinearChartData = {
  label: string;
  data: {
    date: string;
    value: number;
  }[];
}[];
```

### Example

```vue-template
<LinearChart
  title="Chart title"
  subtitle="Chart subtitle"
  :data="data"
/>
```

```vue-script
const data: LinearChartData = [
  {
    label: "First series",
    data: [
      { date: "2022-10-01", value: 125 },
      { date: "2022-10-02", value: 112 },
      { date: "2022-10-03", value: 58 },
      { date: "2022-10-04", value: 147 },
      { date: "2022-10-05", value: 28 },
    ],
  },
  {
    label: "Second series",
    data: [
      { date: "2022-10-01", value: 168 },
      { date: "2022-10-02", value: 247 },
      { date: "2022-10-03", value: 154 },
      { date: "2022-10-04", value: 190 },
      { date: "2022-10-05", value: 158 },
    ],
  },
];
```
