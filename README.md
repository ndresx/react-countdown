# React &lt;Countdown /&gt; [![npm][npm]][npm-url] [![Build Status](https://travis-ci.com/ndresx/react-countdown.svg?branch=master)](https://travis-ci.com/ndresx/react-countdown) [![Coverage Status](https://coveralls.io/repos/github/ndresx/react-countdown/badge.svg?branch=master)](https://coveralls.io/github/ndresx/react-countdown?branch=master)
A customizable countdown component for React.

* [Getting Started](#getting-started)
* [Motivation](#motivation)
* [Examples](#examples)
* [Props](#props)
* [API Reference](#api-reference)
* [Helpers](#helpers)
* [License](#license)

## Getting Started

You can either install the module via `npm` or `yarn`:

```
npm install react-countdown --save
```

```
yarn add react-countdown
```

## Motivation

As part of a small web app at first, the idea was to separate the countdown component from the main package to combine general aspects of the development with React, testing with Jest and more things that relate to publishing a new Open Source project.

## Examples

Here are some examples which you can try directly online. You can also clone this repo and explore some more examples in there by running `yarn start` within the `examples` folder.

### Basic Usage
A very simple and minimal example of how to set up a countdown which counts down from 10 seconds.
```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';

ReactDOM.render(
  <Countdown date={Date.now() + 10000} />,
  document.getElementById('root')
);
```
[Live Demo](https://codesandbox.io/s/cool-fermat-uk0dq)

### Custom & Conditional Rendering
In case you want to change the output of the component, or want to signal that the countdown's work is done, you can do this by either using the [`onComplete`](#oncomplete) callback, a
custom [`renderer`](#renderer), or by specifying a React child within `<Countdown></Countdown>`, which will only be shown once the countdown is complete.

#### Using a React Child for the Completed State

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';

// Random component
const Completionist = () => <span>You are good to go!</span>;

ReactDOM.render(
  (
    <Countdown date={Date.now() + 5000}>
      <Completionist />
    </Countdown>
  ),
  document.getElementById('root')
);
```
[Live Demo](https://codesandbox.io/s/condescending-bartik-kyp2v)

#### Custom Renderer with Completed Condition

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';

// Random component
const Completionist = () => <span>You are good to go!</span>;

// Renderer callback with condition
const renderer = ({ hours, minutes, seconds, completed }) => {
  if (completed) {
    // Render a completed state
    return <Completionist />;
  } else {
    // Render a countdown
    return <span>{hours}:{minutes}:{seconds}</span>;
  }
};

ReactDOM.render(
  <Countdown
    date={Date.now() + 5000}
    renderer={renderer}
  />,
  document.getElementById('root')
);
```
[Live Demo](https://codesandbox.io/s/sad-zhukovsky-hs7hc)

### Countdown in Milliseconds
Here is an example with a countdown of 10 seconds that displays the total time difference in milliseconds. In order to display the milliseconds appropriately, the [`intervalDelay`](#intervaldelay) value needs to be lower than `1000`ms and a [`precision`](#precision) of `1` to `3` should be used. Last but not least, a simple [`renderer`](#renderer) callback needs to be set up.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';

ReactDOM.render(
  <Countdown
    date={Date.now() + 10000}
    intervalDelay={0}
    precision={3}
    renderer={props => <div>{props.total}</div>}
  />,
  document.getElementById('root')
);
```
[Live Demo](https://codesandbox.io/s/elastic-euclid-6vnlw)

## Props

|Name|Type|Default|Description|
|:--|:--:|:-----:|:----------|
|[**date**](#date)|<code>Date&#124;string&#124;number</code>|`required`|Date or timestamp in the future|
|[**key**](#key)|<code>string&#124;number</code>|`undefined`|React  [**key**](https://reactjs.org/docs/lists-and-keys.html#keys); can be used to restart the countdown|
|[**daysInHours**](#daysinhours)|`boolean`|`false`|Days are calculated as hours|
|[**zeroPadTime**](#zeropadtime)|`number`|`2`|Length of zero-padded output, e.g.: `00:01:02`|
|[**zeroPadDays**](#zeropaddays)|`number`|`zeroPadTime`|Length of zero-padded days output, e.g.: `01`|
|[**controlled**](#controlled) |`boolean`|`false`|Hands over the control to its parent(s)|
|[**intervalDelay**](#intervaldelay)|`number`|`1000`|Interval delay in milliseconds|
|[**precision**](#precision)|`number`|`0`|The precision on a millisecond basis|
|[**autoStart**](#autostart)|`boolean`|`true`|Countdown auto-start option|
|[**children**](#children)|`any`|`null`|A React child for the countdown's completed state|
|[**renderer**](#renderer)|`function`|`undefined`|Custom renderer callback|
|[**now**](#now)|`function`|`Date.now`|Alternative handler for the current date|
|[**onMount**](#onmount)|`function`|`undefined`|Callback when component mounts|
|[**onStart**](#onstart)|`function`|`undefined`|Callback when countdown starts|
|[**onPause**](#onpause)|`function`|`undefined`|Callback when countdown pauses|
|[**onTick**](#ontick)|`function`|`undefined`|Callback on every interval tick (`controlled` = `false`)|
|[**onComplete**](#oncomplete)|`function`|`undefined`|Callback when countdown ends|

### `date`
The `date` prop is the only required one and can be a [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object, `string`, or timestamp in the future. By default, this date value gets compared with the current date, or a custom handler defined via [`now`](#now).

Valid values can be _(and more)_:
* `'2020-02-01T01:02:03'` // [`Date` time string format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse#Date_Time_String_Format)
* `1580518923000` // Timestamp in milliseconds
* `new Date(1580518923000)` // [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object

### `key`
This is one of React's internal component props and is used to identify the component. However, we can leverage this behavior and use it to, for example,  restart the countdown by
passing in a new `string` or `number`.

Please see [official React docs](https://reactjs.org/docs/lists-and-keys.html#keys) for more information about keys.

### `daysInHours`
Defines whether the time of day should be calculated as hours rather than separated days.

### `controlled`
Can be useful if the countdown's interval and/or date control should be handed over to the parent. In case `controlled` is `true`, the
provided [`date`](#date) will be treated as the countdown's actual time difference and not be compared to [`now`](#now) anymore.

### `zeroPadTime`
This option defaults to `2` in order to display the common format `00:00:00` instead of `0:0:0`. If the value is higher than `2`, only the hours part _(see [`zeroPadDays`](#zeropaddays) for days)_ will be zero-padded while it stays at `2` for minutes as well as seconds. If the value is lower, the output won't be zero-padded like the example before is showing.

### `zeroPadDays`
Defaults to `zeroPadTime`. Works the same way as [`zeroPadTime`](#zeropadtime) does, just for days.

### `intervalDelay`
Since this countdown is based on date comparisons, the default value of `1000` milliseconds is probably enough for most scenarios and doesn't need to be changed.

However, if it needs to be more precise, the `intervalDelay` can be set to something lower - down to `0`, which would, for example, allow showing the milliseconds in a more fancy way (_currently_ only possible through a custom [`renderer`](#renderer)).

### `precision`
In certain cases, you might want to base off the calculations on a millisecond basis. The `precision` prop, which defaults to `0`, can be used to refine this calculation. While the default value simply strips the milliseconds part (e.g.: `10123`ms => `10000`ms), a precision of `3` leads to `10123`ms.

### `autoStart`
Defines whether the countdown should start automatically or not. Defaults to `true`.

### `children`
This component also considers the child that may live within the `<Countdown></Countdown>` element, which, in case it's available, replaces the countdown's component state once it's complete. Moreover, an additional prop called `countdown` is set and contains data similar to what the [`renderer`](#renderer) callback would receive. Here's an [example](#using-a-react-child-for-the-completed-state) that showcases its usage.

_Please note that once a custom `renderer` is defined, the [`children`](#children) prop will be ignored._

<a name="renderer"></a>
### `renderer(props)`
The component's render output is very simple and depends on [`daysInHours`](#daysinhours): _{days}:{hours}:{minutes}:{seconds}_.
If this doesn't fit your needs, a custom `renderer` callback can be defined to return a new React element. It receives an argument which consists of a time delta object (incl. `formatted` values) to help building your own representation of the countdown.
```js
{ total, days, hours, minutes, seconds, milliseconds, completed }
```

The render props also contain the countdown's [`API`](#api-reference) as `api` prop as well as the passed in component [`props`](#props).

_Please note that once a custom `renderer` is defined, the [`children`](#children) prop will be ignored._

### `now`
If the current datetime (determined via a reference to `Date.now`) is not the right thing to compare with for you, a reference to a custom function which returns a similar dynamic value could be provided as an alternative.

### `onMount`
`onMount` is a callback and triggered when the countdown mounts. It receives the time delta object which is returned by [`calcTimeDelta`](#calctimedelta).

### `onStart`
`onStart` is a callback and triggered whenever the countdown is started (including first-run).  It receives the time delta object which is returned by [`calcTimeDelta`](#calctimedelta).

### `onPause`
`onPause` is a callback and triggered every time the countdown is paused. It receives the time delta object which is returned by [`calcTimeDelta`](#calctimedelta).

### `onTick`
`onTick` is a callback and triggered every time a new period is started, based on what the [`intervalDelay`](#intervaldelay)'s value is. It only gets triggered when the countdown's [`controlled`](#controlled) prop is set to `false`, meaning that the countdown has full control over its interval. It receives the time delta object which is returned by [`calcTimeDelta`](#calctimedelta).

### `onComplete`
`onComplete` is a callback and triggered whenever the countdown ends. In contrast to [`onTick`](#ontick), the [`onComplete`](#oncomplete) callback gets also triggered in case [`controlled`](#controlled) is set to `true`. It receives the time delta object which is returned by [`calcTimeDelta`](#calctimedelta).

## API Reference

The countdown component exposes a simple API through the `getApi()` function that can be accessed via component `ref`. It is also part (`api`) of the render props passed into [`renderer`](#renderer) if needed.

### `start()`
Starts the countdown in case it is paused or needed when [`autoStart`](#autostart) is set to `false`.

### `pause()`
Pauses the running countdown. This only works as expected if the [`controlled`](#controlled) prop is set to `false` because [`calcTimeDelta`](#calctimedelta) does calculate this offset time internally.

### `isPaused()`
Returns a `boolean` for whether the countdown has been paused or not.

### `isCompleted()`
Returns a `boolean` for whether the countdown has been completed or not.

## Helpers

This module also exports 3 simple helper functions which can be utilized to build your own countdown custom [`renderer`](#renderer).

```js
import Countdown, { zeroPad, calcTimeDelta, formatTimeDelta } from 'react-countdown';
```

### `zeroPad(value, [length = 2])`
The `zeroPad` function works similar to other well-known pad-functions and takes 2 arguments into account. A `value` which can be a `string` or `number`, as well as a `length` parameter which defaults to `2` as you are most likely only going to use this function if you actually want to pad one of your values. Either returns a `number` if `length` equals `0`, or the zero-padded `string`.

```js
const renderer = ({ hours, minutes, seconds }) => (
  <span>
    {zeroPad(hours)}:{zeroPad(minutes)}:{zeroPad(seconds)}
  </span>
);
```

<a name="calctimedelta"></a>
### `calcTimeDelta(date, [options])`
`calcTimeDelta` calculates the time difference between a given end [`date`](#date) and the current date (`now`). It returns, similar to the [`renderer`](#renderer) callback, a custom object (also referred to as **countdown time delta object**) with the following time related data:

```js
{ total, days, hours, minutes, seconds, milliseconds, completed }
```

This function accepts 2 arguments in total, only the first one is required.

**`date`**
Date or timestamp representation of the end date. See [`date`](#date) prop for more details.

The second argument (`options`) could be an optional object consisting of the following optional keys.

**`now = Date.now`**
Alternative function for returning the current date, also see [`now`](#now).

**`precision = 0`**
The [`precision`](#precision) on a millisecond basis.

**`controlled = false`**
Defines whether the calculated value is already provided as the time difference or not.

**`offsetTime = 0`**
Defines the offset time that gets added to the start time; only considered if controlled is false.

### `formatTimeDelta(delta, [options])`
`formatTimeDelta` formats a given countdown time delta object. It returns the formatted portion of it, equivalent to:

```js
{ days, hours, minutes, seconds }
```

This function accepts 2 arguments in total, only the first one is required.

**`delta`**
Time delta object, e.g.: returned by [`calcTimeDelta`](#calctimedelta).

**`options`**
The `options` object consists of the following three component props and is used to customize the formatting of the delta object:
* [`daysInHours`](#daysinhours)
* [`zeroPadTime`](#zeropadtime)
* [`zeroPadDays`](#zeropaddays)

## License

MIT

[npm]: https://img.shields.io/npm/v/react-countdown.svg
[npm-url]: https://npmjs.com/package/react-countdown
