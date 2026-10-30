import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { ensureDefaults } from './db/db';
import './styles.css';

registerSW({ immediate: true });

ensureDefaults().then(() => {
  render(<App />, document.getElementById('app')!);
});
