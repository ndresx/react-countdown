# Changelog

All notable changes to this project are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## 3.0.0 (Unreleased)

A full rewrite of the internals: all countdown logic now lives in a framework-agnostic engine, and React is a thin adapter on top of it. The component is built on a new public `useCountdown` hook, so both surfaces share one lifecycle. Changes below are relative to 2.3.6.

### Breaking Changes

- **Requires React 18+** (was React 16/17). The adapter uses `useSyncExternalStore`.
- **Imperative ref accessor changed.** `<Countdown />` is now a function component; reach the control API via `ref.current.api`. The v2 `ref.current.getApi()` accessor is removed (the `.api` path is unchanged).
- **Removed the `className` prop.** Wrap and style the output inside a `renderer`.
- **Removed the `children` prop** (completion content). Render the completed state inside a `renderer`.
- **Removed the legacy `count` prop** and the legacy simple-countdown path.
- **Removed `prop-types`.** TypeScript types are now the only prop contract; there are no runtime prop warnings.
- **`onComplete` no longer accepts the legacy zero-argument form.** The signature is `(timeDelta, completedOnStart)`.

### Added

- **`useCountdown` hook**, a public React adapter returning the same render props as the component.
- **Subpath entry points**: `react-countdown/component` and `react-countdown/hook` to import only what you need (both share the core).
- **`resetKey` prop** to restart the countdown without remounting (React's `key` still works to remount).
- **`freezeProps` prop** to opt out of prop tracking after mount.
- **`CountdownStatus` enum is now exported**, plus a **`getStatus()`** method on the API.
- **`refresh()`** method on the API to force an immediate recompute and re-render against the current clock (e.g. from a `visibilitychange` listener after the interval was throttled in a background tab).
- Dual **ESM + CJS** build with bundled type definitions and `sideEffects: false` for tree-shaking.

### Migrating from 2.x

| v2                                          | v3                                          |
| ------------------------------------------- | ------------------------------------------- |
| `ref.current.getApi().start()`              | `ref.current.api.start()`                   |
| `<Countdown className="..." />`             | apply styling inside a `renderer`           |
| `<Countdown>{completedContent}</Countdown>` | render the completed state inside `renderer` |
| `<Countdown count={n} />`                   | use `date` (the legacy `count` path is gone) |
| React 16 / 17                               | React 18+                                   |

No changes are needed for the remaining props, lifecycle callbacks, the `api` render prop / `ref.current.api` path, or the `zeroPad` / `calcTimeDelta` / `formatTimeDelta` helpers.
