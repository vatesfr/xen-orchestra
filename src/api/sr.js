import forEach from 'lodash.foreach';
import {$coroutine, $wait} from '../fibers-utils';

//====================================================================

let set = $coroutine(params => {
  let SR;
  try {
    SR = this.getObject(params.id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  forEach(['name_label', 'name_description'], param => {
    let value = params[param];
    if (value === undefined) {
      return;
    }

    $wait(xapi.call(`SR.set_${value}`, SR.ref, params[param]));
  });

  return true;
});
set.permission = 'admin';
set.params = {
  id: { type: 'string' },

  name_label: { type: 'string', optional: true },

  name_description: { type: 'string', optional: true },
};

export {set};

//--------------------------------------------------------------------

let scan = $coroutine(({id}) => {
  let SR;
  try {
    SR = this.getObject(id, 'SR');
  } catch (error) {
    this.throw('NO_SUCH_OBJECT');
  }

  let xapi = this.getXAPI(SR);

  $wait(xapi.call('SR.scan', SR.ref));

  return true;
});
scan.permission = 'admin';
scan.params = {
  id: { type: 'string' },
};

export {scan};
