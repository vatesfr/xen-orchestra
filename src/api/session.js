import {InvalidCredential, AlreadyAuthenticated} from '../api-errors';

import {$coroutine as coroutine, $wait as wait} from '../fibers-utils';

//====================================================================

let signInWithPassword = coroutine(function ({email, password}) {
  if (this.session.has('user_id')) {
    throw new AlreadyAuthenticated();
  }

  let user = wait(this.users.first({email}));
  if (!user || wait(user.checkPassword(password))) {
    throw new InvalidCredential();
  }

  this.session.set('user_id', user.get('id'));

  // Returns the user.
  return this.getUserPublicProperties(user);
});

signInWithPassword.params = {
  email: { type: 'string' },
  password: { type: 'string' },
};

export {signInWithPassword};

//--------------------------------------------------------------------

let signInWithToken = coroutine(function ({token: tokenId}) {
  if (this.session.has('user_id')) {
    throw new AlreadyAuthenticated();
  }

  let token = wait(this.tokens.first(tokenId));
  if (!token) {
    throw new InvalidCredential();
  }

  let userId = token.get('user_id');
  this.session.set('user_id', userId);
  this.session.set('token_id', token.get('id'));

  // Returns the user.
  return this.getUserPublicProperties(wait(this.users.first(userId)));
});

signInWithToken.params = {
  token: { type: 'string' },
};

export {signInWithToken};

//--------------------------------------------------------------------

let getUser = coroutine(function () {
  let userId = this.session.get('user_id');

  return userId === undefined ?
    null :
    this.getUserPublicProperties(wait(this.users.first(userId)))
  ;
});

export {getUser};
