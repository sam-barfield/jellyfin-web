import { AppType } from '../../../../constants/appType';
import { AsyncRoute } from '../../../../components/router/AsyncRoute';

export const ASYNC_USER_ROUTES: AsyncRoute[] = [
    { path: 'home', type: AppType.Experimental },
    { path: 'homevideos', type: AppType.Experimental },
    { path: 'mypreferencesmenu', page: 'user/settings' },
    { path: 'quickconnect', page: 'quickConnect' },
    { path: 'search', page: 'search' },
    { path: 'calendar', type: AppType.Experimental },
    { path: 'userprofile', page: 'user/userprofile' }
];
