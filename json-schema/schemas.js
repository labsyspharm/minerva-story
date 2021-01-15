/* eslint global-require: 0 */

import { fromJS } from 'immutable';

export default fromJS([
  require('../schema/exhibit.schema.json'),
  require('../schema/waypoint.schema.json')
]);
