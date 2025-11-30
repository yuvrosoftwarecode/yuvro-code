import restApiAuthUtil from '../utils/RestApiAuthUtil';

export const fetchContests = async () => {
  return restApiAuthUtil.get('/contests/');
}; 