# Global architecture

This project is composed of three main parts:

- The `/pages` directory: root components that define the main routes of the application.
- The `/shared` directory: components, composables, and utilities that are shared between multiple pages.
- The `/modules` directory: each subdirectory represents a distinct module (i.e. an XO 6 object type such as Host, VM, SR, etc. or other "object" like Site, Account, etc.). Each module contains its own components, composables, and utilities specific to that module.

## Pages

As we use `unplugin-vue-router`, each `.vue` file in this directory automatically becomes a route. The resulting URL if the file is named `index.vue` becomes the root route (`/`), otherwise it becomes a sub-route (e.g., `/host/:uuid`).

## Shared

The `/shared` directory is intended for components, composables, and utilities that are used across multiple modules or pages. This helps to avoid code duplication and promotes reusability.

## Modules

The goal to have a `/modules` directory is to encapsulate all logic related to a specific module in one place, making it easier to maintain and scale the application.

Each module typically contains:

- A `/components` subdirectory for components specific to that module.
- A `/composables` subdirectory for Vue composables that encapsulate logic related to that module.
- A `/utils` subdirectory for utility functions that are specific to that module.
- Other directories as needed for that module's functionality.
