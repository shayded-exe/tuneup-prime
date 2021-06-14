import { AppStore, AppStoreKey, WindowState } from '@/store';
import { BrowserWindow } from 'electron';
import { debounce } from 'lodash';

export class WindowStateTracker {
  private window?: BrowserWindow;
  private readonly debounceTime = 500;

  state?: WindowState;

  constructor(private readonly store: AppStore) {
    this.state = this.store.get(AppStoreKey.WindowState);
  }

  track(window: BrowserWindow) {
    this.window = window;
    const saveDebounce = debounce(() => this.saveState(), this.debounceTime);
    ['resize', 'move', 'close'].forEach(event => {
      window.addListener(event as any, saveDebounce);
    });
  }

  saveState() {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    const { x, y } = this.window.getBounds();
    this.state = { x, y };
    this.store.set(AppStoreKey.WindowState, this.state);
  }
}
