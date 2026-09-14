import { createHttpApi } from './httpApi.js';

// Board components import only this adapter, which now calls FastAPI.
export const taskApi = createHttpApi();
