
import {coroutine, wait} from '../fibers-utils';
import {parseSize} from '../utils';

//====================================================================

let create = coroutine(function ({name, size, sr}) {
  let xapi = this.getXAPI(sr);

  let ref = wait(xapi.call('VDI.create', {
    name_label: name,
    other_config: {},
    read_only: false,
    sharable: false,
    SR: sr.ref,
    type: 'user',
    virtual_size: String(parseSize(size)),
  }));

  return wait(xapi.call('VDI.get_record', ref)).uuid;
});

create.description = 'create a new disk on a SR';

create.params = {
  name: { type: 'string' },
  size: { type: 'string' },
  sr: { type: 'string' },
};

create.resolve = {
  sr: ['sr', 'SR'],
};

export {create};
