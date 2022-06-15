import { find } from './index';

find().catch(e => {
  console.log(e);
  process.exit(1);
});