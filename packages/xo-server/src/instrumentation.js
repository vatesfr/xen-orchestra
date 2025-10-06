const { NodeSDK } = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { Resource } = require('@opentelemetry/resources')

const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions')
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin')

// Add your zipkin url (`http://localhost:9411/api/v2/spans` is used as
// default) and application name to the Zipkin options.
// You can also define your custom headers which will be added automatically.
const options = {
  url: 'http://10.1.8.81:9411/api/v2/spans',
}
const exporter = new ZipkinExporter(options)
const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'XO',
  }),
})

sdk.start()
