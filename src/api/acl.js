import {coroutine} from 'bluebird';
import {ModelAlreadyExists} from '../collection';

//====================================================================

let get = coroutine(function *({subject, object}) {
  let sieve = {};
  try {
    if (subject !== undefined) {
      sieve.subject = (yield this.users.first(subject)).get('id');
    }
    if (object !== undefined) {
      sieve.object = this.getObject(object).id;
    }
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  return this.acls.get(sieve);
});

get.permission = 'admin';

get.params = {
  subject: { type: 'string', optional: true },
  object: { type: 'string', optional: true },
};

get.description = 'get existing ACLs';

export {get};

//--------------------------------------------------------------------

let getCurrent = coroutine(function *() {
  return this.acls.get({ subject: this.session.get('user_id') });
});

getCurrent.permission = '';

getCurrent.description = 'get existing ACLs concerning current user';

export {getCurrent};

//--------------------------------------------------------------------

let add = coroutine(function *({subject, object}) {
  try {
    subject = (yield this.users.first(subject)).get('id');
    object = this.getObject(object).id;
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  try {
    yield this.acls.create(subject, object);
  } catch (error) {
    if (!(error instanceof ModelAlreadyExists)) {
      throw error;
    }
  }
});

add.permission = 'admin';

add.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
};

add.description = 'add a new ACL entry';

export {add};

//--------------------------------------------------------------------

let remove = coroutine(function *({subject, object}) {
  yield this.acls.delete(subject, object);
});

remove.permission = 'admin';

remove.params = {
  subject: { type: 'string' },
  object: { type: 'string' },
};

remove.description = 'remove an existing ACL entry';

export {remove};
