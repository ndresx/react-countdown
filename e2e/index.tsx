import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Countdown, { CountdownRenderProps } from '../dist';
import CountdownApi from './CountdownApi';

// Random component
const Completionist = () => <span>You are good to go!</span>;

// Renderer callback with condition
const renderer = ({ hours, minutes, seconds, completed }: CountdownRenderProps) => {
  if (completed) {
    // Render a completed state
    return <Completionist />;
  }

  // Render a countdown
  return (
    <span>
      {hours}:{minutes}:{seconds}
    </span>
  );
};

class App extends React.Component {
  render() {
    const date = Date.now() + 5000;
    return (
      <>
        <h1>React {'<Countdown />'} (E2E)</h1>
        <h2>Basic Usage</h2>
        <h3>Date in the future</h3>
        <div id="basic-usage">
          <Countdown date={date} />
        </div>
        <hr />
        <h3>Date in the past</h3>
        <div id="basic-usage-past">
          <Countdown date={date * -1} />
        </div>
        <hr />
        <h2>Custom & Conditional Rendering</h2>
        <h3>Using a React Child for the Completed State</h3>
        <div id="children-completionist">
          <Countdown date={date}>
            <Completionist />
          </Countdown>
        </div>
        <hr />
        <h2>
          Countdown (<code>overtime</code>)
        </h2>
        <div id="overtime">
          <Countdown date={date} overtime={true} />
        </div>
        <hr />
        <h2>Countdown API</h2>
        <h3>Countdown with Start, Pause, Stop and Reset Controls (Custom Renderer)</h3>
        <div id="api">
          <CountdownApi />
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
