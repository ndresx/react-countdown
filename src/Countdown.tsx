import * as React from 'react';

import CountdownJs, { CountdownProps, CountdownApi } from './CountdownJs';

/**
 * A customizable countdown component for React.
 *
 * @export
 * @class Countdown
 * @extends {React.Component}
 */
export default class Countdown extends React.Component<CountdownProps> {
  countdown: CountdownJs;

  unsubscribe?: () => void;

  constructor(props: CountdownProps) {
    super(props);
    this.countdown = new CountdownJs(props);
  }

  componentDidMount(): void {
    this.unsubscribe = this.countdown.subscribe(() => this.forceUpdate());
    this.countdown.init();
  }

  componentDidUpdate(): void {
    this.countdown.update(this.props);
  }

  componentWillUnmount(): void {
    this.unsubscribe?.();
    this.countdown.destroy();
  }

  getApi(): CountdownApi {
    return this.countdown.getApi();
  }

  render(): React.ReactNode {
    const { renderer } = this.props;
    const renderProps = this.countdown.getRenderProps();

    if (renderer) return renderer(renderProps);

    const { days, hours, minutes, seconds } = renderProps.formatted;

    return (
      <>
        {renderProps.total < 0 ? '-' : ''}
        {days}
        {days ? ':' : ''}
        {hours}:{minutes}:{seconds}
      </>
    );
  }
}
