# React &lt;Countdown /&gt; [![npm][npm]][npm-url] [![Build Status](https://travis-ci.org/ndresx/react-countdown.svg?branch=master)](https://travis-ci.org/ndresx/react-countdown) [![Coverage Status](https://coveralls.io/repos/github/ndresx/react-countdown/badge.svg?branch=master)](https://coveralls.io/github/ndresx/react-countdown?branch=master)
A customizable countdown component for React.

* [Getting Started](#getting-started)
* [Motivation](#motivation)
* [Examples](#examples)
* [Props](#props)
* [Helpers](#helpers)
* [License](#license)

## Getting Started

You can either install the module via `npm` or `yarn`:

```
npm install react-countdown-now --save
```

```
yarn add react-countdown-now
```

## Motivation

As part of a small web app at first, the idea was to separate the countdown component from the main package to combine general aspects of the development with React, testing with Jest and more things that relate to publishing a new Open Source project.

## Examples

### Basic Usage
A very simple and minimal example of how to set up a countdown which counts down from 10 seconds.
```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown-now';

ReactDOM.render(
  <Countdown date={Date.now() + 10000} />,
  document.getElementById('root')
);
```
[Live Demo](https://codesandbox.io/s/zmP5vGEOm)

### Custom & Conditional Rendering
In case you want to change the output of the component, or want to signal that the countdown's work is done, you can do this by either using the [`onComplete`](#oncomplete) callback, a
custom [`renderer`](#renderer), or by specifying another React child within `<Countdown></Countdown>` like the following examples show.

#### Using a React Child for the Completed State

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown-now';

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
[Live Demo](https://codesandbox.io/s/QWoK01R7M)

#### Custom Renderer with Completed Condition

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown-now';

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
[Live Demo](https://codesandbox.io/s/gL4RoLo2r)

### Countdown in Milliseconds
Here is an example with a countdown of 10 seconds that displays the total time difference in milliseconds. In order to display the milliseconds appropriately, the [`intervalDelay`](#intervaldelay) value needs to be lower than `1000`ms and a [`precision`](#precision) of `1` to `3` should be used. Last but not least, a simple [`renderer`](#renderer) callback needs to be set up.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown-now';

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
[Live Demo](https://codesandbox.io/s/kyLRX0yX)

## Props

|Name|Type|Default|Description|
|:--|:--:|:-----:|:----------|
|[**date**](#date)|<code>Date&#124;string&#124;number</code>|`required`|Date or timestamp in the future|
|[**daysInHours**](#daysinhours)|`boolean`|`false`|Days are calculated as hours|
|[**zeroPadLength**](#zeropadlength)|`number`|`2`|Length of zero-padded output, e.g.: `00:01:02`|
|[**controlled**](#controlled) |`boolean`|`false`|Hands over the control to its parent(s)|
|[**intervalDelay**](#intervaldelay)|`number`|`1000`|Interval delay in milliseconds|
|[**precision**](#precision)|`number`|`0`|The precision on a millisecond basis|
|[**children**](#children)|`any`|`null`|A React child for the countdown's completed state|
|[**renderer**](#renderer)|`function`|`null`|Custom renderer callback|
|[**now**](#now)|`function`|`Date.now`|Alternative handler for the current date|
|[**onTick**](#ontick)|`function`|`null`|Callback on every interval tick (`controlled` = `false`)|
|[**onComplete**](#oncomplete)|`function`|`null`|Callback when countdown ends|

### `date`
The `date` prop is the only required one and can be a `Date` object, `string`, or timestamp in the future. By default, this date value gets compared with the current date, or a custom handler defined via [`now`](#now).

Valid values can be _(and more)_:
* `'Sat, 01 Feb 2020 01:02:03'` // Any by `Date` parseable format
* `new Date(1580518923000)` // `Date` object
* `1580518923000` // Timestamp in milliseconds

### `daysInHours`
Defines whether the time of day should be calculated as hours rather than separated days.

### `controlled`
Can be useful if the countdown's interval and/or date control should be handed over to the parent. In case `controlled` is `true`, the
provided [`date`](#date) will be treated as the countdown's actual time difference and not be compared to [`now`](#now) anymore.

### `zeroPadLength`
This option defaults to `2` in order to display the common format `00:00:00` instead of `0:0:0`. If the value is higher than `2`, only the hour part _(never days)_ will be zero-padded while it stays at `2` for minutes as well as seconds. If the value is lower, the output won't be zero-padded like the example before is showing.

### `intervalDelay`
Since this countdown is based on date comparisons, the default value of `1000` milliseconds is probably enough for most scenarios and doesn't need to be changed.

However, if it needs to be more precise, the `intervalDelay` can be set to something lower - down to `0`, which would for example allow to show the milliseconds in a more fancy way (_currently_ only possible through a custom [`renderer`](#renderer)).

### `precision`
In certain cases you might want to base off the calculations on a millisecond basis. The `precision` prop, which defaults to `0`, can be used to refine this calculation. While the default value simply strips the milliseconds part (e.g.: `10123`ms => `10000`ms), a precision of `3` leads to `10123`ms.

### `children`
This component also considers the child that may live within the `<Countdown></Countdown>` element, which, in case it's available, replaces the countdown's component state once it's complete. Moreover, an additional prop called `countdown` is set and contains data similar to what the [`renderer`](#renderer) callback would receive. Here's an [example](#using-a-react-child-for-the-completed-state) that showcases its usage.

<a name="renderer"></a>
### `renderer(props)`
The component's render output is very simple and depends on [`daysInHours`](#daysinhours): _{days}:{hours}:{minutes}:{seconds}_.
If this doesn't fit your needs, a custom `renderer` callback can be defined to return a new React element. It retrieves an argument which consists of all the countdown's props and the following time data to help building your own representation of the countdown.
```js
{ total, days, hours, minutes, seconds, milliseconds, completed }
```
_Please note that once a custom `renderer` is defined, the [`children`](#children) prop will be ignored._

### `now`
If the current datetime (determined via a reference to `Date.now`) is not the right thing to compare with for you, a reference to a custom function which returns a similar dynamic value could be provided as an alternative.

### `onTick`
`onTick` is one of two supported callbacks. It gets called every time a new period is started, based on what the [`intervalDelay`](#intervaldelay)'s value is. It only gets triggered when the countdown's [`controlled`](#controlled) prop is set to `false`, meaning that the countdown has full control over its interval.

### `onComplete`
`onComplete` is the second callback and gets called whenever the countdown ends. In contrast to [`onTick`](#ontick), the [`onComplete`](#oncomplete) callback gets also triggered in case [`controlled`](#controlled) is set to `true`.

## Helpers

This module also exports 2 simple helper functions which can be utilized to build your own countdown custom [`renderer`](#renderer).

```js
import Countdown, { zeroPad, getTimeDifference } from 'react-countdown-now';
```

### `zeroPad(value, [length = 2])`
The `zeroPad` function works similar to other well-known pad-functions and takes 2 arguments into account. A `value` which can be a `string` or `number`, as well as a `length` parameter which defaults to `2` as you are most likely only going to use this function if you actually want to pad one of your values. Either returns a `number` if `length` equals `0`, or the zero-padded `string`.

### `getTimeDifference(date, [{ now = Date.now, precision = 0, controlled = false }])`
`getTimeDifference` calculates the time difference between a given end [`date`](#date) and the current date (`now`). It returns, similiar to the [`renderer`](#renderer) callback, a custom object which contains some time related data:

```js
{ total, days, hours, minutes, seconds, milliseconds, completed }
```

This function accepts 2 arguments in total, only the first one is required.

**`date`**
Date or timestamp representation of the end date. See [`date`](#date) prop for more details.

The second argument could be an optional object consisting of the following 3 optional keys.

**`now = Date.now`**
Alternative function for returning the current date, also see [`now`](#now).

**`precision = 0`**
The [`precision`](#precision) on a millisecond basis.

**`controlled = false`**
Defines whether the calculated value is already provided as the time difference or not.

## License

MIT

[npm]: https://img.shields.io/npm/v/react-countdown-now.svg
[npm-url]: https://npmjs.com/package/react-countdown-now
