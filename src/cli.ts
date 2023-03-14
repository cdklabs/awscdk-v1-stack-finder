import { find } from './index';

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

find().catch(e => {
  console.log(e);
  process.exit(1);
});