import { synchronized } from "decorator-synchronized";
import JSON5 from "json5";
import { limitConcurrency } from "limit-concurrency-decorator";
import { defaults, findKey, forEach, identity, map } from "lodash-es";
import { BaseError } from "make-error";
import type XenApi from "@/libs/xen-api";
import type { XenApiHost } from "@/libs/xen-api";

class FaultyGranularity extends BaseError {}

// -------------------------------------------------------------------

// according to https://xapi-project.github.io/xen-api/metrics.html
// The values are stored at intervals of:
//  - 5 seconds for the past 10 minutes
//  - one minute for the past 2 hours
//  - one hour for the past week
//  - one day for the past year
enum RRD_STEP {
  Seconds = 5,
  Minutes = 60,
  Hours = 3600,
  Days = 86400,
}

export enum GRANULARITY {
  Seconds = "seconds",
  Minutes = "minutes",
  Hours = "hours",
  Days = "days",
}

export const RRD_STEP_FROM_STRING: { [key in GRANULARITY]: RRD_STEP } = {
  [GRANULARITY.Seconds]: RRD_STEP.Seconds,
  [GRANULARITY.Minutes]: RRD_STEP.Minutes,
  [GRANULARITY.Hours]: RRD_STEP.Hours,
  [GRANULARITY.Days]: RRD_STEP.Days,
};

// points = intervalInSeconds / step
const RRD_POINTS_PER_STEP: { [key in RRD_STEP]: number } = {
  [RRD_STEP.Seconds]: 120,
  [RRD_STEP.Minutes]: 120,
  [RRD_STEP.Hours]: 168,
  [RRD_STEP.Days]: 366,
};

// -------------------------------------------------------------------
// Utils
// -------------------------------------------------------------------

function convertNanToNull(value: number) {
  return isNaN(value) ? null : value;
}

// -------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------

const computeValues = (
  dataRow: any,
  legendIndex: number,
  transformValue = identity
) =>
  map(dataRow, ({ values }) =>
    transformValue(convertNanToNull(values[legendIndex]))
  );

const createGetProperty = (
  obj: object,
  property: string,
  defaultValue: unknown
) => defaults(obj, { [property]: defaultValue })[property] as any;

const testMetric = (
  test:
    | string
    | { exec: (type: string) => boolean }
    | { (type: string): boolean },
  type: string
): boolean =>
  typeof test === "string"
    ? test === type
    : typeof test === "function"
    ? test(type)
    : test.exec(type);

const findMetric = (metrics: any, metricType: string) => {
  let testResult;
  let metric;

  forEach(metrics, (current) => {
    if (current.test === undefined) {
      const newValues = findMetric(current, metricType);

      metric = newValues.metric;
      if (metric !== undefined) {
        testResult = newValues.testResult;
        return false;
      }
    } else if ((testResult = testMetric(current.test, metricType))) {
      metric = current;
      return false;
    }
  });

  return { metric, testResult };
};

// -------------------------------------------------------------------

