import * as engine from '@/app/engine';
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
  protected libraryConfigPath!: string;
  protected libraryConfig: engine.config.LibraryConfigFile | null = null;

  protected engineDb?: engine.EngineDB;

  get isProcessing(): boolean {
    return false;
  }

  created() {
    this.libraryFolder = engine.getLibraryFolder();
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

    this.engineDb = await engine.connect(this.libraryFolder);
  }

  protected async disconnectFromEngine() {
    await this.engineDb?.disconnect();
    this.engineDb = undefined;
  }
}
