import * as engine from '@/app/engine';
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';

@Component<BaseCommand>({
  beforeRouteLeave(_to, _from, next) {
    if (this.isProcessing) {
      next(false);
    } else {
      next();
    }
  },
})
export default class BaseCommand extends Vue {
  protected libraryFolder!: string;
  protected engineDb?: engine.EngineDB;
  protected libraryConfig: engine.config.LibraryConfigFile | null = null;

  get isProcessing(): boolean {
    return false;
  }

  libraryConfigPath = '';

  mounted() {
    const libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
    if (!libraryFolder) {
      throw new Error(`Engine library folder not set`);
    }
    this.libraryFolder = libraryFolder;

    this.libraryConfigPath = engine.config.getPath(this.libraryFolder);
  }

  async beforeDestroy() {
    await this.disconnectFromEngine();
  }

  protected async readLibraryConfig() {
    try {
      await engine.config.createDefaultIfNotFound(this.libraryFolder);
      this.libraryConfig = await engine.config.read(this.libraryFolder);
    } catch (e) {
      this.libraryConfig = null;
      throw e;
    }
  }

  protected async connectToEngine() {
    if (this.engineDb) {
      console.debug(`Already connected to Engine!`);
      return;
    }

    try {
      this.engineDb = await engine.connect(this.libraryFolder);
    } catch (e) {
      this.engineDb = undefined;
      e.message = `Couldn't connect to Engine. Ensure Engine isn't running.\n${e.message}`;
      throw e;
    }
  }

  protected async disconnectFromEngine() {
    await this.engineDb?.disconnect();
    this.engineDb = undefined;
  }
}
