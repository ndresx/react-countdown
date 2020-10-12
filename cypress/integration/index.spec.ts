describe('<Countdown />', () => {
  const ALIAS = 'countdown';

  const cyGetAs = (selector: string) => cy.get(selector).as(ALIAS);
  const cyGet = (alias = ALIAS) => cy.get(`@${alias}`);

  beforeEach(() => {
    cy.clock();
    cy.visit('/');
  });

  describe('Basic Usage', () => {
    it('should render final state', () => {
      cyGetAs('#basic-usage');

      for (let i = 5; i > 0; i--) {
        cyGet().contains(`00:00:00:0${i}`);
        if (i > 0) cy.tick(1000);
      }

      cyGet().contains('00:00:00:00');
    });

    it('should render final state when already in the past', () => {
      cyGetAs('#basic-usage-past');
      cyGet().contains('00:00:00:00');

      cy.tick(1000);
      cyGet().contains('00:00:00:00');
    });
  });

  describe('Custom & Conditional Rendering', () => {
    it('should render completed state', () => {
      cyGetAs('#children-completionist');

      for (let i = 5; i > 0; i--) {
        cyGet().contains(`00:00:00:0${i}`);
        if (i > 0) cy.tick(1000);
      }

      cyGet().contains('You are good to go!');
    });
  });

  describe('Countdown (overtime)', () => {
    it('should render infinity', () => {
      cyGetAs('#overtime');

      for (let i = 5; i > -5; i--) {
        cyGet().contains(`${i < 0 ? '-' : ''}00:00:00:0${Math.abs(i)}`);
        cy.tick(1000);
      }

      cy.tick(5000);
      cyGet().contains('-00:00:00:10');
    });
  });

  describe('Countdown API', () => {
    beforeEach(() => {
      cyGetAs('#api');
      cyGet().contains('00:00:10');

      cyGet()
        .find('button')
        .contains('Start')
        .as('StartBtn')
        .click()
        .should('have.be.disabled');
    });

    it('should click the "Start" button and count down 5s', () => {
      cy.tick(5000);
      cyGet().contains('00:00:05');
    });

    it('should click the "Start" (10s) => "Pause" (5s) => "Start" (5s)  => "Stop" (3s) buttons => 10s', () => {
      cy.tick(5000);
      cyGet().contains('00:00:05');

      cyGet()
        .find('button')
        .contains('Pause')
        .as('PauseBtn')
        .click()
        .should('have.be.disabled');

      cy.tick(2000);
      cyGet().contains('00:00:05');

      cyGet('StartBtn').click();

      cy.tick(2000);
      cyGet().contains('00:00:03');

      cyGet()
        .find('button')
        .contains('Stop')
        .as('StopBtn')
        .click()
        .should('have.be.disabled');

      cyGet().contains('00:00:10');
    });

    it('should reset the countdown at 4s => 10s and count down to 7s', () => {
      cy.tick(6000);
      cyGet().contains('00:00:04');

      cyGet()
        .find('button')
        .contains('Reset')
        .as('ResetBtn')
        .click();

      cy.tick(3000);
      cyGet().contains('00:00:07');
    });
  });
});
