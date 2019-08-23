import Router from './Router.js';
import { routerConfig } from './routerConfig.js';

const router = new Router();
// TODO impliment more router config
if (routerConfig.root) router.setRoot(routerConfig.root);
if (routerConfig.fourOFour) router.set404(routerConfig.fourOFour);
if (routerConfig.custom) {
  Object.keys(routerConfig.custom).forEach(key => {
    router.add(key, routerConfig.custom[key]);
  });
}
router.init();

window.router = router;