// The metrics:
//  test: can be a function, regexp or string, default to: currentKey
//  getPath: default to: () => currentKey
//  transformValue: default to: identity
const STATS: { [key: string]: object } = {
  host: {
    load: {
      test: "loadavg",
    },
    memoryFree: {
      test: "memory_free_kib",
      transformValue: (value: number) => value * 1024,
    },
    memory: {
      test: "memory_total_kib",
      transformValue: (value: number) => value * 1024,
    },
    cpus: {
      test: /^cpu(\d+)$/,
      getPath: (matches: any) => ["cpus", matches[1]],
      transformValue: (value: number) => value * 1e2,
    },
    pifs: {
      rx: {
        test: /^pif_eth(\d+)_rx$/,
        getPath: (matches: unknown[]) => ["pifs", "rx", matches[1]],
      },
      tx: {
        test: /^pif_eth(\d+)_tx$/,
        getPath: (matches: unknown[]) => ["pifs", "tx", matches[1]],
      },
    },
    iops: {
      r: {
        test: /^iops_read_(\w+)$/,
        getPath: (matches: unknown[]) => ["iops", "r", matches[1]],
      },
      w: {
        test: /^iops_write_(\w+)$/,
        getPath: (matches: unknown[]) => ["iops", "w", matches[1]],
      },
    },
    ioThroughput: {
      r: {
        test: /^io_throughput_read_(\w+)$/,
        getPath: (matches: unknown[]) => ["ioThroughput", "r", matches[1]],
        transformValue: (value: number) => value * 2 ** 20,
      },
      w: {
        test: /^io_throughput_write_(\w+)$/,
        getPath: (matches: unknown[]) => ["ioThroughput", "w", matches[1]],
        transformValue: (value: number) => value * 2 ** 20,
      },
    },
    latency: {
      r: {
        test: /^read_latency_(\w+)$/,
        getPath: (matches: unknown[]) => ["latency", "r", matches[1]],
        transformValue: (value: number) => value / 1e3,
      },
      w: {
        test: /^write_latency_(\w+)$/,
        getPath: (matches: unknown[]) => ["latency", "w", matches[1]],
        transformValue: (value: number) => value / 1e3,
      },
    },
    iowait: {
      test: /^iowait_(\w+)$/,
      getPath: (matches: unknown[]) => ["iowait", matches[1]],
    },
  },
  vm: {
    memoryFree: {
      test: "memory_internal_free",
      transformValue: (value: number) => value * 1024,
    },
    memory: {
      test: (metricType: string) => metricType.endsWith("memory"),
    },
    cpus: {
      test: /^cpu(\d+)$/,
      getPath: (matches: unknown[]) => ["cpus", matches[1]],
      transformValue: (value: number) => value * 1e2,
    },
    vifs: {
      rx: {
        test: /^vif_(\d+)_rx$/,
        getPath: (matches: unknown[]) => ["vifs", "rx", matches[1]],
      },
      tx: {
        test: /^vif_(\d+)_tx$/,
        getPath: (matches: unknown[]) => ["vifs", "tx", matches[1]],
      },
    },
    xvds: {
      r: {
        test: /^vbd_xvd(.)_read$/,
        getPath: (matches: unknown[]) => ["xvds", "r", matches[1]],
      },
      w: {
        test: /^vbd_xvd(.)_write$/,
        getPath: (matches: unknown[]) => ["xvds", "w", matches[1]],
      },
    },
    iops: {
      r: {
        test: /^vbd_xvd(.)_iops_read$/,
        getPath: (matches: unknown[]) => ["iops", "r", matches[1]],
      },
      w: {
        test: /^vbd_xvd(.)_iops_write$/,
        getPath: (matches: unknown[]) => ["iops", "w", matches[1]],
      },
    },
  },
};

// -------------------------------------------------------------------

// RRD
// json: {
//   meta: {
//     start: Number,
//     step: Number,
//     end: Number,
//     rows: Number,
//     columns: Number,
//     legend: String[rows]
//   },
//   data: Item[columns] // Item = { t: Number, values: Number[rows] }
// }

// Local cache
// _statsByObject : {
//   [uuid]: {
//     [step]: {
//       endTimestamp: Number, // the timestamp of the last statistic point
//       interval: Number, // step
//       stats: T
//     }
//   }
// }

export type VmStats = {
  cpus: Record<string, number[]>;
  iops: {
    r: Record<string, number[]>;
    w: Record<string, number[]>;
  };
  memory: number[];
  memoryFree?: number[];
  vifs: {
    rx: Record<string, number[]>;
    tx: Record<string, number[]>;
  };
  xvds: {
    w: Record<string, number[]>;
    r: Record<string, number[]>;
  };
};

export type HostStats = {
  cpus: Record<string, number[]>;
  ioThroughput: {
    r: Record<string, number[]>;
    w: Record<string, number[]>;
  };
  iops: {
    r: Record<string, number[]>;
    w: Record<string, number[]>;
  };
  iowait: Record<string, number[]>;
  latency: {
    r: Record<string, number[]>;
    w: Record<string, number[]>;
  };
  load: number[];
  memory: number[];
  memoryFree: number[];
  pifs: {
    rx: Record<string, number[]>;
    tx: Record<string, number[]>;
  };
};

