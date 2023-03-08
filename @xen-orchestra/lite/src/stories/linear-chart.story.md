# LinearChart

### Type

```typescript
type LinearChartData = {
  label: string;
  data: {
    timestamp: number;
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
    "label": "First series",
    "data": [
      {
        "timestamp": 1640995200000,
        "value": 4986790
      },
      {
        "timestamp": 1641081600000,
        "value": 354312074
      },
      {
        "timestamp": 1641168000000,
        "value": 379858800
      },
    ]
  },
  {
    "label": "Second series",
    "data": [
      {
        "timestamp": 1640995200000,
        "value": 102528411
      },
      {
        "timestamp": 1641081600000,
        "value": 10682534
      },
      {
        "timestamp": 1641168000000,
        "value": 10421188
      },
    ]
  }
]
```
