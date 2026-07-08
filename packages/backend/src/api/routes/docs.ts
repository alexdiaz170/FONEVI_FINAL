import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from '../docs/openapi.js';

const router = Router();

router.use('/', swaggerUi.serve);
router.get(
  '/',
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'FONEVI API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: { persistAuthorization: true },
  }),
);

export default router;