export type XapiStatsResponse<T> = {
  endTimestamp: number;
  interval: number;
  stats: T;
};

export default class XapiStats {
  #xapi;
  #statsByObject: {
    [uuid: string]: {
      [step: string]: XapiStatsResponse<HostStats | any>;
    };
  } = {};
  constructor(xapi: XenApi) {
    this.#xapi = xapi;
  }

  // Execute one http request on a XenServer for get stats
  // Return stats (Json format) or throws got exception
  @limitConcurrency(3)
  async _getJson(host: XenApiHost, timestamp: any, step: any) {
    const resp = await this.#xapi.getResource("/rrd_updates", {
      host,
      query: {
        cf: "AVERAGE",
        host: "true",
        interval: step,
        json: "true",
        start: timestamp,
      },
    });
    return JSON5.parse(await resp.text());
  }

  // To avoid multiple requests, we keep a cache for the stats and
  // only return it if we not exceed a step
  #getCachedStats(uuid: any, step: any, currentTimeStamp: any) {
    const statsByObject = this.#statsByObject;

    const stats = statsByObject[uuid]?.[step];
    if (stats === undefined) {
      return;
    }

    if (stats.endTimestamp + step < currentTimeStamp) {
      delete statsByObject[uuid][step];
      return;
    }

    return stats;
  }

  @synchronized.withKey(({ host }: { host: XenApiHost }) => host.uuid)
  async _getAndUpdateStats({
    host,
    uuid,
    granularity,
  }: {
    host: XenApiHost;
    uuid: any;
    granularity: GRANULARITY;
  }) {
    const step =
      granularity === undefined
        ? RRD_STEP.Seconds
        : RRD_STEP_FROM_STRING[granularity];
    if (step === undefined) {
      throw new FaultyGranularity(
        `Unknown granularity: '${granularity}'. Use 'seconds', 'minutes', 'hours', or 'days'.`
      );
    }
    const currentTimeStamp = Math.floor(new Date().getTime() / 1000);

    const stats = this.#getCachedStats(uuid, step, currentTimeStamp);
    if (stats !== undefined) {
      return stats;
    }

    const maxDuration = step * RRD_POINTS_PER_STEP[step];

    // To avoid crossing over the boundary, we ask for one less step
    const optimumTimestamp = currentTimeStamp - maxDuration + step;
    const json = await this._getJson(host, optimumTimestamp, step);

    const actualStep = json.meta.step as number;

    if (json.data.length > 0) {
      // fetched data is organized from the newest to the oldest
      // but this implementation requires it in the other direction
      json.data.reverse();
      json.meta.legend.forEach((legend: any, index: number) => {
        const [, type, uuid, metricType] = /^AVERAGE:([^:]+):(.+):(.+)$/.exec(
          legend
        ) as any;

        const metrics = STATS[type] as any;
        if (metrics === undefined) {
          return;
        }

        const { metric, testResult } = findMetric(metrics, metricType) as any;
        if (metric === undefined) {
          return;
        }

        const xoObjectStats = createGetProperty(this.#statsByObject, uuid, {});
        let stepStats = xoObjectStats[actualStep];
        if (
          stepStats === undefined ||
          stepStats.endTimestamp !== json.meta.end
        ) {
          stepStats = xoObjectStats[actualStep] = {
            endTimestamp: json.meta.end,
            interval: actualStep,
          };
        }

        const path =
          metric.getPath !== undefined
            ? metric.getPath(testResult)
            : [findKey(metrics, metric)];

        const lastKey = path.length - 1;
        let metricStats = createGetProperty(stepStats, "stats", {});
        path.forEach((property: any, key: number) => {
          if (key === lastKey) {
            metricStats[property] = computeValues(
              json.data,
              index,
              metric.transformValue
            );
            return;
          }

          metricStats = createGetProperty(metricStats, property, {});
        });
      });
    }

    if (actualStep !== step) {
      throw new FaultyGranularity(
        `Unable to get the true granularity: ${actualStep}`
      );
    }

    return (
      this.#statsByObject[uuid]?.[step] ?? {
        endTimestamp: currentTimeStamp,
        interval: step,
        stats: {},
      }
    );
  }
}
