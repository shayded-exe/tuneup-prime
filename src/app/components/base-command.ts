import * as engine from '@/app/engine';
import { appStore, AppStoreKey } from '@/store';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class BaseCommand extends Vue {
  protected libraryFolder!: string;
  protected engineDb?: engine.EngineDB;
  protected libraryConfig?: engine.config.LibraryConfigFile;

  mounted() {
    this.libraryFolder = appStore().get(AppStoreKey.EngineLibraryFolder);
  }

  async beforeDestroy() {
    await this.disconnectFromEngine();
  }

  protected async connectToEngine() {
    this.engineDb = await engine.connect(this.libraryFolder);
  }

  protected async disconnectFromEngine() {
    await this.engineDb?.disconnect();
  }

  protected async loadLibraryConfig() {
    this.libraryConfig = undefined;
    this.libraryConfig = await engine.config.readLibraryConfig(
      this.libraryFolder,
    );
  }
}
