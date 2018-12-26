import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Countdown, { CountdownRenderProps, calcTimeDelta } from 'react-countdown-now';

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

class App extends Component {
  render() {
    return (
      <>
        <h1>React &lt;Countdown /&gt;</h1>
        <h2>Examples</h2>
        <h3>Basic Usage</h3>
        <Countdown date={Date.now() + 10000} />
        <hr />
        <h3>Custom & Conditional Rendering</h3>
        <h4>Using a React Child for the Completed State</h4>
        <Countdown date={Date.now() + 5000}>
          <Completionist />
        </Countdown>
        <h3>Custom Renderer with Completed Condition</h3>
        <Countdown date={Date.now() + 5000} renderer={renderer} />
        <hr />
        <h3>Countdown in Milliseconds</h3>
        <Countdown
          date={Date.now() + 10000}
          intervalDelay={0}
          precision={3}
          renderer={(props: CountdownRenderProps) => <div>{props.total}</div>}
        />
        <hr />
        <h3>Custom Renderer with stringified render props</h3>
        <Countdown
          date={Date.now() + 10000}
          intervalDelay={0}
          precision={3}
          zeroPadTime={2}
          renderer={props => <pre>{JSON.stringify(props, null, 2)}</pre>}
        />
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
