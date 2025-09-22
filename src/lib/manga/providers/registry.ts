import { MangaProvider } from './base';
import { 
  MangaDexProvider, 
  ComickProvider, 
  MangaSee123Provider, 
  MangakakalotProvider, 
  MangaParkProvider 
} from './consumet';

export class ProviderRegistry {
  private providers: Map<string, MangaProvider> = new Map();

  constructor() {
    this.registerProvider(new MangaDexProvider());
    this.registerProvider(new ComickProvider());
    this.registerProvider(new MangaSee123Provider());
    this.registerProvider(new MangakakalotProvider());
    this.registerProvider(new MangaParkProvider());
  }

  private registerProvider(provider: MangaProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): MangaProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): MangaProvider[] {
    return Array.from(this.providers.values());
  }

  getProvidersByLanguage(language: string): MangaProvider[] {
    return this.getAllProviders().filter(provider => 
      provider.languages.includes(language)
    );
  }

  getProvidersSortedByPriority(): MangaProvider[] {
    return this.getAllProviders().sort((a, b) => b.priority - a.priority);
  }

  getProvidersWithPages(): MangaProvider[] {
    return this.getAllProviders().filter(provider => provider.supportsPages);
  }
}

export const providerRegistry = new ProviderRegistry();