import { createContext } from "@/composables/context.composable";
import type { Color } from "@/types";

export const DisabledContext = createContext(false);

export const ColorContext = createContext("info" as Color);
