import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  beforeEach(() => {
    localStorage.removeItem('hostera.session');
    TestBed.configureTestingModule({});
  });

  it('starts without a session', () => {
    const store = TestBed.inject(SessionStore);
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.token()).toBeNull();
  });

  it('keeps the token of a started session and forgets it on end', () => {
    const store = TestBed.inject(SessionStore);
    store.start({ userId: 1, username: 'demo@hostera.pe', token: 'jwt' });
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.token()).toBe('jwt');
    expect(localStorage.getItem('hostera.session')).toContain(
      'demo@hostera.pe',
    );

    store.end();
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('hostera.session')).toBeNull();
  });
});
