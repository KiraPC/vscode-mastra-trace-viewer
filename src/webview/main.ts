/**
 * Webview entry point
 * Initializes Svelte app and sets up extension communication
 */

import { mount } from 'svelte';
import App from './App.svelte';
import './styles/global.css';

// Mount the Svelte app to the #app container
const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
