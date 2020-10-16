describe('React <Countdown />', () => {
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
        cyGet().should('have.text', `00:00:00:0${i}`);
        if (i > 0) cy.tick(1000);
      }

      cyGet().should('have.text', '00:00:00:00');
    });

    it('should render final state when already in the past', () => {
      cyGetAs('#basic-usage-past');
      cyGet().should('have.text', '00:00:00:00');

      cy.tick(1000);
      cyGet().should('have.text', '00:00:00:00');
    });
  });

  describe('Custom & Conditional Rendering', () => {
    ['children', 'renderer'].forEach((idPrefix) => {
      it(`should render conditional states for "${idPrefix}"`, () => {
        cyGetAs(`#${idPrefix}-conditional`);

        for (let i = 5; i > 0; i--) {
          cyGet().should('have.text', idPrefix === 'children' ? `00:00:00:0${i}` : `0:0:${i}`);
          if (i > 0) cy.tick(1000);
        }

        cyGet().should('have.text', 'You are good to go!');
      });
    });
  });

  describe('Countdown (overtime)', () => {
    it('should render infinity', () => {
      cyGetAs('#overtime');

      for (let i = 5; i > -5; i--) {
        cyGet().should('have.text', `${i < 0 ? '-' : ''}00:00:00:0${Math.abs(i)}`);
        cy.tick(1000);
      }

      cy.tick(5000);
      cyGet().should('have.text', '-00:00:00:10');
    });
  });

  describe('Countdown Hook (useCountdown)', () => {
    it('should render final state', () => {
      cyGetAs('#hook-basic-usage');

      for (let i = 5; i > 0; i--) {
        cyGet().should('have.text', `0:0:${i}`);
        if (i > 0) cy.tick(1000);
      }

      cyGet().should('have.text', '0:0:0');
    });

    it('should render final state when already in the past', () => {
      cyGetAs('#hook-basic-usage-past');
      cyGet().should('have.text', '0:0:0');

      cy.tick(1000);
      cyGet().should('have.text', '0:0:0');
    });

    it('should render conditional states', () => {
      cyGetAs('#hook-conditional');

      for (let i = 5; i > 0; i--) {
        cyGet().should('have.text', `0:0:${i}`);
        if (i > 0) cy.tick(1000);
      }

      cyGet().should('have.text', 'Completionist!');
    });
  });

  describe('Countdown API', () => {
    beforeEach(() => {
      cyGetAs('#api');
      cyGet().should('contain.text', '00:00:10');

      cyGet().find('button').contains('Start').as('StartBtn').click().should('have.be.disabled');
    });

    it('should click the "Start" button and count down 5s', () => {
      cy.tick(5000);
      cyGet().should('contain.text', '00:00:05');
    });

    it('should click the "Start" (10s) => "Pause" (5s) => "Start" (5s)  => "Stop" (3s) buttons => 10s', () => {
      cy.tick(5000);
      cyGet().should('contain.text', '00:00:05');

      cyGet().find('button').contains('Pause').as('PauseBtn').click().should('have.be.disabled');

      cy.tick(2000);
      cyGet().should('contain.text', '00:00:05');

      cyGet('StartBtn').click();

      cy.tick(2000);
      cyGet().should('contain.text', '00:00:03');

      cyGet().find('button').contains('Stop').as('StopBtn').click().should('have.be.disabled');

      cyGet().should('contain.text', '00:00:10');
    });

    it('should reset the countdown at 4s => 10s and count down to 7s', () => {
      cy.tick(6000);
      cyGet().should('contain.text', '00:00:04');

      cyGet().find('button').contains('Reset').as('ResetBtn').click();

      cy.tick(3000);
      cyGet().should('contain.text', '00:00:07');
    });
  });
});
