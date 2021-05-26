import * as engine from '@/app/engine';
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class BaseCommand extends Vue {
  protected libraryFolder!: string;
  protected engineDb?: engine.EngineDB;
  protected libraryConfig: engine.config.LibraryConfigFile | null = null;

  libraryConfigPath = '';

  engineDbConnectError = '';
  libraryConfigReadError = '';

  mounted() {
    this.libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
    this.libraryConfigPath = engine.config.getLibraryConfigPath(
      this.libraryFolder,
    );
  }

  async beforeDestroy() {
    await this.disconnectFromEngine();
  }

  protected async readLibraryConfig() {
    try {
      this.libraryConfig = await engine.config.readLibraryConfig(
        this.libraryFolder,
      );
      this.libraryConfigReadError = '';
    } catch (e) {
      this.libraryConfig = null;
      console.log(e);
      this.libraryConfigReadError = e.message;
    }
  }

  protected async connectToEngine() {
    if (this.engineDb) {
      console.debug(`Already connected to Engine!`);
      return;
    }

    try {
      this.engineDb = await engine.connect(this.libraryFolder);
      this.engineDbConnectError = '';
    } catch (e) {
      this.engineDb = undefined;
      this.engineDbConnectError = e.message;
    }
  }

  protected async disconnectFromEngine() {
    await this.engineDb?.disconnect();
    this.engineDb = undefined;
  }
}
