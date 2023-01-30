import type { MaybeRef } from "@vueuse/core";
import { computed, unref } from "vue";
import { useI18n } from "vue-i18n";

export default function useRelativeTime(
  fromDate: MaybeRef<Date>,
  toDate: MaybeRef<Date>
) {
  const { t } = useI18n();
  const fromTime = computed(() => unref(fromDate).getTime());
  const toTime = computed(() => unref(toDate).getTime());
  const isPast = computed(() => toTime.value > fromTime.value);
  const diff = computed(() => Math.abs(toTime.value - fromTime.value));

  return computed(() => {
    if (diff.value < 10000) {
      return t("relative-time.now");
    }

    const diffInYears = (diff.value / (1000 * 60 * 60 * 24 * 365)) ^ 0;
    const diffInMonths = (diff.value / (1000 * 60 * 60 * 24 * 30)) % 12 ^ 0;
    const diffInDays = (diff.value / (1000 * 60 * 60 * 24)) % 7 ^ 0;
    const diffInHours = (diff.value / (1000 * 60 * 60)) % 24 ^ 0;
    const diffInMinutes = (diff.value / (1000 * 60)) % 60 ^ 0;
    const diffInSeconds = (diff.value / 1000) % 60 ^ 0;

    const parts = [];

    if (diffInYears > 0) {
      parts.push(t("relative-time.year", { n: diffInYears }));
    }

    if (diffInMonths > 0) {
      parts.push(t("relative-time.month", { n: diffInMonths }));
    }

    if (diffInDays > 0) {
      parts.push(t("relative-time.day", { n: diffInDays }));
    }

    if (diffInHours > 0) {
      parts.push(t("relative-time.hour", { n: diffInHours }));
    }

    if (diffInMinutes > 0) {
      parts.push(t("relative-time.minute", { n: diffInMinutes }));
    }

    if (diffInSeconds > 0) {
      parts.push(t("relative-time.second", { n: diffInSeconds }));
    }

    return t(isPast.value ? "relative-time.past" : "relative-time.future", {
      str: parts.join(" "),
    });
  });
}
