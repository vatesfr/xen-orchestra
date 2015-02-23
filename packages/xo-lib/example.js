var xoLib = require('./');

var xo = new xoLib.Xo({
  url: 'localhost:9000',
});
xo.call('acl.get', {}).then(function (result) {
  console.log('baz', result);
}).catch(function (error) {
  console.log('error', error)
});

xo.signIn({
  email: 'admin@admin.net',
  password: 'admin',
}).then(function () {
  console.log('foo', xo.user);
}).catch(function (error) {
  console.log('error', error)
});

xo.signIn({
  email: 'tom',
  password: 'tom',
}).then(function () {
  console.log('bar', xo.user);
}).catch(function (error) {
  console.log('error', error)
});

xo.call('acl.get', {}).then(function (result) {
  console.log('plop', result);
}).catch(function (error) {
  console.log('error', error)
})
